import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Notification } from '../models/notification.model';
import { SessionService } from './session.service';

declare var SockJS: any;
declare var Stomp: any;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/v1/notifications';
  private stompClient: any = null;
  private connectedUsername: string | null = null;
  private reconnectTimer: any = null;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private latestNotificationSubject = new BehaviorSubject<Notification | null>(null);
  public latestNotification$ = this.latestNotificationSubject.asObservable();

  private normalizeNotification(notification: any): Notification {
    return {
      ...notification,
      read: notification?.read ?? notification?.isRead ?? false,
      isRead: notification?.isRead ?? notification?.read ?? false
    } as Notification;
  }

  private setNotifications(notifications: any[]) {
    this.notificationsSubject.next((notifications || []).map(n => this.normalizeNotification(n)));
  }

  constructor(private http: HttpClient, private sessionService: SessionService, private zone: NgZone) {
    this.sessionService.session$.subscribe(user => {
      if (user) {
        if (this.connectedUsername !== user.username) {
          this.disconnectWebSocket();
          this.fetchNotifications();
          this.connectWebSocket(user.username);
        }
      } else {
        this.disconnectWebSocket();
        this.notificationsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
  }

  private fetchNotifications() {
    this.http.get<any>(this.apiUrl).subscribe(response => {
      const notifications = (response.notifications || []).map((n: any) => this.normalizeNotification(n));
      this.setNotifications(notifications);
      this.unreadCountSubject.next(typeof response.unreadCount === 'number' ? response.unreadCount : notifications.filter((n: Notification) => !n.read).length);
    });
  }

  private connectWebSocket(username: string) {
    if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
      this.reconnectTimer = setTimeout(() => this.connectWebSocket(username), 2000);
      return;
    }
    this.initializeWebSocket(username);
  }

  private initializeWebSocket(username: string) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const isDev = window.location.port === '4200';
    const sockjsOptions = isDev ? { transports: ['xhr-streaming', 'xhr-polling'] } : {};
    const socket = new SockJS('/notify', null, sockjsOptions);
    const client = Stomp.over(socket);
    client.debug = () => {};

    socket.onclose = () => {
      if (this.connectedUsername === username) {
        this.stompClient = null;
        this.connectedUsername = null;
        this.scheduleReconnect(username);
      }
    };

    client.connect({}, () => {
      if (this.connectedUsername !== null && this.connectedUsername !== username) {
        client.disconnect();
        return;
      }
      this.stompClient = client;
      this.connectedUsername = username;

      client.subscribe('/user/queue/notifications', (message: any) => {
        this.zone.run(() => {
              const notification = this.normalizeNotification(JSON.parse(message.body));
          try { console.debug('[WS] notification received:', notification?.type, notification); } catch (e) {}
          this.addNotification(notification);
          this.latestNotificationSubject.next(notification);
          setTimeout(() => this.latestNotificationSubject.next(null), 5000);
        });
      });
    }, (_error: any) => {
      this.stompClient = null;
      this.connectedUsername = null;
      this.scheduleReconnect(username);
    });
  }

  private scheduleReconnect(username: string, delay = 5000) {
    this.reconnectTimer = setTimeout(() => {
      if (this.sessionService.session$.value?.username === username) {
        this.initializeWebSocket(username);
      }
    }, delay);
  }

  private disconnectWebSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.stompClient) {
      try { this.stompClient.disconnect(); } catch (_) {}
      this.stompClient = null;
    }
    this.connectedUsername = null;
  }

  private addNotification(notification: Notification) {
    const current = this.notificationsSubject.value;
    if (notification.id && current.some(n => n.id === notification.id)) {
      return;
    }
    this.notificationsSubject.next([notification, ...current]);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
  }

  markAsRead(id: number) {
    this.http.patch(`${this.apiUrl}/${id}/read`, {}).subscribe(() => {
      const current = this.notificationsSubject.value.map(n => n.id === id ? { ...n, read: true, isRead: true } : n);
      this.notificationsSubject.next(current);
      this.unreadCountSubject.next(Math.max(0, current.filter(n => !n.read).length));
      this.fetchNotifications();
    });
  }

  markAllAsRead() {
    this.http.patch(`${this.apiUrl}/read-all`, {}).subscribe(() => {
      const current = this.notificationsSubject.value.map(n => ({ ...n, read: true, isRead: true }));
      this.notificationsSubject.next(current);
      this.unreadCountSubject.next(0);
      this.fetchNotifications();
    });
  }
}
