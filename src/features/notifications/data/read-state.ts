const keyFor = (roomId: string) => "hamotaghi-notification-read-" + roomId;

export function loadReadNotificationIds(roomId: string): string[] {
  try {
    const value = localStorage.getItem(keyFor(roomId));
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}

export function markNotificationsRead(roomId: string, ids: string[]) {
  try { localStorage.setItem(keyFor(roomId), JSON.stringify([...new Set([...loadReadNotificationIds(roomId), ...ids])])); } catch { /* Storage can be unavailable in private mode. */ }
}
