import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, Send, ArrowRight, User as UserIcon, Loader2, Package, 
  CheckCheck, Check, Search, ChevronDown, Circle, Volume2, Sparkles, RefreshCw, X,
  MoreVertical, Trash2, Edit2, Copy, UserCheck, AlertTriangle, Pencil, CornerDownLeft
} from 'lucide-react';
import { StoredUser, User } from '../types';
import { getRelative } from '../utils/time';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { getNumericHash } from '../utils/helpers';
import { useOnlineStatuses } from '../hooks/useOnlineStatuses';

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
  is_edited?: boolean;
}

interface ChatViewProps {
  currentUser: User | StoredUser | null;
  activeChatId?: string | null;
  onClose?: () => void;
  onOpenAuth?: () => void;
  onOpenSellerProfile?: (userId: string) => void;
}

const PAGE_SIZE = 15;

export function ChatView({ currentUser, activeChatId: initialChatId, onClose, onOpenAuth, onOpenSellerProfile }: ChatViewProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [chatLimit, setChatLimit] = useState(20);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [loadingMoreChats, setLoadingMoreChats] = useState(false);
  const [sending, setSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // New Modern Chat States & Long-Press Menu (Instagram Style)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState<Message | null>(null);

  const longPressTimerRef = useRef<any>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Multi-stage Instant Auto-scroll helper
  const scrollToBottom = useCallback((instant = false) => {
    if (!messagesContainerRef.current) return;
    const performScroll = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight + 1000,
          behavior: instant ? 'auto' : 'smooth'
        });
      }
    };
    performScroll();
    requestAnimationFrame(performScroll);
    setTimeout(performScroll, 60);
    setTimeout(performScroll, 200);
    setTimeout(performScroll, 450);
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

  // 2. Fetch Chats with Priority Unread-First Sorting & Paginated Batching
  const fetchChats = useCallback(async () => {
    if (!currentUser) return;
    try {
      const currentUserIdStr = String(currentUser.id);
      
      const { data, error, count } = await supabase
        .from('chats')
        .select('*', { count: 'exact' })
        .or(`buyer_id.eq.${currentUserIdStr},seller_id.eq.${currentUserIdStr}`)
        .order('updated_at', { ascending: false })
        .range(0, chatLimit - 1);

      if (error) throw error;

      setHasMoreChats((count || 0) > chatLimit);

      if (data && data.length > 0) {
        const partnerUserIds = Array.from(
          new Set(
            data.map((chat: Chat) =>
              String(chat.buyer_id) === currentUserIdStr ? chat.seller_id : chat.buyer_id
            ).filter(Boolean)
          )
        );

        const chatIds = data.map((c: Chat) => c.id);

        // Fetch profiles & unread counts in parallel (Ultra Fast ~30ms)
        const [profilesRes, unreadRes] = await Promise.all([
          partnerUserIds.length > 0
            ? supabase.from('profiles').select('id, full_name, avatar_url, phone').in('id', partnerUserIds)
            : Promise.resolve({ data: [] }),
          chatIds.length > 0
            ? supabase.from('messages').select('chat_id').in('chat_id', chatIds).eq('is_read', false).neq('sender_id', currentUserIdStr)
            : Promise.resolve({ data: [] })
        ]);

        const profilesMap: Record<string, { full_name?: string; avatar_url?: string; phone?: string }> = {};
        if (profilesRes.data) {
          profilesRes.data.forEach((p: any) => {
            profilesMap[String(p.id)] = p;
          });
        }

        const unreadCountsMap: Record<string, number> = {};
        if (unreadRes.data) {
          unreadRes.data.forEach((m: any) => {
            unreadCountsMap[m.chat_id] = (unreadCountsMap[m.chat_id] || 0) + 1;
          });
        }

        const enrichedChats: Chat[] = data.map((chat: Chat) => {
          const isBuyer = String(chat.buyer_id) === currentUserIdStr;
          const otherUserId = String(isBuyer ? chat.seller_id : chat.buyer_id);
          const profile = profilesMap[otherUserId];
          const isActiveChat = selectedChat?.id === chat.id;

          return {
            ...chat,
            other_user_id: otherUserId,
            other_user_name: profile?.full_name || 'مستخدم سوق بغداد',
            other_user_avatar: profile?.avatar_url,
            other_user_phone: profile?.phone,
            unread_count: isActiveChat ? 0 : (unreadCountsMap[chat.id] || 0)
          };
        });

        // 🌟 PRIORITY SORTING: Unread conversations ALWAYS at the top!
        const unreadList = enrichedChats.filter(c => (c.unread_count || 0) > 0);
        const readList = enrichedChats.filter(c => (c.unread_count || 0) === 0);
        const sortedChats = [...unreadList, ...readList];

        // Update chats list ONCE with fully enriched profiles!
        setChats(sortedChats);
        setLoadingChats(false);
        setLoadingMoreChats(false);

        // Maintain or set selectedChat using functional updater to avoid dependency loops
        setSelectedChat(prevSelected => {
          if (prevSelected) {
            const updated = sortedChats.find(c => c.id === prevSelected.id);
            return updated ? { ...prevSelected, ...updated } : prevSelected;
          }
          if (initialChatId) {
            return sortedChats.find(c => c.id === initialChatId) || sortedChats[0] || null;
          }
          if (typeof window !== 'undefined' && window.innerWidth >= 768 && sortedChats.length > 0) {
            return sortedChats[0];
          }
          return null;
        });

      } else {
        setChats([]);
        setLoadingChats(false);
        setLoadingMoreChats(false);
      }
    } catch (e) {
      console.error('Error fetching chats:', e);
      setLoadingChats(false);
      setLoadingMoreChats(false);
    }
  }, [currentUser, initialChatId, chatLimit]);

  const handleLoadMoreChats = () => {
    if (loadingMoreChats || !hasMoreChats) return;
    setLoadingMoreChats(true);
    setChatLimit(prev => prev + 20);
  };

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Realtime subscription + 4s silent poll for Chats list updates (Guaranteed Zero-Flicker Live Updates)
  useEffect(() => {
    if (!currentUser) return;

    fetchChats();

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

    // 🔄 Fail-safe silent polling every 4s for conversations list
    const chatsInterval = setInterval(() => {
      fetchChats();
    }, 4000);

    return () => {
      supabase.removeChannel(chatChannel);
      clearInterval(chatsInterval);
    };
  }, [currentUser, fetchChats]);

  // 3. Fetch Initial Messages for Selected Chat (Paginated & Silent Refetch)
  const fetchMessages = async (chatId: string, isInitial = true) => {
    if (isInitial) {
      setLoadingMessages(true);
    }
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

        // Cancel tray notification & update native badge icon for this chat
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

  // 4. Realtime Message Channel & Web Broadcast & 3s Fail-Safe Silent Sync
  const currentChatId = selectedChat?.id;
  useEffect(() => {
    if (!currentChatId || !currentUser) return;

    fetchMessages(currentChatId, true);

    // Helper to safely append or update message in state without dropping identical consecutive text
    const handleIncomingMessage = (newMsg: Message) => {
      setMessages(prev => {
        // 1. If message with exact real ID already exists, update it
        if (prev.some(m => m.id === newMsg.id)) {
          return prev.map(m => m.id === newMsg.id ? { ...m, ...newMsg } : m);
        }
        // 2. If there is an optimistic temp message from me with matching content, replace temp message
        const tempIndex = prev.findIndex(m => m.id.startsWith('temp-') && String(m.sender_id) === String(newMsg.sender_id) && m.content === newMsg.content);
        if (tempIndex !== -1) {
          const copy = [...prev];
          copy[tempIndex] = newMsg;
          return copy;
        }
        // 3. Otherwise append new message
        return [...prev, newMsg];
      });

      // Mark read if receiving from partner
      if (String(newMsg.sender_id) !== String(currentUser.id)) {
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', newMsg.id);
      }

      setTimeout(() => scrollToBottom(), 50);
    };

    // Messages Realtime Channel (Postgres Changes + Web Broadcast)
    const messageChannel = supabase
      .channel(`chat_messages:${currentChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChatId}`
        },
        (payload) => {
          handleIncomingMessage(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChatId}`
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        }
      )
      .on('broadcast', { event: 'broadcast_new_message' }, (payload) => {
        if (payload.payload?.message) {
          handleIncomingMessage(payload.payload.message as Message);
        }
      })
      .subscribe();

    // 🔄 Fail-safe silent polling every 3 seconds for active chat (Zero-Flicker & Perfect Timestamp Sort)
    const messagesPollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', currentChatId)
          .order('created_at', { ascending: false })
          .limit(40);

        if (data && data.length > 0) {
          const fetchedAscending = data.reverse();
          setMessages(prev => {
            if (prev.length === 0) return fetchedAscending;

            const msgMap = new Map<string, Message>();
            // Keep all existing messages (including older paginated ones)
            prev.forEach(m => msgMap.set(m.id, m));

            let hasNewIncoming = false;
            fetchedAscending.forEach(m => {
              if (!msgMap.has(m.id)) {
                hasNewIncoming = true;
              }
              // Clean up corresponding temp message
              if (String(m.sender_id) === String(currentUser.id)) {
                for (const [key, val] of msgMap.entries()) {
                  if (key.startsWith('temp-') && val.content === m.content) {
                    msgMap.delete(key);
                  }
                }
              }
              msgMap.set(m.id, m);
            });

            // Sort strictly chronological
            const sorted = Array.from(msgMap.values()).sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            if (hasNewIncoming) {
              setTimeout(() => scrollToBottom(), 60);
            }
            return sorted;
          });
        }
      } catch (e) {}
    }, 3000);

    // Typing Broadcast Channel ("يكتب الآن...")
    const typingChannel = supabase
      .channel(`chat_typing:${currentChatId}`)
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
      clearInterval(messagesPollInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsPartnerTyping(false);
    };
  }, [currentChatId, currentUser, scrollToBottom]);

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

  // Delete Entire Conversation Handler
  const handleDeleteChat = async () => {
    if (!selectedChat || deletingChat) return;
    setDeletingChat(true);
    try {
      const chatIdToDelete = selectedChat.id;
      // Delete messages first, then chat
      await supabase.from('messages').delete().eq('chat_id', chatIdToDelete);
      await supabase.from('chats').delete().eq('id', chatIdToDelete);

      // Remove from local state
      setChats(prev => prev.filter(c => c.id !== chatIdToDelete));
      setSelectedChat(null);
      setShowDeleteConfirm(false);
      setShowHeaderMenu(false);
    } catch (err) {
      console.error('Error deleting chat:', err);
      alert('تعذر حذف المحادثة، يرجى المحاولة لاحقاً');
    } finally {
      setDeletingChat(false);
    }
  };

  // Delete Single Message Handler
  const handleDeleteSingleMessage = async (messageId: string) => {
    try {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      await supabase.from('messages').delete().eq('id', messageId);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Copy Message Text Handler
  const handleCopyMessage = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  // Long Press & Context Menu Handlers (Instagram Style)
  const handleTouchStartMessage = (msg: Message) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(30); } catch (e) {}
      }
      setActiveMessageMenu(msg);
    }, 450);
  };

  const handleTouchEndMessage = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenuMessage = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(20); } catch (err) {}
    }
    setActiveMessageMenu(msg);
  };

  // Start Edit Message
  const handleStartEditMessage = (msg: Message) => {
    setEditingMessage(msg);
    setNewMessage(msg.content);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // 5. Send & Edit Message Handler (Keep Virtual Keyboard Open + Multi-stage Scroll)
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser || sending) return;

    // Tactile vibration feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(15); } catch (e) {}
    }

    // ✏️ Handle Edit Mode Submit
    if (editingMessage) {
      const updatedContent = newMessage.trim();
      const editingId = editingMessage.id;
      setEditingMessage(null);
      setNewMessage('');

      // Optimistic update in UI
      setMessages(prev => prev.map(m => m.id === editingId ? { ...m, content: updatedContent, is_edited: true } : m));

      try {
        await supabase
          .from('messages')
          .update({ content: updatedContent, is_edited: true })
          .eq('id', editingId);

        requestAnimationFrame(() => inputRef.current?.focus());
      } catch (err) {
        console.error('Error editing message:', err);
      }
      return;
    }

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

    // 📱 KEEP VIRTUAL KEYBOARD OPEN! Focus input immediately
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    // Auto-scroll to latest message
    scrollToBottom(true);

    try {
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
        supabase.channel(`chat_messages:${selectedChat.id}`).send({
          type: 'broadcast',
          event: 'broadcast_new_message',
          payload: { message: data }
        }).catch(() => {});
      }

      const nowIso = new Date().toISOString();
      await supabase
        .from('chats')
        .update({
          last_message: content,
          last_message_time: nowIso,
          updated_at: nowIso
        })
        .eq('id', selectedChat.id);

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
      // 📱 KEEP VIRTUAL KEYBOARD OPEN! Focus input immediately
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      scrollToBottom();
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
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row w-full h-full min-h-0 max-h-full mx-auto my-auto text-right select-none" dir="rtl">
      
      {/* ── Sidebar: Conversations List ── */}
      <div className={`w-full md:w-80 border-b md:border-b-0 md:border-l border-gray-800 flex flex-col bg-gray-950 h-full min-h-0 flex-1 md:flex-none ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {/* Top Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
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
        <div className="p-3 border-b border-gray-800/60 bg-gray-900/50 shrink-0">
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
        <div 
          className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-800/40 overscroll-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
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
            <>
              {filteredChats.map(chat => {
                const isSelected = selectedChat?.id === chat.id;
                const isOnline = chat.other_user_id ? onlineStatuses[chat.other_user_id] : false;
                const isUnread = (chat.unread_count || 0) > 0;

                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-3.5 flex items-center gap-3 transition-colors text-right relative ${
                      isSelected
                        ? 'bg-gray-850 border-r-4 border-amber-400'
                        : isUnread
                        ? 'bg-blue-950/25 border-r-4 border-blue-500 hover:bg-blue-900/35'
                        : 'hover:bg-gray-900/90'
                    }`}
                  >
                    {/* Avatar & Online Dot & Unread Badge */}
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
                      {isUnread && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black/30 animate-pulse">
                          {chat.unread_count && chat.unread_count > 9 ? '+9' : chat.unread_count}
                        </span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* 🔵 Blue Dot for Unread Messages (●) */}
                          {isUnread && (
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping shrink-0 shadow-sm shadow-blue-500/80" title="رسالة جديدة غير مقروءة" />
                          )}
                          <h4 className={`text-xs sm:text-sm truncate ${isUnread ? 'text-white font-black' : 'text-gray-200 font-bold'}`}>
                            {chat.other_user_name}
                          </h4>
                        </div>
                        {chat.last_message_time && (
                          <span className={`text-[10px] shrink-0 font-medium ${isUnread ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
                            {getRelative(chat.last_message_time)}
                          </span>
                        )}
                      </div>

                      {chat.ad_title && (
                        <div className="text-[11px] text-amber-400/90 truncate mb-0.5 flex items-center gap-1 font-semibold">
                          <Package className="w-3 h-3 shrink-0" />
                          <span className="truncate">{chat.ad_title}</span>
                        </div>
                      )}

                      <p className={`text-xs truncate ${isUnread ? 'text-blue-200 font-semibold' : 'text-gray-400'}`}>
                        {chat.last_message || 'محادثة جديدة'}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Load More Conversations Button */}
              {hasMoreChats && (
                <div className="p-3 text-center bg-gray-950/80 border-t border-gray-800">
                  <button
                    onClick={handleLoadMoreChats}
                    disabled={loadingMoreChats}
                    className="w-full py-2 px-4 bg-gray-900 hover:bg-gray-850 text-amber-400 text-xs font-bold rounded-xl border border-gray-700 flex items-center justify-center gap-2 transition-all"
                  >
                    {loadingMoreChats ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>جاري تحميل المحادثات السابقة...</span>
                      </>
                    ) : (
                      <span>تحميل 20 محادثة إضافية 👇</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Main Active Chat Area ── */}
      <div className={`flex-1 min-h-0 min-w-0 flex flex-col bg-gray-900 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950/80 shadow-md backdrop-blur-md shrink-0 relative z-30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden text-amber-400 hover:text-amber-300 p-1.5 rounded-xl bg-gray-850 hover:bg-gray-800 transition-colors flex items-center gap-1 font-bold text-xs shadow-sm"
                  title="الرجوع للقائمة"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span className="hidden sm:inline">القائمة</span>
                </button>
                
                <div className="relative shrink-0 cursor-pointer" onClick={() => selectedChat.other_user_id && onOpenSellerProfile && onOpenSellerProfile(selectedChat.other_user_id)}>
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

                <div className="cursor-pointer" onClick={() => selectedChat.other_user_id && onOpenSellerProfile && onOpenSellerProfile(selectedChat.other_user_id)}>
                  <h3 className="text-white font-extrabold text-sm flex items-center gap-2 hover:text-amber-400 transition-colors">
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

              {/* Action Buttons: 3-Dots Options Menu + Close */}
              <div className="flex items-center gap-2">
                {/* 3-Dots Options Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowHeaderMenu(prev => !prev)}
                    className="text-gray-400 hover:text-white p-2 rounded-xl bg-gray-850 hover:bg-gray-800 transition-colors flex items-center justify-center shadow-sm"
                    title="خيارات المحادثة"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showHeaderMenu && (
                    <div className="absolute left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                      {selectedChat.other_user_id && onOpenSellerProfile && (
                        <button
                          onClick={() => {
                            setShowHeaderMenu(false);
                            onOpenSellerProfile(selectedChat.other_user_id!);
                          }}
                          className="w-full px-4 py-3 text-right text-xs font-bold text-gray-200 hover:bg-gray-800 flex items-center gap-2.5 transition-colors border-b border-gray-800/60"
                        >
                          <UserCheck className="w-4 h-4 text-amber-400" />
                          <span>الملف الشخصي للبائع</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowHeaderMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full px-4 py-3 text-right text-xs font-bold text-red-400 hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <span>حذف المحادثة بالكامل</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Close Modal Button */}
                {onClose && (
                  <button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-white p-2 rounded-xl bg-gray-800/80 hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm"
                    title="إغلاق المحادثة"
                  >
                    <span className="hidden sm:inline">إغلاق</span>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Body */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 overscroll-contain touch-pan-y relative bg-gradient-to-b from-gray-900 to-gray-950"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Load Older Messages Button */}
              {hasMoreMessages && !loadingOlder && !loadingMessages && (
                <div className="flex justify-center py-2">
                  <button
                    onClick={loadOlderMessages}
                    className="flex items-center gap-1.5 text-xs text-amber-400 bg-gray-900/90 hover:bg-gray-850 px-4 py-1.5 rounded-full border border-amber-500/30 shadow-md hover:scale-105 active:scale-95 transition-all font-bold cursor-pointer"
                  >
                    <span>تحميل الرسائل السابقة ⬆️</span>
                  </button>
                </div>
              )}

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
                        onTouchStart={() => handleTouchStartMessage(msg)}
                        onTouchEnd={handleTouchEndMessage}
                        onTouchMove={handleTouchEndMessage}
                        onContextMenu={e => handleContextMenuMessage(e, msg)}
                        onClick={() => setActiveMessageMenu(msg)}
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-transform relative cursor-pointer select-none active:scale-[0.98] ${
                          isMe
                            ? 'bg-amber-500 text-black font-semibold rounded-tr-none'
                            : 'bg-gray-800 text-white rounded-tl-none border border-gray-700/60'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">{msg.content}</p>
                        
                        <div className={`flex items-center gap-1.5 text-[10px] mt-1 ${isMe ? 'text-black/80 justify-end' : 'text-gray-400 justify-start'}`}>
                          {msg.is_edited && (
                            <span className="text-[9px] font-bold opacity-80">(معدّلة)</span>
                          )}
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
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-20 left-6 z-20 p-2.5 bg-amber-500 text-black rounded-full shadow-2xl hover:bg-amber-400 transition-all hover:scale-110 active:scale-95 border border-black/20 flex items-center gap-1 text-xs font-bold"
              >
                <ChevronDown className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">الأحدث</span>
              </button>
            )}

            {/* ✏️ Active Message Edit Banner */}
            {editingMessage && (
              <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/30 text-amber-400 text-xs flex items-center justify-between font-bold shrink-0">
                <span className="flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 animate-bounce" />
                  <span>جاري تعديل الرسالة...</span>
                </span>
                <button
                  onClick={() => {
                    setEditingMessage(null);
                    setNewMessage('');
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
                  title="إلغاء التعديل"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 bg-gray-950 flex items-center gap-2 shadow-inner shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => handleTypingInput(e.target.value)}
                placeholder={editingMessage ? "تعديل نص الرسالة..." : "اكتب رسالتك هنا..."}
                className="flex-1 bg-gray-900 text-white border border-gray-700/80 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-amber-500 text-black p-3 rounded-2xl hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-lg flex items-center justify-center"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : editingMessage ? <Check className="w-5 h-5 stroke-[3]" /> : <Send className="w-5 h-5 rotate-180" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
            <MessageSquare className="w-14 h-14 text-gray-700 mb-3" />
            <p className="text-sm font-bold text-gray-400">اختر محادثة من القائمة للبدء بالمراسلة 💬</p>
          </div>
        )}

        {/* 🌟 Instagram/Telegram Style Long-Press Context Menu Popover */}
        {activeMessageMenu && (
          <div 
            onClick={() => setActiveMessageMenu(null)}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
          >
            <div 
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-xs flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-150 select-none"
            >
              {/* 1. Emoji Quick Reaction Bar (Instagram Style) */}
              <div className="bg-gray-900/95 border border-gray-700/80 rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-3 text-2xl backdrop-blur-xl">
                {['❤️', '😂', '😮', '😢', '😡', '👍', '👏'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleCopyMessage(`${emoji} ${activeMessageMenu.content}`, activeMessageMenu.id);
                      setActiveMessageMenu(null);
                    }}
                    className="hover:scale-130 active:scale-95 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* 2. Highlighted Active Message Preview Bubble */}
              <div 
                className={`w-full rounded-2xl px-4 py-3 text-sm shadow-2xl border ${
                  String(activeMessageMenu.sender_id) === String(currentUser.id)
                    ? 'bg-amber-500 text-black font-semibold border-amber-400'
                    : 'bg-gray-800 text-white border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">
                  {activeMessageMenu.content}
                </p>
                <div className={`text-[10px] mt-1 text-left ${String(activeMessageMenu.sender_id) === String(currentUser.id) ? 'text-black/70' : 'text-gray-400'}`}>
                  {new Date(activeMessageMenu.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* 3. Instagram-Style Action List Card */}
              <div className="w-full bg-gray-900/95 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl divide-y divide-gray-800/80">
                <button
                  onClick={() => {
                    handleCopyMessage(activeMessageMenu.content, activeMessageMenu.id);
                    setActiveMessageMenu(null);
                  }}
                  className="w-full px-4 py-3.5 text-right text-xs font-extrabold text-gray-200 hover:bg-gray-800 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>نسخ النص</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-normal">Copy</span>
                </button>

                {String(activeMessageMenu.sender_id) === String(currentUser.id) && !activeMessageMenu.id.startsWith('temp-') && (
                  <button
                    onClick={() => {
                      const msg = activeMessageMenu;
                      setActiveMessageMenu(null);
                      handleStartEditMessage(msg);
                    }}
                    className="w-full px-4 py-3.5 text-right text-xs font-extrabold text-gray-200 hover:bg-gray-800 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Pencil className="w-4 h-4 text-amber-400" />
                      <span>تعديل الرسالة</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-normal">Edit</span>
                  </button>
                )}

                {String(activeMessageMenu.sender_id) === String(currentUser.id) && !activeMessageMenu.id.startsWith('temp-') && (
                  <button
                    onClick={() => {
                      const id = activeMessageMenu.id;
                      setActiveMessageMenu(null);
                      handleDeleteSingleMessage(id);
                    }}
                    className="w-full px-4 py-3.5 text-right text-xs font-extrabold text-red-400 hover:bg-red-950/40 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>حذف الرسالة</span>
                    </span>
                    <span className="text-[10px] text-red-500/70 font-normal">Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Conversation Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-base mb-1">حذف المحادثة؟</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  هل أنت تأكد من رغبتك في حذف هذه المحادثة وجميع الرسائل داخلها؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold rounded-2xl text-xs transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteChat}
                  disabled={deletingChat}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  {deletingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>حذف الآن</span>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

