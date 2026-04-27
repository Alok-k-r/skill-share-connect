import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type CallStatusValue =
  | 'missed'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'failed'
  | 'ongoing';

export type CallTypeValue = 'voice' | 'video';

export interface CallHistoryRow {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: CallTypeValue;
  call_status: CallStatusValue;
  call_duration: number;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  caller?: { id: string; display_name: string; username: string; avatar_url: string | null } | null;
  receiver?: { id: string; display_name: string; username: string; avatar_url: string | null } | null;
}

interface ProfileLite {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

/** Insert a new call history record. Returns the inserted row id. */
export async function createCallHistory(args: {
  caller_id: string;
  receiver_id: string;
  call_type: CallTypeValue;
  call_status: CallStatusValue;
  started_at?: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('call_history')
    .insert({
      caller_id: args.caller_id,
      receiver_id: args.receiver_id,
      call_type: args.call_type,
      call_status: args.call_status,
      started_at: args.started_at ?? new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) {
    console.warn('[call-history] insert failed', error);
    return null;
  }
  return data?.id ?? null;
}

/** Update an existing call history record (status, duration, ended_at). */
export async function updateCallHistory(
  id: string,
  patch: Partial<Pick<CallHistoryRow, 'call_status' | 'call_duration' | 'ended_at'>>
) {
  const { error } = await supabase.from('call_history').update(patch).eq('id', id);
  if (error) console.warn('[call-history] update failed', error);
}

export function useCallHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['call-history', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CallHistoryRow[]> => {
      const { data, error } = await supabase
        .from('call_history')
        .select('*')
        .or(`caller_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = (data ?? []) as CallHistoryRow[];

      // Batch-load related profiles to avoid N+1 queries.
      const ids = Array.from(
        new Set(rows.flatMap((r) => [r.caller_id, r.receiver_id]))
      );
      if (ids.length === 0) return rows;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', ids);
      const map = new Map<string, ProfileLite>();
      (profiles ?? []).forEach((p: any) => map.set(p.id, p));

      return rows.map((r) => ({
        ...r,
        caller: map.get(r.caller_id) ?? null,
        receiver: map.get(r.receiver_id) ?? null,
      }));
    },
  });
}
