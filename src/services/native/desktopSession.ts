/**
 * Native Desktop Session Storage Service
 *
 * Persists and restores the last opened manuscript file path and active chapter
 * for desktop application launches (Tauri).
 */

export interface DesktopSession {
  filePath: string;
  activeChapterId: string | null;
  timestamp: number;
}

const DESKTOP_SESSION_KEY = 'chronicle_desktop_last_session_v1';

/**
 * Persists the current desktop editing session.
 */
export function saveDesktopSession(filePath: string, activeChapterId: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const session: DesktopSession = {
      filePath,
      activeChapterId,
      timestamp: Date.now(),
    };
    localStorage.setItem(DESKTOP_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('[DesktopSession] Failed to save session:', err);
  }
}

/**
 * Retrieves the last saved desktop session, if any.
 */
export function getDesktopSession(): DesktopSession | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(DESKTOP_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.filePath === 'string' && parsed.filePath.trim().length > 0) {
      return parsed as DesktopSession;
    }
    return null;
  } catch (err) {
    console.warn('[DesktopSession] Failed to parse session:', err);
    return null;
  }
}

/**
 * Updates only the active chapter of the currently stored desktop session.
 */
export function updateDesktopSessionChapter(activeChapterId: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getDesktopSession();
    if (current && current.filePath) {
      current.activeChapterId = activeChapterId;
      current.timestamp = Date.now();
      localStorage.setItem(DESKTOP_SESSION_KEY, JSON.stringify(current));
    }
  } catch (err) {
    console.warn('[DesktopSession] Failed to update chapter:', err);
  }
}

/**
 * Clears the stored desktop session (e.g., when a file is closed, missing, or a new blank book is created).
 */
export function clearDesktopSession(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(DESKTOP_SESSION_KEY);
  } catch {
    /* Ignore errors */
  }
}
