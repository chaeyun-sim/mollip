-- SPEC-EXHIBITIONS-API-001 rollback: table replaced by direct client-side calls to
-- the existing 문화포털 공공데이터 API (src/api/culture.ts). See spec.md withdrawal note.
drop policy if exists "exhibitions_public_read" on public.exhibitions;
drop table if exists public.exhibitions;
