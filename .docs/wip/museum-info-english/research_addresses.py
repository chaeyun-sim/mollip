"""Fetch official JUSO address candidates. Read-only; credentials stay in POST body."""
import concurrent.futures
import json
import pathlib
import re
import threading
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).parent
REPO = ROOT.parents[2]
ROAD = re.compile(r'^(.*?(?:대로|로|길)\s*\d+(?:-\d+)?)(?=[\s(,/]|$)(.*)$')


def parts(address):
    address = re.sub(r'\s+',' ',address).strip()
    # Two museum buildings, each with its own street address.
    address = address.replace('(1관)충청북도','(1관) / 충청북도')
    chunks = re.split(r'\s*/\s*(?=(?:서울|경기|강원|충청|전라|전북|제주|부산|대구|인천|울산|광주|대전))',address)
    out=[]
    for chunk in chunks:
        match=ROAD.match(chunk)
        base,detail=(match[1],match[2].strip()) if match else (chunk,'')
        # The same street has two building numbers, not a room number.
        if re.fullmatch(r',\s*\d+-\d+',detail):
            out.append({'query':base,'detail':''})
            out.append({'query':re.sub(r'\d+(?:-\d+)?$',detail.lstrip(', '),base),'detail':''})
        else:
            out.append({'query':base,'detail':detail})
    return out


def load_key():
    for file in [REPO/'.env.local',REPO/'.env']:
        for line in file.read_text().splitlines():
            if line.strip().startswith('JUSO_CONFM_KEY='):
                return line.split('=',1)[1].strip().strip('\"').strip("'")
    raise RuntimeError('JUSO_CONFM_KEY missing')


if __name__=='__main__':
    key=load_key()
    rows=json.loads((ROOT/'address-before.json').read_text())
    corrections={51:('효령료72길','효령로72길'),83:('효행로707번기','효행로707번길'),641:('조첩읍','조천읍'),
                 196:('인천광역시 동구','인천 제물포구'),1368:('인천 중구','인천 제물포구'),
                 878:('광주광역시','전남광주통합특별시'),
                 5:('둔산대로 152','둔산대로 157'),14:('보문로 484-79','보문로 484-7'),
                 44:('학사대길 90-14','남산공원길 90-14'),
                 1447:('여의도동 85','여의동로 330')}
    targets=[]
    for r in rows:
        if (r.get('address_en') or '').strip():continue
        query_address=r['address']
        if r['id'] in corrections:
            old,new=corrections[r['id']]
            assert old in query_address
            query_address=query_address.replace(old,new)
        target={'id':r['id'],'address':r['address'],'parts':parts(query_address)}
        if query_address!=r['address']:target['lookup_correction']=query_address
        targets.append(target)
    (ROOT/'address-targets.json').write_text(json.dumps(targets,ensure_ascii=False,indent=2))
    queries=sorted({part['query'] for r in targets for part in r['parts']})
    cache=ROOT/'juso-results.jsonl'
    done={}
    if cache.exists():
        done={r['query']:r for r in map(json.loads,cache.read_text().splitlines()) if 'results' in r}
    lock=threading.Lock()
    count=[0]

    def fetch(query):
        if query in done:
            return done[query]
        params={'confmKey':key,'currentPage':1,'countPerPage':100,'keyword':query,'resultType':'json'}
        req=urllib.request.Request('https://business.juso.go.kr/addrlink/addrLinkApi.do',data=urllib.parse.urlencode(params).encode(),headers={'Content-Type':'application/x-www-form-urlencoded'})
        result={'query':query}
        try:
            with urllib.request.urlopen(req,timeout=30) as response:
                result.update(json.load(response))
        except Exception as error:
            result['error_type']=type(error).__name__
        with lock:
            with cache.open('a') as handle:handle.write(json.dumps(result,ensure_ascii=False)+'\n')
            count[0]+=1
            if count[0]%50==0:print('Fetched',count[0],'queries',flush=True)
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(fetch,queries))
    print('Unique queries',len(queries),'API success',sum(r.get('results',{}).get('common',{}).get('errorCode')=='0' for r in results),flush=True)
