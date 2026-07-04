import os

file_path = r"c:\Users\hp\Documents\GitHub\souqbaghdad\artifacts\souq-baghdad\src\App.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update handleBroadcast in OwnerDashboard (map dbUsers, insert to user_notifications)
target_broadcast = """  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!broadcastTitle || !broadcastMsg) return;
    setIsBroadcasting(true);
    try {
      const userIds = storedUsers.map(u => u.id).filter(id => id);
      if (userIds.length > 0) {
        const notifications = userIds.map(uid => ({
          seller_id: uid,
          title: broadcastTitle,
          description: broadcastMsg,
          price: '0',
          category: 'notification',
          location: '',
          city: '',
          images: [],
          phone: '',
          type: 'notification',
          status: 'active',
          is_demo: false,
          seller_name: 'إدارة الموقع',
          seller_avatar: '',
          metadata: { type: 'message', message: broadcastMsg, title: broadcastTitle }
        }));
        
        const chunkSize = 100;
        for (let i = 0; i < notifications.length; i += chunkSize) {
          const chunk = notifications.slice(i, i + chunkSize);
          await supabase.from('ads').insert(chunk);
        }
      }"""

replacement_broadcast = """  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!broadcastTitle || !broadcastMsg) return;
    setIsBroadcasting(true);
    try {
      const userIds = dbUsers.map(u => u.id).filter(id => id);
      if (userIds.length > 0) {
        const notifications = userIds.map(uid => ({
          user_id: uid,
          title: broadcastTitle,
          body: broadcastMsg,
          type: 'system',
          audience: 'all',
          read: false
        }));
        
        const chunkSize = 100;
        for (let i = 0; i < notifications.length; i += chunkSize) {
          const chunk = notifications.slice(i, i + chunkSize);
          await supabase.from('user_notifications').insert(chunk);
        }
      }"""

if target_broadcast in content:
    content = content.replace(target_broadcast, replacement_broadcast)
    print("1. Updated handleBroadcast logic.")
else:
    print("ERROR 1: handleBroadcast target not found!")

# 2. Update NotifPanel signature and call
target_notif_panel_sig = """function NotifPanel({ isOpen, onClose, notifs, onNotifClick, onHistoryClick, onMarkRead, onArchiveAll }:{
  isOpen:boolean;
  onClose:()=>void;
  notifs:any[];
  onNotifClick:(senderId:string)=>void;
  onHistoryClick:(itemId: string | number, itemType: string)=>void;
  onMarkRead:(id: number | string) => void;
  onArchiveAll:() => void;
}) {"""

replacement_notif_panel_sig = """function NotifPanel({ isOpen, onClose, notifs, onNotifClick, onHistoryClick, onMarkRead, onArchiveAll }:{
  isOpen:boolean;
  onClose:()=>void;
  notifs:any[];
  onNotifClick:(senderId:string)=>void;
  onHistoryClick:(itemId: string | number, itemType: string)=>void;
  onMarkRead:(id: number | string, sourceTable?: 'ads' | 'user_notifications') => void;
  onArchiveAll:() => void;
}) {"""

if target_notif_panel_sig in content:
    content = content.replace(target_notif_panel_sig, replacement_notif_panel_sig)
    print("2. Updated NotifPanel signature.")
else:
    print("ERROR 2: NotifPanel signature target not found!")

target_notif_panel_click = """                    // Mark as read/archive
                    if (n.id) onMarkRead(n.id);"""

replacement_notif_panel_click = """                    // Mark as read/archive
                    if (n.id) onMarkRead(n.id, n.sourceTable);"""

if target_notif_panel_click in content:
    content = content.replace(target_notif_panel_click, replacement_notif_panel_click)
    print("3. Updated NotifPanel click mark-as-read call.")
else:
    print("ERROR 3: NotifPanel click call target not found!")

# 3. Update fetchNotifications logic in App component
target_fetch_notifs = """  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('category', 'notification')
      .eq('seller_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) { console.error('Error fetching notifications:', error); return; }
    if (data) {
      const mapped = data.map((row: any) => {
        let extra = {
          message: '',
          type: 'view',
          senderId: '',
          senderName: 'مستخدم',
          senderPhone: '',
          itemTitle: '',
          itemType: 'ad',
          itemId: '',
          duration: 0,
          targetType: 'owner'
        };
        try {
          if (row.description) {
            extra = { ...extra, ...JSON.parse(row.description) };
          }
        } catch (e) {
          extra.message = row.description || '';
        }
        return {
          id: row.id,
          type: extra.type,
          title: row.title,
          message: extra.message,
          time: row.created_at,
          senderId: extra.senderId,
          senderName: extra.senderName,
          senderPhone: extra.senderPhone,
          itemTitle: extra.itemTitle,
          itemType: extra.itemType,
          itemId: extra.itemId,
          duration: extra.duration,
          targetType: extra.targetType
        };
      });
      setNotifications(mapped);
    }
  }, [user]);"""

replacement_fetch_notifs = """  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch from ads table (broadcasts)
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select('*')
        .eq('category', 'notification')
        .eq('seller_id', user.id)
        .eq('status', 'active');

      // 2. Fetch from user_notifications table (views, reviews, system)
      const { data: userNotifs, error: userNotifsError } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false);

      let combined: any[] = [];

      if (!adsError && adsData) {
        adsData.forEach((row: any) => {
          let extra = {
            message: '',
            type: 'view',
            senderId: '',
            senderName: 'مستخدم',
            senderPhone: '',
            itemTitle: '',
            itemType: 'ad',
            itemId: '',
            duration: 0,
            targetType: 'owner'
          };
          try {
            if (row.description) {
              extra = { ...extra, ...JSON.parse(row.description) };
            }
          } catch (e) {
            extra.message = row.description || '';
          }
          combined.push({
            id: row.id,
            type: extra.type,
            title: row.title,
            message: extra.message,
            time: row.created_at,
            senderId: extra.senderId,
            senderName: extra.senderName,
            senderPhone: extra.senderPhone,
            itemTitle: extra.itemTitle,
            itemType: extra.itemType,
            itemId: extra.itemId,
            duration: extra.duration,
            targetType: extra.targetType,
            sourceTable: 'ads'
          });
        });
      }

      if (!userNotifsError && userNotifs) {
        userNotifs.forEach((row: any) => {
          combined.push({
            id: row.id,
            type: row.type || 'system',
            title: row.title,
            message: row.body,
            time: row.created_at,
            senderId: '',
            senderName: 'إدارة الموقع',
            senderPhone: '',
            itemTitle: '',
            itemType: 'ad',
            itemId: '',
            duration: 0,
            targetType: row.audience === 'owner' ? 'owner' : 'viewer',
            sourceTable: 'user_notifications'
          });
        });
      }

      // Sort combined notifications by time (newest first)
      combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(combined);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, [user]);"""

if target_fetch_notifs in content:
    content = content.replace(target_fetch_notifs, replacement_fetch_notifs)
    print("4. Updated fetchNotifications logic.")
else:
    print("ERROR 4: fetchNotifications target not found!")

# 4. Update markNotifAsRead and handleArchiveAllNotifications
target_mark_read = """  const markNotifAsRead = async (notifId: number | string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: 'archived' })
        .eq('id', notifId);
      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notifId));
      }
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };"""

replacement_mark_read = """  const markNotifAsRead = async (notifId: number | string, sourceTable: 'ads' | 'user_notifications' = 'ads') => {
    try {
      if (sourceTable === 'user_notifications') {
        const { error } = await supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('id', notifId);
        if (!error) {
          setNotifications(prev => prev.filter(n => n.id !== notifId));
        }
      } else {
        const { error } = await supabase
          .from('ads')
          .update({ status: 'archived' })
          .eq('id', notifId);
        if (!error) {
          setNotifications(prev => prev.filter(n => n.id !== notifId));
        }
      }
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };"""

if target_mark_read in content:
    content = content.replace(target_mark_read, replacement_mark_read)
    print("5. Updated markNotifAsRead logic.")
else:
    print("ERROR 5: markNotifAsRead target not found!")

target_archive_all = """  const handleArchiveAllNotifications = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: 'archived' })
        .eq('category', 'notification')
        .eq('seller_id', user.id)
        .eq('status', 'active');
      if (!error) {
        setNotifications([]);
      }
    } catch (e) {
      console.error('Failed to archive all notifications', e);
    }
  };"""

replacement_archive_all = """  const handleArchiveAllNotifications = async () => {
    if (!user) return;
    try {
      await supabase
        .from('ads')
        .update({ status: 'archived' })
        .eq('category', 'notification')
        .eq('seller_id', user.id)
        .eq('status', 'active');

      await supabase
        .from('user_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications([]);
    } catch (e) {
      console.error('Failed to archive all notifications', e);
    }
  };"""

if target_archive_all in content:
    content = content.replace(target_archive_all, replacement_archive_all)
    print("6. Updated handleArchiveAllNotifications logic.")
else:
    print("ERROR 6: handleArchiveAllNotifications target not found!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("\nDone! PWA notification flow script completed.")
