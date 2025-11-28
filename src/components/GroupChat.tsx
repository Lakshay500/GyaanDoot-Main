import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send, Paperclip, Download } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { usePresence } from "@/hooks/usePresence";

interface Message {
  id: string;
  user_id: string;
  content: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  profiles?: { full_name: string };
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

export const GroupChat = ({ groupId, groupName }: GroupChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>(null);
  
  // Initialize presence channel
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase.channel(`group-chat-${groupId}`, {
      config: { presence: { key: user.id } }
    });
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence state:', state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            username: user.email?.split('@')[0] || 'User',
            typing: false,
          });
        }
      });
    
    channelRef.current = channel;
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupId]);
  
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  
  useEffect(() => {
    if (!channelRef.current) return;
    
    const channel = channelRef.current;
    const handlePresenceSync = () => {
      const state = channel.presenceState();
      const typing = Object.values(state)
        .flat()
        .filter((p: any) => p.typing && p.userId !== user?.id);
      setTypingUsers(typing);
    };
    
    channel.on('presence', { event: 'sync' }, handlePresenceSync);
    
    return () => {
      channel.off('presence', handlePresenceSync);
    };
  }, [user]);

  useEffect(() => {
    if (user && groupId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [user, groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('group_chat_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Fetch profiles separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const enrichedMessages = data.map(msg => ({
        ...msg,
        profiles: profileMap.get(msg.user_id)
      }));

      setMessages(enrichedMessages as Message[]);
    } else {
      setMessages([]);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`group-${groupId}-messages`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_chat_messages',
        filter: `group_id=eq.${groupId}`
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', payload.new.user_id)
          .single();

        setMessages(prev => [...prev, { ...payload.new as Message, profiles: profile }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const updateTypingStatus = async (typing: boolean) => {
    if (!channelRef.current || !user) return;
    
    await channelRef.current.track({
      userId: user.id,
      username: user.email?.split('@')[0] || 'User',
      typing,
    });
  };
  
  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('group_chat_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: newMessage
        });

      if (error) throw error;

      setNewMessage("");
      setIsTyping(false);
      updateTypingStatus(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      const { error: messageError } = await supabase
        .from('group_chat_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: `Shared a file: ${file.name}`,
          file_url: publicUrl,
          file_name: file.name
        });

      if (messageError) throw messageError;

      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{groupName} Chat</span>
          <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            <div className="flex -space-x-2">
              {typingUsers.slice(0, 3).map((p: any, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground border-2 border-background"
                >
                  {p.username?.charAt(0) || '?'}
                </div>
              ))}
            </div>
            <span>{typingUsers.length} online</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${message.user_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                    {message.user_id !== user?.id && (
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {message.profiles?.full_name || 'Unknown'}
                      </p>
                    )}
                    <p className="text-sm break-words">{message.content}</p>
                    {message.file_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-auto p-1"
                        onClick={() => window.open(message.file_url, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {message.file_name}
                      </Button>
                    )}
                    <p className="text-xs opacity-50 mt-1">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground italic"
              >
                {typingUsers.map((u: any) => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </motion.div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
