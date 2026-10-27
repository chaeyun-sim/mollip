"""Independent REST readback after the atomic address update."""
import json
import pathlib
import sys

ROOT=pathlib.Path(__file__).parent
sys.path.insert(0,str(ROOT.parents[2]/'scripts'))
from fill_museum_details import load_env,sb_get

env=load_env()
rows=sb_get('/rest/v1/museums?select=*&order=id&limit=1000',env['EXPO_PUBLIC_SUPABASE_URL'],env['SUPABASE_SERVICE_ROLE'])
expected={r['id']:r for r in json.loads((ROOT/'address-proposed.json').read_text())}
before={r['id']:r for r in json.loads((ROOT/'address-current.json').read_text())}
mismatches=[]
changes=[]
for row in rows:
    proposal=expected.get(row['id'])
    if proposal and row.get('address_en')!=proposal['address_en']:
        mismatches.append(row['id'])
    if row['id'] in before:
        for field,value in before[row['id']].items():
            if field not in ['address_en','updated_at'] and row.get(field)!=value:
                changes.append({'id':row['id'],'field':field})
report={
    'rows':len(rows),'addresses_verified':sum(r['id'] in expected and r.get('address_en')==expected[r['id']]['address_en'] for r in rows),
    'address_null':sum(r.get('address_en') is None for r in rows),
    'closure_translated':sum(r.get('rstdeInfo_en') is not None for r in rows),
    'hours_translated':sum(r.get('open_hours_en') is not None for r in rows),
    'closure_null_preserved':sum(r.get('rstdeInfo') is None and r.get('rstdeInfo_en') is None for r in rows),
    'mismatches':mismatches,'other_changes_since_latest_snapshot':changes,
    'deleted_since_research':sorted(set(expected)-{r['id'] for r in rows}),
}
(ROOT/'after-address.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
(ROOT/'address-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
assert not mismatches
assert report['addresses_verified']==len(rows)
assert not changes
