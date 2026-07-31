import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Send, ArrowRight, User as UserIcon, Loader2, Package, CheckCheck } from 'lucide-react';
import { StoredUser, User } from '../types';
import { getRelative } from '../utils/time';

export interface Chat {
  id: string;
  ad_id?: string;
  ad_title?: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  other_user_phone?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ChatViewProps {
  currentUser: User | StoredUser | null;
  activeChatId?: string | null;
  onClose?: () => void;
  onOpenAuth?: () => void;
}

export function ChatView({ currentUser, activeChatId: initialChatId, onClose, onOpenAuth }: ChatViewProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    if (!currentUser) return;
    setLoadingChats(true);
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const updatedChats = await Promise.all(
          data.map(async (chat: Chat) => {
            const otherUserId = chat.buyer_id === currentUser.id ? chat.seller_id : chat.buyer_id;
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, phone')
              .eq('id', otherUserId)
              .single();

            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .eq('is_read', false)
              .neq('sender_id', currentUser.id);

            return {
              ...chat,
              other_user_name: profile?.full_name || 'مستخدم سوق بغداد',
              other_user_avatar: profile?.avatar_url,
              other_user_phone: profile?.phone,
              unread_count: count || 0
            };
          })
        );

        setChats(updatedChats);

        if (initialChatId) {
          const target = updatedChats.find(c => c.id === initialChatId);
          if (target) setSelectedChat(target);
        }
      }
    } catch (e) {
      console.error('Error fetching chats:', e);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const chatChannel = supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats'
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [currentUser]);

  const fetchMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      if (currentUser) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('chat_id', chatId)
          .neq('sender_id', currentUser.id)
          .eq('is_read', false);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);

      const messageChannel = supabase
        .channel(`chat_messages:${selectedChat.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${selectedChat.id}`
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages(prev => {
              // Avoid duplicate if optimistic message exists
              if (prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.sender_id === newMsg.sender_id && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000))) {
                return prev.map(m => (m.content === newMsg.content && m.sender_id === newMsg.sender_id ? newMsg : m));
              }
              return [...prev, newMsg];
            });

            if (currentUser && newMsg.sender_id !== currentUser.id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMsg.id);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${selectedChat.id}`
          },
          (payload) => {
            const updatedMsg = payload.new as Message;
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [selectedChat, currentUser]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser || sending) return;

    const content = newMessage.trim();
    const tempId = 'temp-' + Date.now();
    const tempMsg: Message = {
      id: tempId,
      chat_id: selectedChat.id,
      sender_id: currentUser.id,
      content,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Optimistic UI update for instant feedback
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    setSending(true);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: currentUser.id,
          content
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      // Only remove if failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('تعذر إرسال الرسالة: ' + (err.message || 'خطأ في الاتصال'));
      setNewMessage(content);
    } finally {
      setSending(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-900 rounded-3xl border border-gray-800 my-8">
        <MessageSquare className="w-16 h-16 text-amber-400 mb-4 opacity-80 animate-bounce" />
        <h3 className="text-xl font-bold text-white mb-2">المحادثات الفورية 💬</h3>
        <p className="text-gray-400 text-sm max-w-md mb-6">
          يرجى تسجيل الدخول للتمكن من المراسلة والتواصل المباشر مع البائعين والمشترين داخل منصة سوق بغداد.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold rounded-2xl text-sm shadow-lg hover:scale-105 transition-all"
        >
          تسجيل الدخول الآن 🚀
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[650px] max-w-5xl mx-auto my-4 text-right" dir="rtl">
      {/* Sidebar: Chats List */}
      <div className={`w-full md:w-80 border-b md:border-b-0 md:border-l border-gray-800 flex flex-col bg-gray-950 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-bold text-lg">المحادثات 💬</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
              ✕
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-800/50">
          {loadingChats ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs">جاري تحميل المحادثات...</span>
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              لا توجد لديك محادثات حالياً.
            </div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-4 flex items-center gap-3 transition-colors hover:bg-gray-900 text-right ${
                  selectedChat?.id === chat.id ? 'bg-gray-850 border-r-4 border-amber-400' : ''
                }`}
              >
                <div className="relative shrink-0">
                  {chat.other_user_avatar ? (
                    <img src={chat.other_user_avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                  {chat.unread_count && chat.unread_count > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {chat.unread_count}
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-bold text-sm truncate">{chat.other_user_name}</h4>
                    {chat.last_message_time && (
                      <span className="text-[10px] text-gray-500 shrink-0">{getRelative(chat.last_message_time)}</span>
                    )}
                  </div>
                  {chat.ad_title && (
                    <div className="text-[11px] text-amber-400/90 truncate mb-1 flex items-center gap-1">
                      <Package className="w-3 h-3 shrink-0" />
                      <span>{chat.ad_title}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 truncate">{chat.last_message || 'محادثة جديدة'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-900 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden text-gray-400 hover:text-white p-1"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                {selectedChat.other_user_avatar ? (
                  <img src={selectedChat.other_user_avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-white font-bold text-sm">{selectedChat.other_user_name}</h3>
                  {selectedChat.ad_title && (
                    <span className="text-xs text-amber-400/90 flex items-center gap-1">
                      بخصوص: {selectedChat.ad_title}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-12">
                  ابدأ المحادثة الآن بإرسال رسالة 💬
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? 'bg-amber-500 text-black font-medium rounded-tr-none'
                            : 'bg-gray-800 text-white rounded-tl-none border border-gray-700/50'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1.5 text-[10px] mt-1 ${isMe ? 'text-black/75 justify-end' : 'text-gray-400 justify-start'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            <div className="flex items-center gap-0.5">
                              {msg.is_read ? (
                                <>
                                  <span className="text-[9px] font-extrabold text-blue-900">تمت المشاهدة</span>
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-900 stroke-[2.5]" />
                                </>
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5 text-black/50" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 bg-gray-950 flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-gray-900 text-white border border-gray-700 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-amber-500 text-black p-3 rounded-2xl hover:bg-amber-400 transition-transform active:scale-95 disabled:opacity-50 shrink-0"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rotate-180" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-sm">اختر محادثة من القائمة للبدء بالمراسلة</p>
          </div>
        )}
      </div>
    </div>
  );
}
