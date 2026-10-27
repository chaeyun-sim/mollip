"""Apply reviewed museum names; guard concurrent changes and verify persisted values.

Default is read-only. Use --apply for the user-authorized data backfill.
"""
import concurrent.futures
import datetime
import json
import pathlib
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[2] / 'scripts'))
from fill_museum_details import load_env, sb_get

LOCK = threading.Lock()


def run(apply=False):
    env = load_env()
    base, key = env['EXPO_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE']
    proposals = json.loads((ROOT / 'proposed.json').read_text())
    assert len({r['id'] for r in proposals}) == len(proposals)
    assert all(r['name_en'].strip() and r['sources'] for r in proposals)

    def get_all():
        rows, offset = [], 0
        while True:
            page = sb_get(f'/rest/v1/museums?select=*&order=id&limit=500&offset={offset}', base, key)
            rows.extend(page)
            if len(page) < 500:
                return rows
            offset += len(page)

    before = get_all()
    by_id = {r['id']: r for r in before}
    targets, skipped = [], []
    for proposal in proposals:
        row = by_id.get(proposal['id'])
        if not row or any(row.get(k) != proposal[k] for k in ['name', 'address', 'homepage_url']):
            skipped.append({'id': proposal['id'], 'reason': 'Source identity changed; manual review required'})
        elif (row.get('name_en') or '').strip():
            skipped.append({'id': proposal['id'], 'reason': 'Already populated; preserved'})
        else:
            targets.append(proposal)
    print(json.dumps({'reviewed':len(proposals), 'targets':len(targets), 'skipped':skipped, 'apply':apply}, ensure_ascii=False), flush=True)
    if not apply:
        return

    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    (ROOT / f'backup-{stamp}.json').write_text(json.dumps(before, ensure_ascii=False, indent=2))
    audit = ROOT / f'audit-{stamp}.jsonl'

    def update(proposal):
        row = by_id[proposal['id']]
        params = {'id': f'eq.{row["id"]}', 'select': 'id,name,name_en'}
        for field in ['name', 'address', 'homepage_url', 'name_en']:
            params[field] = 'is.null' if row.get(field) is None else f'eq.{row[field]}'
        url = base + '/rest/v1/museums?' + urllib.parse.urlencode(params)
        request = urllib.request.Request(url, data=json.dumps({'name_en':proposal['name_en']}).encode(), method='PATCH', headers={
            'apikey':key, 'Authorization':f'Bearer {key}', 'Content-Type':'application/json', 'Prefer':'return=representation',
        })
        result = {'id':row['id'], 'name':row['name'], 'name_en':proposal['name_en']}
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                returned = json.load(response)
            result['status'] = 'updated' if len(returned)==1 and returned[0]['name_en']==proposal['name_en'] else 'conflict'
        except Exception as error:
            # Never blindly repeat a mutation after losing the response.
            try:
                persisted = sb_get(f'/rest/v1/museums?id=eq.{row["id"]}&select=id,name_en', base, key)
                result['status'] = 'persisted_after_response_error' if len(persisted)==1 and persisted[0]['name_en']==proposal['name_en'] else 'failed'
            except Exception:
                result['status'] = 'unknown_requires_readback'
            result['error_type'] = type(error).__name__
        with LOCK:
            with audit.open('a') as handle:
                handle.write(json.dumps(result, ensure_ascii=False)+'\n')
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(update, targets))
    after = get_all()
    after_by_id = {r['id']:r for r in after}
    mismatches = [r['id'] for r in targets if after_by_id.get(r['id'],{}).get('name_en') != r['name_en']]
    unexpected = []
    for row in before:
        new = after_by_id.get(row['id'], {})
        changed = [k for k,v in row.items() if k not in ['name_en','updated_at'] and new.get(k)!=v]
        if changed:
            unexpected.append({'id':row['id'],'columns':changed})
    target_ids = {r['id'] for r in targets}
    unrequested = [r['id'] for r in before if r['id'] not in target_ids and after_by_id.get(r['id'],{}).get('name_en') != r.get('name_en')]
    report = {'timestamp_utc':stamp, 'before_count':len(before), 'after_count':len(after), 'reviewed':len(proposals),
              'attempted':len(targets), 'verified':len(targets)-len(mismatches), 'mismatches':mismatches,
              'unexpected_column_changes':unexpected, 'unrequested_name_changes':unrequested,
              'skipped':skipped, 'results':results, 'remaining_empty':sum(not (r.get('name_en') or '').strip() for r in after)}
    (ROOT / 'after.json').write_text(json.dumps(after,ensure_ascii=False,indent=2))
    (ROOT / 'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='results'},ensure_ascii=False), flush=True)
    if mismatches or unexpected or unrequested or len(before)!=len(after):
        raise SystemExit('Verification requires review')


if __name__ == '__main__':
    run('--apply' in sys.argv)
