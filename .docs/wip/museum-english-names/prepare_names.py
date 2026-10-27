"""Build the reviewed-only proposal and source manifest without touching the DB."""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
ko = {r['id']:r for r in json.loads((ROOT/'homepage-research-ko.json').read_text())}
en = {r['id']:r for r in json.loads((ROOT/'homepage-research.json').read_text())}
rows = {r['id']:r for r in json.loads((ROOT/'current.json').read_text())}
reviewed = {int(i):n for i,n in (line.split('\t') for line in (ROOT/'reviewed.tsv').read_text().splitlines())}
extra = {int(i):(n,url) for i,n,url in (line.split('\t') for line in (ROOT/'supplemental.tsv').read_text().splitlines())}
reviewed.update({i:n for i,(n,url) in extra.items()})

def normalized(value):
    return re.sub('[^a-z0-9]','',html.unescape(value).lower())

proposals = []
for ident,name_en in sorted(reviewed.items()):
    row = rows[ident]
    sources = []
    if ident in extra:
        sources.append({'url':extra[ident][1], 'basis':'Manually reviewed official institution / tourism source'})
    for documents in [ko,en]:
        doc = documents.get(ident,{})
        for field in ['titles','alts','metadata','english']:
            evidence = next((s for s in doc.get(field,[]) if normalized(name_en) in normalized(s)),None)
            if evidence:
                sources.append({'url':doc.get('resolved_url',doc.get('homepage_url')), 'basis':field, 'evidence':evidence[:450]})
                break
    assert sources, (ident,name_en)
    proposals.append({'id':ident,'name':row['name'],'address':row['address'],'homepage_url':row['homepage_url'],
                      'name_en':name_en,'previous_name_en':row['name_en'],'sources':sources})
(ROOT/'proposed.json').write_text(json.dumps(proposals,ensure_ascii=False,indent=2))
print(f'Reviewed proposals: {len(proposals)}; unverified: {len(rows)-len(proposals)}')
