/**
 * ChatModal.tsx — نظام دردشة داخلية في سوق بغداد
 * يعرض قائمة المحادثات وشاشة المحادثة الواحدة مع إشعارات Push
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, ArrowRight, MessageCircle, ChevronLeft,
  Loader2, CheckCheck, Check, ImageIcon, User
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface ChatThread {
  id: string;
  ad_id: string | null;
  participant_a: string;
  participant_b: string;
  last_message_at: string;
  // joined from profiles + messages
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_id: string;
  last_message_body: string;
  unread_count: number;
  ad_title?: string;
}

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface Props {
  currentUserId: string;
  currentUserName: string;
  // optionally open a specific thread directly (from ad detail page)
  openWithUserId?: string;
  openWithAdId?: string;
  openWithAdTitle?: string;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

// ──────────────────────────────────────────────
// Helper: format time
// ──────────────────────────────────────────────
function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return d.toLocaleDateString('ar-IQ', { weekday: 'short' });
  return d.toLocaleDateString('ar-IQ', { day: '2-digit', month: '2-digit' });
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export function ChatModal({
  currentUserId,
  currentUserName,
  openWithUserId,
  openWithAdId,
  openWithAdTitle,
  onClose,
  onUnreadChange
}: Props) {
  const [view, setView] = useState<'threads' | 'chat'>('threads');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load threads ─────────────────────────────
  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const { data: threadRows, error } = await supabase
        .from('chat_threads')
        .select('*')
        .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false });

      if (error || !threadRows) { setLoadingThreads(false); return; }

      // Enrich threads with other user profile + last message + unread
      const enriched: ChatThread[] = await Promise.all(
        threadRows.map(async (t) => {
          const otherId = t.participant_a === currentUserId ? t.participant_b : t.participant_a;

          const [profileRes, lastMsgRes, unreadRes] = await Promise.all([
            supabase.from('profiles').select('full_name, avatar_url').eq('id', otherId).single(),
            supabase.from('chat_messages')
              .select('body')
              .eq('thread_id', t.id)
              .order('created_at', { ascending: false })
              .limit(1),
            supabase.from('chat_messages')
              .select('id', { count: 'exact' })
              .eq('thread_id', t.id)
              .eq('sender_id', otherId)
              .eq('read', false)
          ]);

          let adTitle = '';
          if (t.ad_id) {
            const adRes = await supabase.from('ads').select('title').eq('id', t.ad_id).single();
            adTitle = adRes.data?.title || '';
          }

          return {
            ...t,
            other_user_id: otherId,
            other_user_name: profileRes.data?.full_name || 'مستخدم',
            other_user_avatar: profileRes.data?.avatar_url || null,
            last_message_body: lastMsgRes.data?.[0]?.body || '',
            unread_count: unreadRes.count || 0,
            ad_title: adTitle
          } as ChatThread;
        })
      );

      setThreads(enriched);
      const totalUnread = enriched.reduce((s, t) => s + t.unread_count, 0);
      onUnreadChange?.(totalUnread);
    } finally {
      setLoadingThreads(false);
    }
  }, [currentUserId, onUnreadChange]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // ── Auto-open thread if openWithUserId ────────
  useEffect(() => {
    if (!openWithUserId || loadingThreads) return;
    const existing = threads.find(t =>
      (t.participant_a === currentUserId && t.participant_b === openWithUserId) ||
      (t.participant_b === currentUserId && t.participant_a === openWithUserId)
    );
    if (existing) {
      openThread(existing);
    } else {
      // create new thread
      createOrOpenThread(openWithUserId, openWithAdId, openWithAdTitle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openWithUserId, loadingThreads]);

  // ── Create or fetch thread ────────────────────
  const createOrOpenThread = async (otherId: string, adId?: string, adTitle?: string) => {
    // Check if already exists
    const { data: existing } = await supabase
      .from('chat_threads')
      .select('*')
      .or(`and(participant_a.eq.${currentUserId},participant_b.eq.${otherId}),and(participant_a.eq.${otherId},participant_b.eq.${currentUserId})`)
      .eq('ad_id', adId || null)
      .maybeSingle();

    let threadId = existing?.id;
    if (!threadId) {
      const { data: newThread, error } = await supabase.from('chat_threads').insert({
        participant_a: currentUserId,
        participant_b: otherId,
        ad_id: adId || null,
        last_message_at: new Date().toISOString()
      }).select().single();
      if (error || !newThread) return;
      threadId = newThread.id;
    }

    // Fetch profile of other user
    const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', otherId).single();

    const thread: ChatThread = {
      id: threadId,
      ad_id: adId || null,
      participant_a: currentUserId,
      participant_b: otherId,
      last_message_at: existing?.last_message_at || new Date().toISOString(),
      other_user_id: otherId,
      other_user_name: profile?.full_name || 'مستخدم',
      other_user_avatar: profile?.avatar_url || null,
      last_message_body: '',
      unread_count: 0,
      ad_title: adTitle
    };
    openThread(thread);
  };

  // ── Open thread & load messages ───────────────
  const openThread = async (thread: ChatThread) => {
    setActiveThread(thread);
    setView('chat');
    setLoadingMessages(true);
    setMessages([]);

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });

    setMessages(data || []);
    setLoadingMessages(false);

    // Mark unread as read
    await supabase.from('chat_messages')
      .update({ read: true })
      .eq('thread_id', thread.id)
      .eq('sender_id', thread.other_user_id)
      .eq('read', false);

    // Reload threads to update badge
    loadThreads();

    // Subscribe to realtime new messages in this thread
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    channelRef.current = supabase
      .channel(`chat_${thread.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `thread_id=eq.${thread.id}`
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as ChatMessage];
        });
        // Mark as read immediately if sent by other
        if (payload.new.sender_id !== currentUserId) {
          supabase.from('chat_messages').update({ read: true }).eq('id', payload.new.id).then();
        }
      })
      .subscribe();

    setTimeout(() => inputRef.current?.focus(), 300);
  };

  // ── Auto-scroll ───────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────
  const handleSend = async () => {
    const body = inputText.trim();
    if (!body || !activeThread || sending) return;
    setInputText('');
    setSending(true);

    try {
      // Insert message
      const { data: msgData, error } = await supabase.from('chat_messages').insert({
        thread_id: activeThread.id,
        sender_id: currentUserId,
        body,
        read: false
      }).select().single();

      if (error) { setSending(false); return; }

      // Update thread last_message_at
      await supabase.from('chat_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeThread.id);

      // Optimistically add message to UI
      setMessages(prev => [...prev.filter(m => m.id !== msgData.id), msgData]);

      // Send push notification to the other user
      try {
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('fcm_token')
          .eq('id', activeThread.other_user_id)
          .single();

        if (otherProfile?.fcm_token) {
          await supabase.functions.invoke('send-notification', {
            body: {
              token: otherProfile.fcm_token,
              title: `رسالة جديدة من ${currentUserName} 💬`,
              body: body.length > 60 ? body.substring(0, 60) + '...' : body,
              data: {
                type: 'chat_message',
                thread_id: activeThread.id,
                sender_id: currentUserId,
                sender_name: currentUserName
              }
            }
          });
        }
      } catch (pushErr) {
        console.warn('Push notification failed (non-critical):', pushErr);
      }
    } finally {
      setSending(false);
    }
  };

  // ── Cleanup realtime on unmount ───────────────
  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md h-[92vh] sm:h-[85vh] flex flex-col overflow-hidden border border-gray-700/50 shadow-2xl z-10"
      >
        <AnimatePresence mode="wait">
          {view === 'threads' ? (
            <ThreadsView
              key="threads"
              threads={threads}
              loading={loadingThreads}
              currentUserId={currentUserId}
              onClose={onClose}
              onOpenThread={openThread}
            />
          ) : (
            <ChatView
              key="chat"
              thread={activeThread!}
              messages={messages}
              currentUserId={currentUserId}
              loading={loadingMessages}
              sending={sending}
              inputText={inputText}
              inputRef={inputRef}
              messagesEndRef={messagesEndRef}
              onBack={() => { setView('threads'); loadThreads(); }}
              onInputChange={setInputText}
              onSend={handleSend}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Threads List View
// ──────────────────────────────────────────────
function ThreadsView({
  threads, loading, onClose, onOpenThread
}: {
  threads: ChatThread[];
  loading: boolean;
  currentUserId: string;
  onClose: () => void;
  onOpenThread: (t: ChatThread) => void;
}) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-800">
        <button onClick={onClose} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-white font-bold text-lg">الرسائل</h2>
          <p className="text-gray-500 text-xs">{threads.length} محادثة</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-gray-400 text-sm">جاري التحميل...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 px-8 text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-gray-600" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">لا توجد رسائل بعد</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                ابدأ محادثة مع أي بائع من خلال صفحة إعلانه
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {threads.map(thread => (
              <button
                key={thread.id}
                onClick={() => onOpenThread(thread)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition-colors text-right"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                    {thread.other_user_avatar ? (
                      <img src={thread.other_user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-gray-500" />
                    )}
                  </div>
                  {thread.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                      {thread.unread_count > 9 ? '9+' : thread.unread_count}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-sm ${thread.unread_count > 0 ? 'text-white' : 'text-gray-300'}`}>
                      {thread.other_user_name}
                    </span>
                    <span className="text-gray-500 text-xs shrink-0 mr-2">
                      {formatTime(thread.last_message_at)}
                    </span>
                  </div>
                  {thread.ad_title && (
                    <p className="text-amber-400 text-xs mb-0.5 truncate">📦 {thread.ad_title}</p>
                  )}
                  <p className={`text-xs truncate ${thread.unread_count > 0 ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                    {thread.last_message_body || 'ابدأ المحادثة...'}
                  </p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Single Chat View
// ──────────────────────────────────────────────
function ChatView({
  thread, messages, currentUserId, loading, sending,
  inputText, inputRef, messagesEndRef,
  onBack, onInputChange, onSend
}: {
  thread: ChatThread;
  messages: ChatMessage[];
  currentUserId: string;
  loading: boolean;
  sending: boolean;
  inputText: string;
  inputRef: React.RefObject<HTMLInputElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onBack: () => void;
  onInputChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-800 shrink-0">
        <button onClick={onBack} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 shrink-0 flex items-center justify-center">
          {thread.other_user_avatar ? (
            <img src={thread.other_user_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{thread.other_user_name}</p>
          {thread.ad_title && (
            <p className="text-amber-400 text-xs truncate">📦 {thread.ad_title}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
            <ImageIcon className="w-10 h-10 text-gray-700" />
            <p className="text-gray-500 text-sm">ابدأ المحادثة بإرسال أول رسالة 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                  isMine
                    ? 'bg-amber-500 text-black rounded-bl-md'
                    : 'bg-gray-700 text-white rounded-br-md'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${isMine ? 'text-black/60' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                    {isMine && (
                      msg.read
                        ? <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                        : <Check className="w-3.5 h-3.5 text-black/50" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-800 shrink-0">
        <div className="flex items-center gap-2 bg-gray-800 rounded-2xl px-4 py-2 border border-gray-700 focus-within:border-amber-500/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="اكتب رسالتك..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none text-right"
            dir="rtl"
          />
          <button
            onClick={onSend}
            disabled={!inputText.trim() || sending}
            className="w-9 h-9 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 rounded-xl flex items-center justify-center transition-colors shrink-0"
          >
            {sending
              ? <Loader2 className="w-4 h-4 text-black animate-spin" />
              : <Send className="w-4 h-4 text-black" />
            }
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Export helper: open chat with specific user/ad
// ──────────────────────────────────────────────
export type { ChatThread };
