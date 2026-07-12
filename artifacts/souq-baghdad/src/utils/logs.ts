// ===========================================
// مسؤولية هذا الملف:
// دوال تسجيل إجراءات النظام (System Logs Utilities).
// تُسجّل الأحداث المهمة في جدول Supabase (system_logs).
//
// استعلام Supabase:
// INSERT في جدول system_logs عند كل استدعاء.
//
// انتبه:
// لا تستدعِ هذه الدالة بشكل متكرر حتى لا تملأ الجدول.
//
// آمن للتعديل:
// نعم.
// ===========================================
import { SystemLog } from '../types';

export const logSystemAction = (action: string, details: string, target?: string, admin: string = 'المالك') => {
  try {
    const logs: SystemLog[] = JSON.parse(localStorage.getItem('souq_system_logs') || '[]');
    const newLog: SystemLog = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      action,
      admin,
      details,
      target
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    localStorage.setItem('souq_system_logs', JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to log action:', err);
  }
};
