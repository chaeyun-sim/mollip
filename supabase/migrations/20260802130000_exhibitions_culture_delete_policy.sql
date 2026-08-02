-- 앱에서 source='culture' 캐시를 갈아끼울 때 DELETE 필요 (기존엔 INSERT만 가능했음)
create policy "exhibitions_culture_delete"
  on public.exhibitions
  for delete
  to anon, authenticated
  using (source = 'culture');
