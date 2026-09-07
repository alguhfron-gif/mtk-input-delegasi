/**
 * Real-time sound chime and system notification utilities
 * for cross-device alerts (HP and Komputer)
 */

export interface RealtimeAlert {
  id: string;
  tipe: 'delegasi' | 'peserta' | 'anggaran';
  judul: string;
  pesan: string;
  timestamp: number;
}

// -------------------------------------------------------------
// Audio Chime via Web Audio API (Zero dependencies, instant)
// -------------------------------------------------------------
let audioCtx: AudioContext | null = null;

export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // First tone (587.33 Hz - Note D5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonious tone (880 Hz - Note A5)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn('Audio chime could not play:', err);
  }
}

// -------------------------------------------------------------
// System Notification (Desktop & Android Notification Tray)
// -------------------------------------------------------------
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return 'denied';
  }
}

export function sendSystemNotification(title: string, body: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    // Getar HP jika perangkat mendukung
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 70, 150]);
      } catch {
        // ignore
      }
    }

    const options = {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [150, 70, 150],
      tag: 'mtk-alert-' + Date.now(),
      renotify: true
    };

    // 1. Coba via ServiceWorker terlebih dahulu (Paling ampuh di HP Android saat di latar belakang)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options).catch(() => {
          // Fallback ke window Notification jika ServiceWorker gagal
          try {
            new Notification(title, options);
          } catch {}
        });
      }).catch(() => {
        try {
          new Notification(title, options);
        } catch {}
      });
    } else {
      try {
        new Notification(title, options);
      } catch {}
    }
  }
}

// -------------------------------------------------------------
// Broadcast Alert Trigger (Combines Sound + System + In-App Toast)
// -------------------------------------------------------------
type AlertCallback = (alert: RealtimeAlert) => void;
const alertSubscribers: Set<AlertCallback> = new Set();

export function onRealtimeAlert(callback: AlertCallback) {
  alertSubscribers.add(callback);
  return () => {
    alertSubscribers.delete(callback);
  };
}

export function triggerAlert(tipe: 'delegasi' | 'peserta' | 'anggaran', judul: string, pesan: string) {
  const alertItem: RealtimeAlert = {
    id: 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    tipe,
    judul,
    pesan,
    timestamp: Date.now()
  };

  // 1. Play pleasant sound chime
  playNotificationChime();

  // 2. Send system notification to phone / computer tray
  sendSystemNotification(judul, pesan);

  // 3. Dispatch to all in-app UI subscribers
  alertSubscribers.forEach((cb) => cb(alertItem));
}
