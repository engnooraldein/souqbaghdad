// ===========================================
// مسؤولية هذا الملف:
// يُسجّل الأخطاء الحرجة (Critical Errors) في Supabase.
//
// استعلام Supabase:
// INSERT في جدول error_logs.
//
// يُستخدم في main.tsx لالتقاط Unhandled Promise Rejections.
//
// آمن للتعديل:
// نعم.
// ===========================================
import { supabase } from './supabase';

/**
 * Filter and log only critical errors to the database to prevent high usage/data cost.
 * It ignores network disconnects, common 4xx errors, or non-fatal UI errors.
 */
export async function logCriticalError(
  errorType: string, 
  errorMessage: string, 
  stackTrace?: string, 
  userId?: string
) {
  try {
    // 1. FILTERING LOGIC
    // We only care about real critical crashes (500s, PG errors, React crashes)
    const lowerMsg = errorMessage.toLowerCase();
    
    // Ignore harmless or common errors
    if (
      lowerMsg.includes('fetch') ||
      lowerMsg.includes('network') ||
      lowerMsg.includes('failed to fetch') ||
      lowerMsg.includes('load failed') ||
      lowerMsg.includes('401') ||
      lowerMsg.includes('403') ||
      lowerMsg.includes('websocket') ||
      lowerMsg.includes('timeout')
    ) {
      return; // Do not log to Supabase, save database operations!
    }

    // 2. SEND CRITICAL ERROR TO SUPABASE
    await supabase.from('critical_errors').insert([
      {
        error_type: errorType,
        error_message: errorMessage,
        stack_trace: stackTrace || '',
        user_id: userId || null,
        url_location: window.location.href,
      }
    ]);
    
  } catch (err) {
    // Failsafe: if the error logger itself fails, just print to console to avoid infinite loops
    console.error('Failed to log critical error to Supabase:', err);
  }
}
