-- 푸시 알림 토큰 저장
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token text;

COMMENT ON COLUMN public.profiles.push_token IS 'Expo 푸시 토큰 — 알림 발송에 사용';

-- push_token 조회 성능 최적화 (Edge Function 배치 발송용)
CREATE INDEX IF NOT EXISTS idx_profiles_push_token_not_null
  ON public.profiles(push_token)
  WHERE push_token IS NOT NULL;

-- RLS: 사용자는 자신의 push_token만 읽기/쓰기 가능
-- Edge Function은 service_role_key를 사용하므로 RLS를 우회합니다
CREATE POLICY IF NOT EXISTS "users_can_update_own_push_token"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
