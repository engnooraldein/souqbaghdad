import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, Send, ArrowRight, User as UserIcon, Loader2, Package, 
  CheckCheck, Check, Search, ChevronDown, Circle, Volume2, Sparkles, RefreshCw
} from 'lucide-react';
import { StoredUser, User } from '../types';
import { getRelative } from '../utils/time';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getNumericHash } from '../utils/helpers';

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
  other_user_id?: string;
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

const PAGE_SIZE = 40;

export function ChatView({ currentUser, activeChatId: initialChatId, onClose, onOpenAuth }: ChatViewProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<any>(null);
  const onlineStatuses = useOnlineStatuses();

  // 1. Lock Body Scroll completely when Chat is open (منع تحرك الصفحة الخلفية)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  // Smooth & Instant Auto-scroll helper
  const scrollToBottom = useCallback((instant = false) => {
    if (!messagesContainerRef.current) return;
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: instant ? 'auto' : 'smooth'
        });
      }
    });
  }, []);

  // Monitor Scroll Position for "Scroll to Bottom" button and Pagination
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    
    // Show jump to bottom button if user scrolled up more than 150px
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottomBtn(distanceFromBottom > 150);

    // Trigger pagination when reaching top
    if (scrollTop < 30 && hasMoreMessages && !loadingOlder && !loadingMessages) {
      loadOlderMessages();
    }
  };

  // 2. Fetch All Chats with Bidirectional Lookup
  const fetchChats = useCallback(async () => {
    if (!currentUser) return;
    setLoadingChats(true);
    try {
      const currentUserIdStr = String(currentUser.id);
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .or(`buyer_id.eq.${currentUserIdStr},seller_id.eq.${currentUserIdStr}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const updatedChats = await Promise.all(
          data.map(async (chat: Chat) => {
            const isBuyer = String(chat.buyer_id) === currentUserIdStr;
            const otherUserId = isBuyer ? chat.seller_id : chat.buyer_id;

            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, phone')
              .eq('id', otherUserId)
              .maybeSingle();

            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .eq('is_read', false)
              .neq('sender_id', currentUserIdStr);

            return {
              ...chat,
              other_user_id: String(otherUserId),
              other_user_name: profile?.full_name || 'مستخدم سوق بغداد',
              other_user_avatar: profile?.avatar_url,
              other_user_phone: profile?.phone,
              unread_count: count || 0
            };
          })
        );

        setChats(updatedChats);

        if (initialChatId && !selectedChat) {
          const target = updatedChats.find(c => c.id === initialChatId);
          if (target) setSelectedChat(target);
        }
      }
    } catch (e) {
      console.error('Error fetching chats:', e);
    } finally {
      setLoadingChats(false);
    }
  }, [currentUser, initialChatId, selectedChat]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Realtime subscription for Chats list updates
  useEffect(() => {
    if (!currentUser) return;

    const chatChannel = supabase
      .channel('public:chats_list')
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
  }, [currentUser, fetchChats]);

  // 3. Fetch Initial Messages for Selected Chat (Paginated)
  const fetchMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;

      const reversed = (data || []).reverse();
      setMessages(reversed);
      setHasMoreMessages((count || 0) > PAGE_SIZE);

      // Auto scroll to bottom instantly
      setTimeout(() => scrollToBottom(true), 50);

      // Mark unread messages as read
      if (currentUser) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('chat_id', chatId)
          .neq('sender_id', String(currentUser.id))
          .eq('is_read', false);

        // Cancel tray notification for this chat
        if (Capacitor.isNativePlatform()) {
          try {
            const notifId = getNumericHash(chatId);
            LocalNotifications.cancel({ notifications: [{ id: notifId }] }).catch(() => {});
          } catch (e) {}
        }

        // Update local chat unread count
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Load older messages when scrolling top
  const loadOlderMessages = async () => {
    if (!selectedChat || loadingOlder || !hasMoreMessages) return;
    setLoadingOlder(true);

    const prevScrollHeight = messagesContainerRef.current?.scrollHeight || 0;

    try {
      const currentOffset = messages.length;
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        const olderReversed = data.reverse();
        setMessages(prev => [...olderReversed, ...prev]);
        setHasMoreMessages(currentOffset + data.length < (count || 0));

        // Adjust scroll position to prevent jumping
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
          }
        });
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Error loading older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // 4. Realtime Message Channel & Typing Broadcast per Chat
  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    fetchMessages(selectedChat.id);

    // Messages Realtime Channel
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
            if (prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.sender_id === newMsg.sender_id && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000))) {
              return prev.map(m => (m.content === newMsg.content && m.sender_id === newMsg.sender_id ? newMsg : m));
            }
            return [...prev, newMsg];
          });

          // Mark read if receiving
          if (String(newMsg.sender_id) !== String(currentUser.id)) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }

          // Auto-scroll if user near bottom or if current user sent it
          setTimeout(() => scrollToBottom(), 50);
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

    // Typing Broadcast Channel ("يكتب الآن...")
    const typingChannel = supabase
      .channel(`chat_typing:${selectedChat.id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.user_id && String(payload.payload.user_id) !== String(currentUser.id)) {
          setIsPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsPartnerTyping(false);
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsPartnerTyping(false);
    };
  }, [selectedChat, currentUser, scrollToBottom]);

  // Handle Typing Indicator Broadcast
  const handleTypingInput = (val: string) => {
    setNewMessage(val);
    if (!selectedChat || !currentUser) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      supabase.channel(`chat_typing:${selectedChat.id}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: String(currentUser.id) }
      });
    }
  };

  // 5. Send Message Handler with Instant Optimistic UI & Chat Timestamp Update
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser || sending) return;

    const content = newMessage.trim();
    const currentUserIdStr = String(currentUser.id);
    const tempId = 'temp-' + Date.now();
    const tempMsg: Message = {
      id: tempId,
      chat_id: selectedChat.id,
      sender_id: currentUserIdStr,
      content,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Optimistic UI insert
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    setSending(true);

    // Instant auto-scroll
    setTimeout(() => scrollToBottom(), 30);

    try {
      // Insert message into DB
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: currentUserIdStr,
          content
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      }

      // Update Chats Table `last_message`, `last_message_time`, `updated_at` so list updates immediately
      const nowIso = new Date().toISOString();
      await supabase
        .from('chats')
        .update({
          last_message: content,
          last_message_time: nowIso,
          updated_at: nowIso
        })
        .eq('id', selectedChat.id);

      // Update local sidebar chat preview
      setChats(prev => prev.map(c => c.id === selectedChat.id ? {
        ...c,
        last_message: content,
        last_message_time: nowIso,
        updated_at: nowIso
      } : c));

    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('تعذر إرسال الرسالة: ' + (err.message || 'خطأ في الاتصال'));
      setNewMessage(content);
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  // Filter chats by search query
  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (chat.other_user_name && chat.other_user_name.toLowerCase().includes(q)) ||
      (chat.ad_title && chat.ad_title.toLowerCase().includes(q)) ||
      (chat.last_message && chat.last_message.toLowerCase().includes(q))
    );
  });

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-900 rounded-3xl border border-gray-800 my-8 shadow-2xl">
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

  const isPartnerOnline = selectedChat?.other_user_id ? onlineStatuses[selectedChat.other_user_id] : false;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] max-h-[700px] max-w-5xl mx-auto my-auto text-right select-none" dir="rtl">
      
      {/* ── Sidebar: Conversations List ── */}
      <div className={`w-full md:w-80 border-b md:border-b-0 md:border-l border-gray-800 flex flex-col bg-gray-950 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Top Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-black text-lg">المحادثات 💬</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-gray-800 transition-colors">
              ✕
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-800/60 bg-gray-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="البحث في المحادثات والأسماء..."
              className="w-full bg-gray-900 text-white text-xs rounded-xl pl-3 pr-9 py-2 border border-gray-700/60 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
          </div>
        </div>

        {/* Chats List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800/40 overscroll-contain">
          {loadingChats ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs font-bold">جاري تحميل المحادثات...</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              {searchQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد لديك محادثات حالياً.'}
            </div>
          ) : (
            filteredChats.map(chat => {
              const isSelected = selectedChat?.id === chat.id;
              const isOnline = chat.other_user_id ? onlineStatuses[chat.other_user_id] : false;
              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-3.5 flex items-center gap-3 transition-colors hover:bg-gray-900/90 text-right ${
                    isSelected ? 'bg-gray-850 border-r-4 border-amber-400' : ''
                  }`}
                >
                  {/* Avatar & Online Dot */}
                  <div className="relative shrink-0">
                    {chat.other_user_avatar ? (
                      <img src={chat.other_user_avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-700 shadow-md" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                        <UserIcon className="w-6 h-6" />
                      </div>
                    )}
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-gray-950 shadow-sm" />
                    )}
                    {chat.unread_count && chat.unread_count > 0 ? (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black/30">
                        {chat.unread_count > 9 ? '+9' : chat.unread_count}
                      </span>
                    ) : null}
                  </div>

                  {/* Content Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-white font-bold text-xs sm:text-sm truncate">{chat.other_user_name}</h4>
                      {chat.last_message_time && (
                        <span className="text-[10px] text-gray-500 shrink-0 font-medium">{getRelative(chat.last_message_time)}</span>
                      )}
                    </div>
                    {chat.ad_title && (
                      <div className="text-[11px] text-amber-400/90 truncate mb-0.5 flex items-center gap-1 font-semibold">
                        <Package className="w-3 h-3 shrink-0" />
                        <span className="truncate">{chat.ad_title}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 truncate">{chat.last_message || 'محادثة جديدة'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Active Chat Area ── */}
      <div className={`flex-1 flex flex-col bg-gray-900 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950/80 shadow-md backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <div className="relative shrink-0">
                  {selectedChat.other_user_avatar ? (
                    <img src={selectedChat.other_user_avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-700 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}
                  {isPartnerOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-950" />
                  )}
                </div>

                <div>
                  <h3 className="text-white font-extrabold text-sm flex items-center gap-2">
                    {selectedChat.other_user_name}
                  </h3>
                  
                  {isPartnerTyping ? (
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                      <span>يكتب الآن</span>
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" />
                      </span>
                    </span>
                  ) : isPartnerOnline ? (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> متصل الآن
                    </span>
                  ) : (
                    selectedChat.ad_title && (
                      <span className="text-[11px] text-amber-400/90 flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs">
                        بخصوص: {selectedChat.ad_title}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain touch-pan-y relative bg-gradient-to-b from-gray-900 to-gray-950"
            >
              {/* Pagination Loader */}
              {loadingOlder && (
                <div className="flex justify-center py-2">
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-800 shadow-md">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>تحميل الرسائل السابقة...</span>
                  </div>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-16 flex flex-col items-center gap-2">
                  <Sparkles className="w-8 h-8 text-amber-400 opacity-60" />
                  <span>ابدأ المحادثة الآن بإرسال رسالة 💬</span>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = String(msg.sender_id) === String(currentUser.id);
                  const isTemp = msg.id.startsWith('temp-');

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-start' : 'justify-end'} transition-all`}
                    >
                      <div
                        className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-transform ${
                          isMe
                            ? 'bg-amber-500 text-black font-semibold rounded-tr-none'
                            : 'bg-gray-800 text-white rounded-tl-none border border-gray-700/60'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">{msg.content}</p>
                        
                        <div className={`flex items-center gap-1.5 text-[10px] mt-1 ${isMe ? 'text-black/80 justify-end' : 'text-gray-400 justify-start'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                          
                          {/* Receipt Status Indicators */}
                          {isMe && (
                            <div className="flex items-center gap-0.5">
                              {isTemp ? (
                                <span className="text-[9px] opacity-75 animate-pulse">جاري الإرسال...</span>
                              ) : msg.is_read ? (
                                <div className="flex items-center gap-0.5 text-blue-950 font-black">
                                  <span className="text-[9px]">تمت المشاهدة</span>
                                  <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                </div>
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5 text-black/60" />
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

            {/* Jump to Bottom Floating Action Button */}
            {showScrollBottomBtn && (
              <button
                onClick={() => scrollToBottom()}
                className="absolute bottom-20 left-6 z-20 p-2.5 bg-amber-500 text-black rounded-full shadow-2xl hover:bg-amber-400 transition-all hover:scale-110 active:scale-95 border border-black/20 flex items-center gap-1 text-xs font-bold"
              >
                <ChevronDown className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">الأحدث</span>
              </button>
            )}

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 bg-gray-950 flex items-center gap-2 shadow-inner">
              <input
                type="text"
                value={newMessage}
                onChange={e => handleTypingInput(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-gray-900 text-white border border-gray-700/80 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-amber-500 text-black p-3 rounded-2xl hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-lg flex items-center justify-center"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rotate-180" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
            <MessageSquare className="w-14 h-14 text-gray-700 mb-3" />
            <p className="text-sm font-bold text-gray-400">اختر محادثة من القائمة للبدء بالمراسلة 💬</p>
          </div>
        )}
      </div>
    </div>
  );
}

