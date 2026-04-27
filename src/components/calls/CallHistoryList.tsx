import { ArrowDownLeft, ArrowUpRight, Phone, PhoneMissed, Video, PhoneOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCallHistory, type CallHistoryRow } from '@/hooks/useCallHistory';
import { cn } from '@/lib/utils';

function formatDuration(sec: number) {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function statusBadge(status: CallHistoryRow['call_status']) {
  switch (status) {
    case 'completed':
      return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
    case 'missed':
      return <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">Missed</Badge>;
    case 'rejected':
      return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">Rejected</Badge>;
    case 'cancelled':
      return <Badge variant="outline">Cancelled</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'ongoing':
      return <Badge>Ongoing</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function CallHistoryList() {
  const { user } = useAuth();
  const { data, isLoading } = useCallHistory();

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-muted-foreground py-16">
        <PhoneOff className="h-10 w-10 mb-3 opacity-60" />
        <p className="text-sm">No call history yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {data.map((row) => {
        const isOutgoing = row.caller_id === user?.id;
        const peer = isOutgoing ? row.receiver : row.caller;
        const isMissed = row.call_status === 'missed' && !isOutgoing;

        return (
          <div
            key={row.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <Avatar className="h-11 w-11">
              <AvatarImage src={peer?.avatar_url || ''} alt={peer?.display_name || ''} />
              <AvatarFallback>{peer?.display_name?.[0] || '?'}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn('font-medium truncate', isMissed && 'text-red-600')}>
                  {peer?.display_name || 'Unknown'}
                </p>
                {row.call_type === 'video' ? (
                  <Video className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {isMissed ? (
                  <PhoneMissed className="h-3 w-3 text-red-600" />
                ) : isOutgoing ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownLeft className="h-3 w-3" />
                )}
                <span>{isOutgoing ? 'Outgoing' : 'Incoming'}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}</span>
                {row.call_duration > 0 && (
                  <>
                    <span>·</span>
                    <span>{formatDuration(row.call_duration)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0">{statusBadge(row.call_status)}</div>
          </div>
        );
      })}
    </div>
  );
}
