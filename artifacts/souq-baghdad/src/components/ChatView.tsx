import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  MessageSquare, Send, ArrowRight, User as UserIcon, Loader2, Package, 
  CheckCheck, Check, Search, ChevronDown, Circle, Volume2, Sparkles, RefreshCw, X,
  MoreVertical, Trash2, Edit2, Copy, UserCheck, AlertTriangle, Pencil, CornerDownLeft,
  Reply, RotateCcw, Flag, Plus
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

export interface MessageMenuTarget {
  message: Message;
  rect: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  };
}

interface ChatViewProps {
  currentUser: User | StoredUser | null;
  activeChatId?: string | null;
  onClose?: () => void;
  onOpenAuth?: () => void;
  onOpenSellerProfile?: (userId: string) => void;
}

const PAGE_SIZE = 15;

const EXTRA_EMOJIS = [
  '❤️', '🔥', '😂', '😍', '👏', '🎉', 
  '😮', '😢', '😡', '👍', '👎', '🙏', 
  '💯', '🥳', '🚀', '💎', '🤩', '🤝', 
  '🖤', '🌹', '✨', '⚡', '☕', '💪'
];

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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState<MessageMenuTarget | null>(null);
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(() => {
    if (currentUser?.id) {
      try {
        const key = `hidden_msgs_${currentUser.id}`;
        return new Set<string>(JSON.parse(localStorage.getItem(key) || '[]'));
      } catch (e) {}
    }
    return new Set<string>();
  });

  // Reactions & Double-tap Heart state
  const [messageReactions, setMessageReactions] = useState<Record<string, { emoji: string; userId: string }[]>>({});
  const [heartBurstId, setHeartBurstId] = useState<string | null>(null);
  const lastTapRef = useRef<{ messageId: string; time: number } | null>(null);

  // Swipe to Reply States
  const [swipingMsgId, setSwipingMsgId] = useState<string | null>(null);
  const [swipeDistance, setSwipeDistance] = useState<number>(0);
  const swipeTriggeredVibrateRef = useRef<boolean>(false);

  const longPressTimerRef = useRef<any>(null);

  // 📱 Visual Viewport (keyboard height tracker for mobile web)
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Load reactions from local storage on chat switch
  useEffect(() => {
    if (selectedChat?.id) {
      try {
        const stored = localStorage.getItem(`reactions_${selectedChat.id}`);
        if (stored) {
          setMessageReactions(JSON.parse(stored));
        } else {
          setMessageReactions({});
        }
      } catch (e) {
        setMessageReactions({});
      }
    } else {
      setMessageReactions({});
    }
  }, [selectedChat?.id]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<any>(null);
  const onlineStatuses = useOnlineStatuses();

  // 1. Lock Body Scroll + track keyboard height via Visual Viewport API
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const onViewportResize = () => {
      if (window.visualViewport) {
        const kbHeight = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
        setKeyboardHeight(Math.max(0, kbHeight));
      }
    };

    window.visualViewport?.addEventListener('resize', onViewportResize);
    window.visualViewport?.addEventListener('scroll', onViewportResize);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.visualViewport?.removeEventListener('resize', onViewportResize);
      window.visualViewport?.removeEventListener('scroll', onViewportResize);
    };
  }, []);

  // Multi-stage Instant Auto-scroll helper
  const scrollToBottom = useCallback((instant = false) => {
    if (!messagesContainerRef.current) return;
    const performScroll = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight + 10000,
          behavior: instant ? 'auto' : 'smooth'
        });
      }
    };
    performScroll();
    requestAnimationFrame(performScroll);
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 180);
    setTimeout(performScroll, 350);
  }, []);

  // Auto-scroll when new message is added or sent
  const lastMsgId = messages.length > 0 ? messages[messages.length - 1].id : null;
  useEffect(() => {
    if (lastMsgId) {
      requestAnimationFrame(() => scrollToBottom(true));
      setTimeout(() => scrollToBottom(true), 60);
      setTimeout(() => scrollToBottom(true), 200);
    }
  }, [messages.length, lastMsgId, scrollToBottom]);

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

      // Auto scroll to bottom after render
      requestAnimationFrame(() => scrollToBottom(true));
      setTimeout(() => scrollToBottom(true), 80);
      setTimeout(() => scrollToBottom(true), 250);
      setTimeout(() => scrollToBottom(true), 600);

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
      .on('broadcast', { event: 'broadcast_reaction' }, (payload) => {
        if (payload.payload?.messageId && payload.payload?.emoji && payload.payload?.userId) {
          const { messageId, emoji, userId } = payload.payload;
          setMessageReactions(prev => {
            const existing = prev[messageId] || [];
            let updated: { emoji: string; userId: string }[];
            if (existing.some(r => r.userId === userId && r.emoji === emoji)) {
              updated = existing.filter(r => !(r.userId === userId && r.emoji === emoji));
            } else {
              updated = [...existing.filter(r => r.userId !== userId), { emoji, userId }];
            }
            const next = { ...prev, [messageId]: updated };
            try {
              localStorage.setItem(`reactions_${currentChatId}`, JSON.stringify(next));
            } catch (e) {}
            return next;
          });
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

  // 🗑️ Delete for Me (Removes locally and persists in storage for current user)
  const handleDeleteForMe = (messageId: string) => {
    if (!currentUser) return;
    setHiddenMessageIds(prev => {
      const next = new Set(prev);
      next.add(messageId);
      try {
        const key = `hidden_msgs_${currentUser.id}`;
        localStorage.setItem(key, JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  // 🔄 Unsend / Delete for Everyone (Removes from DB for both sender and recipient)
  const handleUnsendForEveryone = async (messageId: string) => {
    if (!messageId || messageId.startsWith('temp-')) return;
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
    } catch (err) {
      console.error('Error unsending message:', err);
    }
  };

  // 🚩 Report Message
  const handleReportMessage = (msg: Message) => {
    alert('تم استلام إبلاغك وسيقوم فريق الإشراف بالتحقق من الرسالة واتخاذ الإجراء اللازم فوراً.');
  };

  // 😍 Add / Toggle Emoji Reaction on a message (Instagram style attached to bottom edge)
  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!selectedChat || !currentUser) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(25); } catch (e) {}
    }

    setMessageReactions(prev => {
      const existing = prev[messageId] || [];
      const userId = String(currentUser.id);
      let updated: { emoji: string; userId: string }[];

      if (existing.some(r => r.userId === userId && r.emoji === emoji)) {
        updated = existing.filter(r => !(r.userId === userId && r.emoji === emoji));
      } else {
        updated = [...existing.filter(r => r.userId !== userId), { emoji, userId }];
      }

      const next = { ...prev, [messageId]: updated };
      try {
        localStorage.setItem(`reactions_${selectedChat.id}`, JSON.stringify(next));
      } catch (e) {}

      return next;
    });

    // Broadcast to other participant
    supabase.channel(`chat_messages:${selectedChat.id}`).send({
      type: 'broadcast',
      event: 'broadcast_reaction',
      payload: { messageId, emoji, userId: String(currentUser.id) }
    }).catch(() => {});
  };

  // ❤️ Double-tap detector for automatic heart reaction
  const handleDoubleTapMessage = (msg: Message) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.messageId === msg.id && (now - lastTapRef.current.time < 320)) {
      lastTapRef.current = null;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(35); } catch (e) {}
      }
      setHeartBurstId(msg.id);
      setTimeout(() => setHeartBurstId(null), 700);
      handleAddReaction(msg.id, '❤️');
      return true;
    }
    lastTapRef.current = { messageId: msg.id, time: now };
    return false;
  };

  // Copy Message Text Handler
  const handleCopyMessage = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  // Touch Position tracking ref for long-press and swipe gestures
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Long Press & Context Menu & Swipe-to-Reply Handlers
  const handleTouchStartMessage = (e: React.TouchEvent<HTMLDivElement>, msg: Message) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    swipeTriggeredVibrateRef.current = false;
    setSwipingMsgId(msg.id);
    setSwipeDistance(0);

    const target = e.currentTarget;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(35); } catch (err) {}
      }
      const rect = target.getBoundingClientRect();
      setActiveMessageMenu({
        message: msg,
        rect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        }
      });
      setShowAllEmojis(false);
      setSwipingMsgId(null);
      setSwipeDistance(0);
    }, 420);
  };

  const handleTouchMoveMessage = (e: React.TouchEvent<HTMLDivElement>, msg: Message) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPosRef.current.x;
    const dy = touch.clientY - (touchStartPosRef.current?.y || 0);

    // Cancel on vertical scrolling
    if (Math.abs(dy) > 12) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setSwipingMsgId(null);
      setSwipeDistance(0);
      return;
    }

    // Swipe left-to-right (dx > 8)
    if (dx > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      const dist = Math.min(75, Math.max(0, dx * 0.75));
      setSwipingMsgId(msg.id);
      setSwipeDistance(dist);

      if (dist >= 45 && !swipeTriggeredVibrateRef.current) {
        swipeTriggeredVibrateRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(25); } catch (e) {}
        }
      }
    }
  };

  const handleTouchEndMessage = (msg: Message) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (swipingMsgId === msg.id && swipeDistance >= 45) {
      setReplyingTo(msg);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(25); } catch (e) {}
      }
      requestAnimationFrame(() => inputRef.current?.focus());
    }

    setSwipingMsgId(null);
    setSwipeDistance(0);
    touchStartPosRef.current = null;
  };

  const handleContextMenuMessage = (e: React.MouseEvent<HTMLDivElement>, msg: Message) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(25); } catch (err) {}
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveMessageMenu({
      message: msg,
      rect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      }
    });
    setShowAllEmojis(false);
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
      try { navigator.vibrate(15); } catch (err) {}
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

    const rawContent = newMessage.trim();
    let finalContent = rawContent;
    if (replyingTo) {
      const snippet = replyingTo.content.length > 35 ? replyingTo.content.slice(0, 35) + '...' : replyingTo.content;
      finalContent = `↩️ رداً على: "${snippet}"\n${rawContent}`;
      setReplyingTo(null);
    }

    const currentUserIdStr = String(currentUser.id);
    const tempId = 'temp-' + Date.now();
    const tempMsg: Message = {
      id: tempId,
      chat_id: selectedChat.id,
      sender_id: currentUserIdStr,
      content: finalContent,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Optimistic UI insert
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    setSending(true);

    // 📱 KEEP VIRTUAL KEYBOARD OPEN! Focus input immediately without page jump
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });

    // Auto-scroll to latest message
    scrollToBottom(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: currentUserIdStr,
          content: finalContent
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
          last_message: finalContent,
          last_message_time: nowIso,
          updated_at: nowIso
        })
        .eq('id', selectedChat.id);

      setChats(prev => prev.map(c => c.id === selectedChat.id ? {
        ...c,
        last_message: finalContent,
        last_message_time: nowIso,
        updated_at: nowIso
      } : c));

    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('تعذر إرسال الرسالة: ' + (err.message || 'خطأ في الاتصال'));
      setNewMessage(rawContent);
    } finally {
      setSending(false);
      // 📱 KEEP VIRTUAL KEYBOARD OPEN! Focus input immediately without page jump
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
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
    <div
      className="bg-gray-900 flex flex-col md:flex-row w-full h-full min-h-0 text-right select-none overflow-hidden rounded-none border-0"
      style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight : undefined }}
      dir="rtl"
    >
      
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
            {/* Header - sticky at top */}
            <div className="p-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950 shadow-md shrink-0 z-30">
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

            {/* Messages Body - takes all remaining space */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 overscroll-contain relative bg-gradient-to-b from-gray-900 to-gray-950"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
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
              ) : messages.filter(m => !hiddenMessageIds.has(m.id)).length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-16 flex flex-col items-center gap-2">
                  <Sparkles className="w-8 h-8 text-amber-400 opacity-60" />
                  <span>ابدأ المحادثة الآن بإرسال رسالة 💬</span>
                </div>
              ) : (
                messages
                  .filter(m => !hiddenMessageIds.has(m.id))
                  .map(msg => {
                    const isMe = String(msg.sender_id) === String(currentUser.id);
                    const isTemp = msg.id.startsWith('temp-');

                    // Helper to render reply prefix nicely
                    const renderContent = (content: string) => {
                      if (content.startsWith('↩️ رداً على: "')) {
                        const firstLineEnd = content.indexOf('\n');
                        if (firstLineEnd !== -1) {
                          const quote = content.slice(0, firstLineEnd);
                          const body = content.slice(firstLineEnd + 1);
                          return (
                            <div className="space-y-1">
                              <div className={`text-[10px] px-2 py-0.5 rounded-lg border-r-2 ${isMe ? 'border-black/50 bg-black/10 text-black/90' : 'border-amber-400 bg-black/25 text-amber-300'} opacity-90 truncate max-w-full font-medium`}>
                                {quote}
                              </div>
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{body}</p>
                            </div>
                          );
                        }
                      }
                      return <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">{content}</p>;
                    };

                    const reactions = messageReactions[msg.id] || [];
                    const reactionCounts: Record<string, number> = {};
                    reactions.forEach(r => {
                      reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
                    });
                    const isSwipingThis = swipingMsgId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-start' : 'justify-end'} transition-all relative my-1`}
                      >
                        {/* ↩️ Swipe to Reply Indicator */}
                        {isSwipingThis && swipeDistance > 5 && (
                          <div 
                            style={{
                              opacity: Math.min(1, swipeDistance / 35),
                              transform: `scale(${Math.min(1.2, 0.6 + swipeDistance / 60)})`,
                            }}
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-500/25 border border-amber-500/60 flex items-center justify-center text-amber-400 z-0 pointer-events-none transition-opacity"
                          >
                            <Reply className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          onClick={() => handleDoubleTapMessage(msg)}
                          onTouchStart={e => handleTouchStartMessage(e, msg)}
                          onTouchEnd={() => handleTouchEndMessage(msg)}
                          onTouchMove={e => handleTouchMoveMessage(e, msg)}
                          onContextMenu={e => handleContextMenuMessage(e, msg)}
                          style={{
                            transform: isSwipingThis ? `translateX(${swipeDistance}px)` : 'none',
                            transition: isSwipingThis ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
                          }}
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md relative cursor-pointer select-none active:scale-[0.98] ${
                            isMe
                              ? 'bg-amber-500 text-black font-semibold rounded-tr-none'
                              : 'bg-gray-800 text-white rounded-tl-none border border-gray-700/60'
                          }`}
                        >
                          {/* ❤️ Double-tap Heart Pop Animation */}
                          {heartBurstId === msg.id && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                              <span className="text-4xl animate-ping duration-500 select-none drop-shadow-2xl">❤️</span>
                            </div>
                          )}

                          {renderContent(msg.content)}
                          
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

                          {/* 😍 Floating Instagram Reaction Badge at bottom edge of bubble */}
                          {reactions.length > 0 && (
                            <div 
                              className={`absolute -bottom-2.5 ${isMe ? 'right-2' : 'left-2'} z-10 flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-full px-2 py-0.5 shadow-md text-[11px] select-none hover:scale-110 active:scale-95 transition-transform`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const userReaction = reactions.find(r => r.userId === String(currentUser?.id));
                                if (userReaction) {
                                  handleAddReaction(msg.id, userReaction.emoji);
                                }
                              }}
                              title="انقر لإلغاء تفاعلك"
                            >
                              {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <span key={emoji} className="flex items-center gap-0.5">
                                  <span>{emoji}</span>
                                  {count > 1 && <span className="text-[10px] text-gray-300 font-bold">{count}</span>}
                                </span>
                              ))}
                            </div>
                          )}
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

            {/* ↩️ Active Reply Banner */}
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 text-xs flex items-center justify-between shrink-0 animate-in slide-in-from-bottom duration-150">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-1 h-7 bg-amber-400 rounded-full shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Reply className="w-3 h-3" />
                      <span>الرد على {String(replyingTo.sender_id) === String(currentUser.id) ? 'نفسك' : selectedChat?.other_user_name || 'رسالة'}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 truncate max-w-xs">{replyingTo.content}</p>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
                  title="إلغاء الرد"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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

            {/* Input Footer - sticky at bottom */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 bg-gray-950 flex items-center gap-2 shadow-inner shrink-0 z-30">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => handleTypingInput(e.target.value)}
                placeholder={editingMessage ? "تعديل نص الرسالة..." : replyingTo ? "اكتب ردك هنا..." : "اكتب رسالتك هنا..."}
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

        {/* 🌟 100% Instagram-Style Positioned Long-Press Context Menu Popover */}
        {activeMessageMenu && (() => {
          const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
          const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 380;
          const isMe = String(activeMessageMenu.message.sender_id) === String(currentUser.id);
          const rect = activeMessageMenu.rect;

          // Height required below for context menu card
          const menuHeight = isMe ? 230 : 190;
          const spaceBelow = windowHeight - rect.bottom;
          const requiredSpaceBelow = menuHeight + 24;

          let shiftY = 0;
          if (spaceBelow < requiredSpaceBelow) {
            shiftY = requiredSpaceBelow - spaceBelow;
          }

          // Make sure top doesn't clip top edge (room for reactions bar ~60px)
          const targetTop = rect.top - shiftY;
          if (targetTop < 75) {
            shiftY = rect.top - 75;
          }

          const adjustedTop = Math.max(70, rect.top - shiftY);

          // Calculate horizontal alignment
          const rightOffset = Math.max(12, windowWidth - rect.right);
          const leftOffset = Math.max(12, rect.left);

          return (
            <div 
              onClick={() => setActiveMessageMenu(null)}
              className="fixed inset-0 z-[200] bg-black/35 backdrop-blur-[5px] animate-in fade-in duration-150 select-none overflow-hidden"
            >
              <div 
                style={{
                  position: 'absolute',
                  top: `${adjustedTop}px`,
                  ...(isMe ? { right: `${rightOffset}px` } : { left: `${leftOffset}px` }),
                  width: `${Math.min(rect.width, windowWidth - 28)}px`,
                }}
                className="relative flex flex-col z-[210] animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
              >
                {/* 1. Emoji Reactions Bar (Floating Directly Above Bubble) */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    ...(isMe ? { right: 0 } : { left: 0 }),
                  }}
                  className="bg-white text-gray-900 shadow-2xl rounded-full px-3.5 py-1.5 flex items-center gap-3 text-2xl border border-white/50 whitespace-nowrap backdrop-blur-md z-30"
                >
                  {['❤️', '😂', '😮', '😢', '😡', '👍'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleAddReaction(activeMessageMenu.message.id, emoji);
                        setActiveMessageMenu(null);
                        setShowAllEmojis(false);
                      }}
                      className="hover:scale-130 active:scale-95 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAllEmojis(prev => !prev)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-black transition-all hover:scale-110 active:scale-95"
                    title="المزيد من التفاعلات"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* 🌟 Extra Emojis Picker Grid (When clicking +) */}
                {showAllEmojis && (
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 60px)',
                      ...(isMe ? { right: 0 } : { left: 0 }),
                    }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/90 rounded-3xl p-3 shadow-2xl z-40 grid grid-cols-6 gap-2 text-2xl animate-in zoom-in-90 duration-150 backdrop-blur-xl"
                    onClick={e => e.stopPropagation()}
                  >
                    {EXTRA_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleAddReaction(activeMessageMenu.message.id, emoji);
                          setActiveMessageMenu(null);
                          setShowAllEmojis(false);
                        }}
                        className="w-9 h-9 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Highlighted Message Bubble (Exact copy in exact position) */}
                <div 
                  className={`rounded-2xl px-4 py-2.5 text-sm shadow-2xl transition-all ${
                    isMe
                      ? 'bg-amber-500 text-black font-semibold rounded-tr-none ring-2 ring-amber-300'
                      : 'bg-gray-800 text-white rounded-tl-none border border-gray-700 ring-2 ring-gray-600'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">
                    {activeMessageMenu.message.content}
                  </p>
                  <div className={`flex items-center gap-1.5 text-[10px] mt-1 ${isMe ? 'text-black/80 justify-end' : 'text-gray-400 justify-start'}`}>
                    {activeMessageMenu.message.is_edited && <span className="text-[9px] font-bold opacity-80">(معدّلة)</span>}
                    <span>{new Date(activeMessageMenu.message.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* 3. Instagram Action Menu Card (Floating Directly Below Bubble) */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    ...(isMe ? { right: 0 } : { left: 0 }),
                  }}
                  className="w-56 bg-[#f4f3ef] dark:bg-[#252528] text-gray-900 dark:text-gray-100 rounded-[22px] shadow-2xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden backdrop-blur-2xl p-1.5 space-y-0.5 z-30"
                >
                  {/* Reply */}
                  <button
                    onClick={() => {
                      setReplyingTo(activeMessageMenu.message);
                      setActiveMessageMenu(null);
                      requestAnimationFrame(() => inputRef.current?.focus());
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl text-right text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Reply className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      <span>رد (Reply)</span>
                    </span>
                  </button>

                  {/* Edit (if isMe) */}
                  {isMe && !activeMessageMenu.message.id.startsWith('temp-') && (
                    <button
                      onClick={() => {
                        const msg = activeMessageMenu.message;
                        setActiveMessageMenu(null);
                        handleStartEditMessage(msg);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl text-right text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Pencil className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        <span>تعديل (Edit)</span>
                      </span>
                    </button>
                  )}

                  {/* Copy */}
                  <button
                    onClick={() => {
                      handleCopyMessage(activeMessageMenu.message.content, activeMessageMenu.message.id);
                      setActiveMessageMenu(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl text-right text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Copy className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      <span>نسخ النص (Copy)</span>
                    </span>
                  </button>

                  {/* Delete for Me */}
                  <button
                    onClick={() => {
                      handleDeleteForMe(activeMessageMenu.message.id);
                      setActiveMessageMenu(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl text-right text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      <span>حذف لديّ فقط (Delete for you)</span>
                    </span>
                  </button>

                  {/* Unsend / Delete for Everyone (if isMe) */}
                  {isMe && !activeMessageMenu.message.id.startsWith('temp-') && (
                    <button
                      onClick={() => {
                        handleUnsendForEveryone(activeMessageMenu.message.id);
                        setActiveMessageMenu(null);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl text-right text-xs font-extrabold text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <RotateCcw className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>تراجع عن الإرسال (Unsend)</span>
                      </span>
                    </button>
                  )}

                  {/* Report (if !isMe) */}
                  {!isMe && (
                    <button
                      onClick={() => {
                        handleReportMessage(activeMessageMenu.message);
                        setActiveMessageMenu(null);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl text-right text-xs font-extrabold text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Flag className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>إبلاغ (Report)</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

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

