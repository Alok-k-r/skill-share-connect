CREATE TABLE public.call_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice','video')),
  call_status TEXT NOT NULL CHECK (call_status IN ('missed','completed','rejected','cancelled','failed','ongoing')),
  call_duration INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_history_caller ON public.call_history(caller_id, created_at DESC);
CREATE INDEX idx_call_history_receiver ON public.call_history(receiver_id, created_at DESC);

ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own call history"
ON public.call_history FOR SELECT TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert own call history"
ON public.call_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update own call history"
ON public.call_history FOR UPDATE TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);