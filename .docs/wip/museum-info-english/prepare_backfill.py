"""Generate an atomic, source-guarded SQL backfill from reviewed local text."""
import json
import pathlib
from translate import closure, opening

ROOT = pathlib.Path(__file__).parent
rows = json.loads((ROOT/'before.json').read_text())
expected = [{
    'id':r['id'], 'rstdeInfo':r['rstdeInfo'], 'open_hours':r['open_hours'],
    'rstdeInfo_en':closure(r['rstdeInfo']), 'open_hours_en':opening(r['open_hours']),
} for r in rows]
assert len({r['id'] for r in expected})==len(expected)
(ROOT/'expected.json').write_text(json.dumps(expected,ensure_ascii=False,indent=2))
payload = json.dumps(expected,ensure_ascii=False)
tag = '$museum_info_payload$'
assert tag not in payload
schema = (ROOT.parents[2]/'supabase/migrations/20261025000000_museum_info_english.sql').read_text()
sql = '''BEGIN;
LOCK TABLE public.museums IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE museum_info_before ON COMMIT DROP AS
  SELECT id, to_jsonb(m) AS original FROM public.museums m;
'''+schema+'''
CREATE TEMP TABLE museum_info_expected ON COMMIT DROP AS
  SELECT * FROM jsonb_to_recordset('''+tag+payload+tag+'''::jsonb)
    AS x(id bigint, "rstdeInfo" text, open_hours text, "rstdeInfo_en" text, open_hours_en text);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM museum_info_expected e LEFT JOIN public.museums m USING (id)
    WHERE m.id IS NULL OR m."rstdeInfo" IS DISTINCT FROM e."rstdeInfo"
      OR m.open_hours IS DISTINCT FROM e.open_hours
  ) THEN RAISE EXCEPTION 'Source rows changed since review; refresh and review first'; END IF;
END $$;

UPDATE public.museums m SET "rstdeInfo_en"=e."rstdeInfo_en"
FROM museum_info_expected e
WHERE m.id=e.id AND m."rstdeInfo" IS NOT DISTINCT FROM e."rstdeInfo"
  AND e."rstdeInfo_en" IS NOT NULL AND NULLIF(btrim(m."rstdeInfo_en"),'') IS NULL;

UPDATE public.museums m SET open_hours_en=e.open_hours_en
FROM museum_info_expected e
WHERE m.id=e.id AND m.open_hours IS NOT DISTINCT FROM e.open_hours
  AND e.open_hours_en IS NOT NULL AND NULLIF(btrim(m.open_hours_en),'') IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM museum_info_expected e JOIN public.museums m USING(id)
    JOIN museum_info_before b USING(id)
    WHERE m."rstdeInfo_en" IS DISTINCT FROM COALESCE(NULLIF(btrim(b.original->>'rstdeInfo_en'),''),e."rstdeInfo_en")
       OR m.open_hours_en IS DISTINCT FROM COALESCE(NULLIF(btrim(b.original->>'open_hours_en'),''),e.open_hours_en)
  ) THEN RAISE EXCEPTION 'Translation readback mismatch'; END IF;
  IF EXISTS (
    SELECT 1 FROM museum_info_before b JOIN public.museums m USING(id)
    WHERE (to_jsonb(m)-ARRAY['address_en','rstdeInfo_en','open_hours_en','updated_at'])
      IS DISTINCT FROM (b.original-ARRAY['address_en','rstdeInfo_en','open_hours_en','updated_at'])
    OR m.address_en IS DISTINCT FROM (b.original->>'address_en')
  ) THEN RAISE EXCEPTION 'Unrequested data changed'; END IF;
  IF (SELECT count(*) FROM museum_info_before)<>(SELECT count(*) FROM public.museums)
    THEN RAISE EXCEPTION 'Unexpected row count change'; END IF;
END $$;

SELECT jsonb_build_object(
  'rows',(SELECT count(*) FROM public.museums),
  'closure_translated',(SELECT count(*) FROM public.museums WHERE "rstdeInfo_en" IS NOT NULL),
  'hours_translated',(SELECT count(*) FROM public.museums WHERE open_hours_en IS NOT NULL),
  'closure_null_preserved',(SELECT count(*) FROM public.museums WHERE "rstdeInfo" IS NULL AND "rstdeInfo_en" IS NULL),
  'address_pending',(SELECT count(*) FROM public.museums WHERE address_en IS NULL),
  'originals_verified',true
) AS verification;
COMMIT;
'''
(ROOT/'backfill.sql').write_text(sql)
print('Prepared rows:',len(expected),'closure:',sum(r['rstdeInfo_en'] is not None for r in expected),'hours:',sum(r['open_hours_en'] is not None for r in expected))
