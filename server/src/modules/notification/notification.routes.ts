import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { inAppNotificationService } from './inapp-notification.service';
import { sendResponse } from '../../shared/utils/response';

const router = Router();

// GET /api/notifications — get all notifications for the logged-in user
router.get('/', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.candidateId ? null : req.user.userId;
    const candidateId = req.user.candidateId || null;

    const [notifications, unreadCount] = await Promise.all([
      inAppNotificationService.getForUser(userId, candidateId),
      inAppNotificationService.getUnreadCount(userId, candidateId),
    ]);

    return sendResponse(res, 200, true, 'Notifications retrieved', { notifications, unreadCount });
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to fetch notifications');
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.candidateId ? null : req.user.userId;
    const candidateId = req.user.candidateId || null;

    await inAppNotificationService.markAsRead(req.params.id, userId, candidateId);
    return sendResponse(res, 200, true, 'Marked as read');
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to mark notification');
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.candidateId ? null : req.user.userId;
    const candidateId = req.user.candidateId || null;

    await inAppNotificationService.markAllAsRead(userId, candidateId);
    return sendResponse(res, 200, true, 'All marked as read');
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to mark all notifications');
  }
});

export default router;
