/**
 * Persistent System Logger Utility
 * Stores full process lifecycle logs in localStorage.
 * Does NOT reset across browser refreshes or reloads unless explicitly cleared by the user.
 */

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';
export type LogCategory = 'system' | 'upload' | 'ai-diagnosis' | 'upscale-engine' | 'export' | 'config';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, any>;
}

const STORAGE_KEY = 'AI_UPSCALER_SYSTEM_LOGS_V1';

/**
 * Retrieve all persistent logs from localStorage
 */
export function getPersistentLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LogEntry[];
  } catch (err) {
    console.error('Failed to parse persistent logs from localStorage:', err);
    return [];
  }
}

/**
 * Save logs array to localStorage
 */
function savePersistentLogs(logs: LogEntry[]): void {
  try {
    // Keep up to 2000 log entries to prevent localStorage quota exhaustion
    const trimmed = logs.slice(-2000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save persistent logs to localStorage:', err);
  }
}

/**
 * Add a new log entry and save to localStorage
 */
export function logSystemEvent(
  level: LogLevel,
  category: LogCategory,
  message: string,
  details?: Record<string, any>
): LogEntry {
  const now = new Date();
  const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(
    now.getMilliseconds()
  ).padStart(3, '0')}`;

  const newEntry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: timeString,
    level,
    category,
    message,
    details,
  };

  const currentLogs = getPersistentLogs();
  currentLogs.push(newEntry);
  savePersistentLogs(currentLogs);

  // Also print to browser console for developer convenience
  const consolePrefix = `[${category.toUpperCase()}]`;
  if (level === 'error') console.error(consolePrefix, message, details || '');
  else if (level === 'warn') console.warn(consolePrefix, message, details || '');
  else console.log(consolePrefix, message, details || '');

  // Dispatch custom event so React UI updates in real-time
  window.dispatchEvent(new CustomEvent('system-log-updated', { detail: newEntry }));

  return newEntry;
}

/**
 * Clear all persistent logs (ONLY upon explicit user trigger)
 */
export function clearPersistentLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('system-log-cleared'));
  } catch (err) {
    console.error('Failed to clear persistent logs:', err);
  }
}

/**
 * Export logs as JSON file for debugging
 */
export function downloadLogsAsJson(): void {
  const logs = getPersistentLogs();
  const jsonStr = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `upscaler_system_logs_${Date.now()}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
