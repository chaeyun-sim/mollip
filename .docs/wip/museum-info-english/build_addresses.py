"""Accept JUSO matches only when street/building number and region agree."""
import csv
import json
import pathlib
import re

ROOT=pathlib.Path(__file__).parent
PROVINCES=['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']
ALIASES={'서울특별시':'서울','서울시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종','경기도':'경기','강원특별자치도':'강원','강원도':'강원','충청북도':'충북','충청남도':'충남','전북특별자치도':'전북','전라북도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남','제주특별자치도':'제주','제주도':'제주'}

def compact(value):
    return re.sub(r'\s+','',value)

def region(value):
    # JUSO now returns the merged province name for both former regions.
    value=re.sub(r'^(?:전남광주통합특별시|광주광역시|전라남도|전남|광주)','MERGED_JG',value)
    for source,target in ALIASES.items():value=value.replace(source,target)
    return re.sub('[시군구]','',compact(value))

def region_matches(source,official):
    variants=[source]
    if '전남광주통합특별시' in source:
        variants=[source.replace('전남광주통합특별시',s) for s in ['광주','전남']]
    for variant in variants:
        want,have=region(variant),region(official)
        if want==have:return True
        if want in [region(p) for p in PROVINCES] and have.startswith(want):return True
        # Legacy Hwaseong addresses omit its newly created district.
        if '화성시' in source and not re.search(r'화성시[^읍면]*구',source) and want==region(re.sub(r'화성시\s*(?:효행|병점|만세|동탄)구','화성시',official)):return True
        # Some source addresses omit the province, e.g. 청주 상당구.
        if len(want)>=2 and not any(want.startswith(p) for p in PROVINCES) and have.endswith(want):return True
    return False

def matches(query,candidate):
    query=compact(query)
    if candidate.get('udrtYn')=='1' and '지하' not in query:return False
    rn=compact(candidate.get('rn',''))
    number=str(int(candidate.get('buldMnnm','0')))
    if int(candidate.get('buldSlno','0')):number+='-'+str(int(candidate['buldSlno']))
    suffix=rn+number
    if rn and query.endswith(suffix):
        source_region=query[:-len(suffix)]
        official=compact(candidate.get('roadAddrPart1',''))
        index=official.rfind(rn)
        return index>=0 and region_matches(source_region,official[:index])
    # A land-lot source may resolve to a modern road address. Match its lot exactly.
    lot=str(int(candidate.get('lnbrMnnm','0')))
    if int(candidate.get('lnbrSlno','0')):lot+='-'+str(int(candidate['lnbrSlno']))
    for locality in [candidate.get('liNm',''),candidate.get('emdNm','')]:
        suffix=locality+lot
        if locality and query.endswith(suffix):
            prefix=compact(candidate.get('jibunAddr','')).split(locality)[0]
            return region_matches(query[:-len(suffix)],prefix)
    return False

DETAILS={
    38:('서울아산병원 동관 1층 로비','1F Lobby, East Building, Asan Medical Center'),
    79:('홍익대학교 홍문관','Hongmungwan, Hongik University'),
    203:('서울과학기술대학교 다빈치관 2층','2F, Davinci Hall, Seoul National University of Science and Technology'),
    340:('예술의전당 한가람미술관','Hangaram Art Museum, Seoul Arts Center'),
    524:('(경남도립미술관)','Gyeongnam Art Museum'),
    752:(', 청목빌딩 1층','1F, Chungmok Building'),
    818:(', 계명대학교 2층 동산관(대명동)','2F, Dongsan Hall, Keimyung University'),
    878:('(서석동,조선대학교)','Chosun University'),
    1141:('롯데월드타워7층 롯데뮤지엄','7F, Lotte World Tower, Lotte Museum of Art'),
    1150:('예술의전당 서울서예박물관','Seoul Calligraphy Art Museum, Seoul Arts Center'),
    1152:('서울역(본옥) 문화역서울284','Culture Station Seoul 284, Seoul Station Main Building'),
    1153:('섬유센터빌딩 B1 (대치동994-31)','B1, Textile Center Building'),
    1159:('예술의전당 한가람디자인미술관','Hangaram Design Museum, Seoul Arts Center'),
    1167:('그랜드센트럴 3F','3F, Grand Central'),
    1168:('이스트폴 2F','2F, Eastpole'),
    1169:('고메이494 한남 B층','Basement, Gourmet 494 Hannam'),
    1180:('(평창동, 가나아트센터)','Gana Art Center'),
    1182:('3층 (눈사랑안경 3층)','3F, Nunsarang Optical'),
    1301:('우진문화공간','Woojin Art Space'),
    1352:(', 빌라쥬 드 아난티 엘.피. 크리스탈','L.P. Crystal, Village de Ananti'),
    1353:(', CGV 청주서문점 1층','1F, CGV Cheongju Seomun'),
    1354:(', 강북문화예술회관 3','3F, Gangbuk Culture and Arts Center'),
    1363:('(무실동), 정한프라자 4층','4F, Jeonghan Plaza'),
}

def detail(ident,value):
    value=value.strip()
    if ident in DETAILS and value==DETAILS[ident][0]:return DETAILS[ident][1]
    # Dong/land-lot parentheticals are reference labels, not unit/floor information.
    value=re.sub(r'\([가-힣0-9]+(?:동|가)(?:\s*\d+(?:-\d+)?)?\)','',value)
    value=value.strip(' ,')
    if not value:return ''
    if value=='지하':return 'Basement'
    m=re.fullmatch(r'지하\s*(\d+)층',value)
    if m:return 'B'+m[1]
    m=re.fullmatch(r'(\d+)(?:층|F)',value)
    if m:return m[1]+'F'
    m=re.fullmatch(r'B(\d+)(?:F)?',value)
    if m:return 'B'+m[1]
    m=re.fullmatch(r'(\d+)호',value)
    if m:return 'Room '+m[1]
    if re.fullmatch(r'\(\d+층(?:,\s*\d+층)+\)',value):
        return '/'.join(n+'F' for n in re.findall(r'\d+',value))
    m=re.fullmatch(r'\((\d+)관\)',value)
    if m:return 'Hall '+m[1]
    raise ValueError('Unreviewed detail: '+value)

def build():
    rows={r['id']:r for r in json.loads((ROOT/'address-before.json').read_text())}
    targets=json.loads((ROOT/'address-targets.json').read_text())
    results={r['query']:r for r in map(json.loads,(ROOT/'juso-results.jsonl').read_text().splitlines())}
    proposals,pending=[],[]
    for target in targets:
        if target['id']==878:
            # The university publishes a campus postal address; JUSO has no
            # exact building-level record for it. Preserve its official English form.
            assert target['address']=='광주광역시 동구 필문대로 309(서석동,조선대학교)'
            proposals.append({'id':878,'name':rows[878]['name'],'address':target['address'],
                              'address_en':'Chosun University, 309 Pilmun-daero, Dong-gu, Gwangju',
                              'source_url':'https://eng.chosun.ac.kr/eng/1853/subview.do',
                              'basis':'Official university English campus postal address; JUSO exact building record unavailable', 'parts':[]})
            continue
        accepted=[]
        for part in target['parts']:
            result=results.get(part['query'],{}).get('results',{})
            candidates=[c for c in result.get('juso',[]) if c.get('engAddr') and matches(part['query'],c)]
            unique={c['engAddr']:c for c in candidates}
            if len(unique)!=1:
                pending.append({'id':target['id'],'name':rows[target['id']]['name'],'address':target['address'],'query':part['query'],'reason':'No exact official match' if not unique else 'Ambiguous official matches','candidate_count':len(result.get('juso',[]))})
                break
            candidate=next(iter(unique.values()))
            try:extra=detail(target['id'],part['detail'])
            except ValueError as error:
                pending.append({'id':target['id'],'name':rows[target['id']]['name'],'address':target['address'],'query':part['query'],'reason':str(error)});break
            english=(extra+', ' if extra else '')+candidate['engAddr']
            accepted.append({'query':part['query'],'detail_source':part['detail'],'detail_en':extra,'address_en':english,'official':candidate})
        else:
            translated=' / '.join(p['address_en'] for p in accepted)
            assert not re.search('[가-힣]',translated),translated
            proposal={'id':target['id'],'name':rows[target['id']]['name'],'address':target['address'],'address_en':translated,'parts':accepted}
            if target.get('lookup_correction'):proposal['lookup_correction']=target['lookup_correction']
            proposals.append(proposal)
    (ROOT/'address-proposed.json').write_text(json.dumps(proposals,ensure_ascii=False,indent=2))
    (ROOT/'address-pending.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2))
    with (ROOT/'address-review.csv').open('w',encoding='utf-8-sig',newline='') as handle:
        writer=csv.writer(handle);writer.writerow(['id','name','address','address_en']);writer.writerows([r[k] for k in ['id','name','address','address_en']] for r in proposals)
    print('Accepted',len(proposals),'pending',len(pending))
    for p in pending:print(json.dumps(p,ensure_ascii=False))

if __name__=='__main__':build()
