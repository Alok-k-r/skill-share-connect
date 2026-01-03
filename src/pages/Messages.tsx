import { useState } from 'react';
import { Search, Send, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { messages, currentUser } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Message } from '@/types';

const chatMessages = [
  { id: '1', senderId: '2', text: 'Hey! I saw your piano teaching post. I\'d love to exchange skills!', time: '10:30 AM' },
  { id: '2', senderId: '1', text: 'That sounds great! I\'m definitely interested in learning web development.', time: '10:32 AM' },
  { id: '3', senderId: '2', text: 'Perfect! I can teach you React and JavaScript. When would you like to start?', time: '10:35 AM' },
  { id: '4', senderId: '1', text: 'How about this weekend? We could do a 1-hour exchange session.', time: '10:38 AM' },
  { id: '5', senderId: '2', text: 'That sounds great! When would you like to start?', time: '10:40 AM' },
];

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setNewMessage('');
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-2rem)] flex">
        {/* Conversations List */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r bg-card flex flex-col",
          selectedConversation && "hidden md:flex"
        )}>
          {/* Header */}
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-10" />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {messages.map((message) => (
              <button
                key={message.id}
                onClick={() => setSelectedConversation(message)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left",
                  selectedConversation?.id === message.id && "bg-muted"
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={message.user.avatar} alt={message.user.displayName} />
                    <AvatarFallback>{message.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  {message.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary text-xs text-primary-foreground flex items-center justify-center font-medium">
                      {message.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{message.user.displayName}</p>
                    <span className="text-xs text-muted-foreground">{message.createdAt}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{message.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-background",
          !selectedConversation && "hidden md:flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.user.avatar} alt={selectedConversation.user.displayName} />
                    <AvatarFallback>{selectedConversation.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConversation.user.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{selectedConversation.user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => {
                  const isCurrentUser = msg.senderId === '1';
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isCurrentUser ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          isCurrentUser
                            ? "gradient-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-card">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="gradient" size="icon">
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
                <p className="text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
