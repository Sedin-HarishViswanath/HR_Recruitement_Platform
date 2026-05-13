import { db } from '../../config/db';
import { notifyUser } from '../../socket';

export interface CreateNotificationInput {
  userId?: string | number | null;
  candidateId?: string | number | null;
  title: string;
  body: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export class InAppNotificationService {
  /**
   * Creates a persistent notification in the database and emits a real-time
   * socket event to the user if they are currently connected.
   */
  async create(data: CreateNotificationInput): Promise<void> {
    const { userId, candidateId, title, body, type = 'info', link } = data;

    if (!userId && !candidateId) return;

    // 1. Persist to database
    const [notification] = await db('notifications')
      .insert({
        user_id: userId || null,
        candidate_id: candidateId || null,
        title,
        body,
        type,
        link: link || null,
      })
      .returning('*');

    // 2. Push real-time event to the connected user
    const socketUserId = userId?.toString() || candidateId?.toString();
    if (socketUserId) {
      notifyUser(socketUserId, 'new-notification', notification);
    }
  }

  /**
   * Get all notifications for a user (sorted by most recent first)
   */
  async getForUser(userId: string | null, candidateId: string | null, limit = 30) {
    let query = db('notifications').orderBy('created_at', 'desc').limit(limit);

    if (userId) {
      query = query.where({ user_id: userId });
    } else if (candidateId) {
      query = query.where({ candidate_id: candidateId });
    } else {
      return [];
    }

    return query;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string | null, candidateId: string | null): Promise<number> {
    let query = db('notifications').whereNull('read_at');

    if (userId) {
      query = query.where({ user_id: userId });
    } else if (candidateId) {
      query = query.where({ candidate_id: candidateId });
    } else {
      return 0;
    }

    const result = await query.count('id as count').first();
    return parseInt(result?.count as string || '0');
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string, userId: string | null, candidateId: string | null) {
    const query = db('notifications').where({ id: notificationId }).update({ read_at: db.fn.now() });

    if (userId) {
      query.where({ user_id: userId });
    } else if (candidateId) {
      query.where({ candidate_id: candidateId });
    }

    return query;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string | null, candidateId: string | null) {
    const query = db('notifications').whereNull('read_at').update({ read_at: db.fn.now() });

    if (userId) {
      query.where({ user_id: userId });
    } else if (candidateId) {
      query.where({ candidate_id: candidateId });
    }

    return query;
  }
}

export const inAppNotificationService = new InAppNotificationService();
