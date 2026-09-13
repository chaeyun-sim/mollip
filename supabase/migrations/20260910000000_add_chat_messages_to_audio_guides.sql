-- audio_guides에 AI 도슨트 채팅 내역 저장용 컬럼 추가 (티켓 화면 표시용)
alter table public.audio_guides
  add column if not exists chat_messages jsonb;

comment on column public.audio_guides.chat_messages is 'AI 도슨트와의 채팅 내역(역할/텍스트 배열) — 방문 티켓 화면에 표시';
