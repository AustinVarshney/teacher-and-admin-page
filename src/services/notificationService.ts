import { api } from './api';

export interface NotificationDto {
  id?: number;
  title: string;
  message: string;
  recipientId: string;
  recipientType: 'STUDENT' | 'TEACHER' | 'STAFF' | 'ADMIN';
  senderName?: string;
  isRead?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt?: string;
  readAt?: string;
}

export interface BroadcastMessageDto {
  title: string;
  message: string;
  recipientIds: string[];
  recipientType: 'STUDENT' | 'TEACHER' | 'STAFF' | 'ADMIN';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class NotificationService {
  // Broadcast message to multiple recipients (Admin only)
  static async broadcastMessage(broadcastData: BroadcastMessageDto): Promise<NotificationDto[]> {
    try {
      const response = await api.post('/notifications/broadcast', broadcastData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to broadcast message');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to broadcast message';
      throw new Error(message);
    }
  }

  // Get all notifications for current user
  static async getMyNotifications(): Promise<NotificationDto[]> {
    try {
      const response = await api.get('/notifications/me');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch notifications');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch notifications';
      throw new Error(message);
    }
  }

  // Get unread notifications for current user
  static async getUnreadNotifications(): Promise<NotificationDto[]> {
    try {
      const response = await api.get('/notifications/me/unread');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch unread notifications');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch unread notifications';
      throw new Error(message);
    }
  }

  // Get unread notification count for current user
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/me/unread/count');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch unread count');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch unread count';
      throw new Error(message);
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: number): Promise<NotificationDto> {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to mark notification as read');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to mark notification as read';
      throw new Error(message);
    }
  }

  // Mark all notifications as read for current user
  static async markAllAsRead(): Promise<void> {
    try {
      const response = await api.put('/notifications/me/read-all');
      
      if (response.status >= 200 && response.status < 300) {
        return;
      }
      throw new Error(response.data.message || 'Failed to mark all notifications as read');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to mark all notifications as read';
      throw new Error(message);
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: number): Promise<void> {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      
      if (response.status >= 200 && response.status < 300) {
        return;
      }
      throw new Error(response.data.message || 'Failed to delete notification');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete notification';
      throw new Error(message);
    }
  }
}

export default NotificationService;
