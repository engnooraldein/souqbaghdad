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
