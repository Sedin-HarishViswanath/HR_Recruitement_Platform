import { Request, Response } from 'express';
import { practiceService } from './practice.service';
import { sendResponse } from '../../shared/utils/response';

export class PracticeController {
  async chat(req: Request, res: Response) {
    try {
      const { message, history, mode, language, code } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return sendResponse(res, 400, false, 'Message is required');
      }

      const validModes = ['behavioral', 'technical', 'system_design'];
      const chatMode = validModes.includes(mode) ? mode : 'technical';

      const result = await practiceService.chat({
        message: message.trim(),
        history: Array.isArray(history) ? history : [],
        mode: chatMode,
        language,
        code,
      });

      return sendResponse(res, 200, true, 'AI response generated', result);
    } catch (error: any) {
      console.error('[PracticeController] chat error:', error.message);
      const status = error.message?.includes('rate-limited') ? 429 : 500;
      return sendResponse(res, status, false, error.message || 'Failed to generate AI response');
    }
  }
}

export const practiceController = new PracticeController();
