import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SignalEvent } from './config';

const EVENT = 'signal';

export function userChannelName(userId: string) {
  return `calls:${userId}`;
}

/**
 * Subscribe to incoming signaling messages for a user.
 * Returns the channel and an unsubscribe function.
 */
export function subscribeSignals(
  userId: string,
  onEvent: (e: SignalEvent) => void
): { channel: RealtimeChannel; unsubscribe: () => void } {
  const channel = supabase.channel(userChannelName(userId), {
    config: { broadcast: { self: false, ack: false } },
  });

  channel
    .on('broadcast', { event: EVENT }, ({ payload }) => {
      try {
        onEvent(payload as SignalEvent);
      } catch (err) {
        console.error('[signaling] handler error', err);
      }
    })
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Send a signaling event to a target user. Uses a short-lived sender channel
 * so we do not interfere with the recipient's listener channel.
 */
export async function sendSignal(toUserId: string, payload: SignalEvent): Promise<void> {
  const ch = supabase.channel(userChannelName(toUserId), {
    config: { broadcast: { self: false, ack: true } },
  });
  await new Promise<void>((resolve) => {
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve();
    });
  });
  await ch.send({ type: 'broadcast', event: EVENT, payload });
  // Tear down the sender channel; recipient channel stays alive elsewhere.
  setTimeout(() => supabase.removeChannel(ch), 500);
}
