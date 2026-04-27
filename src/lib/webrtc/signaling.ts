import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SignalEvent } from './config';

const EVENT = 'signal';

export function userChannelName(userId: string) {
  return `calls:${userId}`;
}

/**
 * Subscribe to incoming signaling messages for a user.
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
        console.log('[signaling] ◀ recv', (payload as SignalEvent)?.type, payload);
        onEvent(payload as SignalEvent);
      } catch (err) {
        console.error('[signaling] handler error', err);
      }
    })
    .subscribe((status) => {
      console.log('[signaling] listener', userChannelName(userId), status);
    });

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Long-lived sender channel cache keyed by target user. Reusing the same
 * channel keeps message ordering and avoids tearing down before ICE
 * candidates flush — which was the root cause of frequent "stuck on
 * connecting" failures.
 */
const senderCache = new Map<
  string,
  { channel: RealtimeChannel; ready: Promise<void> }
>();

function getSender(toUserId: string) {
  const cached = senderCache.get(toUserId);
  if (cached) return cached;

  const channel = supabase.channel(userChannelName(toUserId), {
    config: { broadcast: { self: false, ack: true } },
  });

  const ready = new Promise<void>((resolve, reject) => {
    let settled = false;
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && !settled) {
        settled = true;
        resolve();
      } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !settled) {
        settled = true;
        reject(new Error(`signaling channel ${status}`));
      }
    });
  });

  const entry = { channel, ready };
  senderCache.set(toUserId, entry);
  return entry;
}

export async function sendSignal(toUserId: string, payload: SignalEvent): Promise<void> {
  const { channel, ready } = getSender(toUserId);
  try {
    await ready;
  } catch (err) {
    console.warn('[signaling] sender not ready, recreating', err);
    senderCache.delete(toUserId);
    const fresh = getSender(toUserId);
    await fresh.ready;
    await fresh.channel.send({ type: 'broadcast', event: EVENT, payload });
    console.log('[signaling] ▶ sent', payload.type, '→', toUserId);
    return;
  }
  await channel.send({ type: 'broadcast', event: EVENT, payload });
  console.log('[signaling] ▶ sent', payload.type, '→', toUserId);
}

export function disposeSender(toUserId: string) {
  const entry = senderCache.get(toUserId);
  if (entry) {
    supabase.removeChannel(entry.channel);
    senderCache.delete(toUserId);
  }
}
