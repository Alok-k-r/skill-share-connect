import { useState, useEffect } from 'react';
import { Search, Send, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConversations, useMessages, useSendMessage, useMarkConversationRead, ConversationWithProfile } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useCall } from '@/hooks/useCall';

export default function Messages() {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithProfile | null>(null);
  const { data: chatMessages } = useMessages(selectedConversation?.id);
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();
  const { startCall } = useCall();
  const [newMessage, setNewMessage] = useState('');

  // Mark conversation as read when opened
  useEffect(() => {
    if (selectedConversation && user) {
      markRead.mutate({ conversationId: selectedConversation.id, userId: user.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, user?.id]);

  // Hardware/browser back button: close open chat instead of leaving page
  useEffect(() => {
    if (!selectedConversation) return;
    window.history.pushState({ chatOpen: true }, '');
    const onPop = () => setSelectedConversation(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [selectedConversation?.id]);

  const closeChat = () => {
    if (window.history.state?.chatOpen) {
      window.history.back();
    } else {
      setSelectedConversation(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;
    sendMessage.mutate({
      conversationId: selectedConversation.id,
      senderId: user.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const handleStartCall = (kind: 'voice' | 'video') => {
    if (!selectedConversation) return;
    startCall(
      {
        id: selectedConversation.other_user.id,
        display_name: selectedConversation.other_user.display_name,
        username: selectedConversation.other_user.username,
        avatar_url: selectedConversation.other_user.avatar_url,
      },
      kind
    );
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-2">Not logged in</h1>
          <p className="text-muted-foreground">Sign in to view your messages</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-2rem)] flex">
        {/* Conversations List */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r bg-card flex flex-col",
          selectedConversation && "hidden md:flex"
        )}>
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-10" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left",
                    selectedConversation?.id === conv.id && "bg-muted"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.other_user.avatar_url || ''} alt={conv.other_user.display_name} />
                      <AvatarFallback>{conv.other_user.display_name[0]}</AvatarFallback>
                    </Avatar>
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary text-xs text-primary-foreground flex items-center justify-center font-medium">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">{conv.other_user.display_name}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No conversations yet
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-background",
          !selectedConversation && "hidden md:flex"
        )}>
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={closeChat}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.other_user.avatar_url || ''} alt={selectedConversation.other_user.display_name} />
                    <AvatarFallback>{selectedConversation.other_user.display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConversation.other_user.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{selectedConversation.other_user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleCallUnavailable('voice')}><Phone className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleCallUnavailable('video')}><Video className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages?.map((msg) => {
                  const isCurrentUser = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2",
                        isCurrentUser
                          ? "gradient-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t bg-card">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="gradient" size="icon" disabled={sendMessage.isPending}>
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
