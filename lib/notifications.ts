/**
 * Notifications utility for rider notifications
 * Handles polling for new orders and playing sound notifications
 */

export interface RiderNotification {
  id: number;
  user: number;
  order: number;
  message: string;
  notification_type: 'order_update' | 'new_order' | 'order_assigned';
  created_at: string;
  is_read: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

/**
 * Play a notification sound
 */
export function playNotificationSound(): void {
  try {
    // Try to play a file-based sound first
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio
      .play()
      .catch(() => {
        // Fallback to generated tone if file not found
        playGeneratedTone();
      });
  } catch (error) {
    console.warn('Notification sound error:', error);
    // Fallback to generated tone
    playGeneratedTone();
  }
}

/**
 * Generate and play a simple notification tone using Web Audio API
 */
function playGeneratedTone(): void {
  try {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    
    // Create oscillator for a pleasant bell-like tone
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play two frequencies for a nice bell sound
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Could not generate tone:', error);
  }
}

/**
 * Fetch unread notifications for the current rider
 */
export async function fetchRiderNotifications(
  token: string
): Promise<RiderNotification[]> {
  try {
    const res = await fetch(`${API_BASE}/notifications/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    // Filter for new_order type notifications that haven't been read
    const notifications = Array.isArray(data) ? data : data.results || [];
    return notifications.filter(
      (n: RiderNotification) => n.notification_type === 'new_order' && !n.is_read
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: number,
  token: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}/mark_read/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
    });

    return res.ok;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}
