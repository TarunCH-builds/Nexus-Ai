/**
 * NEXUS AI - Desktop Integration Bridge (Tauri + Web Dual Runtime)
 * Handles native window controls, clipboard, system notifications, and hardware hooks.
 */

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: any) => Promise<any>;
    };
  }
}

export class DesktopBridge {
  public static isDesktopApp(): boolean {
    return typeof window !== 'undefined' && Boolean(window.__TAURI__);
  }

  public static async minimizeWindow(): Promise<void> {
    if (this.isDesktopApp()) {
      try {
        await window.__TAURI__?.invoke('minimize_window');
        return;
      } catch (err) {
        console.warn('Tauri minimize error:', err);
      }
    }
    console.log('[DesktopBridge] Minimize window invoked (Web preview mode)');
  }

  public static async toggleMaximize(): Promise<void> {
    if (this.isDesktopApp()) {
      try {
        await window.__TAURI__?.invoke('toggle_maximize_window');
        return;
      } catch (err) {
        console.warn('Tauri maximize error:', err);
      }
    }
    console.log('[DesktopBridge] Toggle maximize window invoked (Web preview mode)');
  }

  public static async closeWindow(): Promise<void> {
    if (this.isDesktopApp()) {
      try {
        await window.__TAURI__?.invoke('close_window');
        return;
      } catch (err) {
        console.warn('Tauri close error:', err);
      }
    }
    console.log('[DesktopBridge] Close window invoked (Web preview mode)');
  }

  public static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Clipboard copy error:', err);
      return false;
    }
  }

  public static async sendDesktopNotification(title: string, body: string): Promise<void> {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      }
    }
  }
}
