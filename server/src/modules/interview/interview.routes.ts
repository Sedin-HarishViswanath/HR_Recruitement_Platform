import { Router, Request, Response } from 'express';
import { executeCode } from './code-execution.service';
import { sendResponse } from '../../shared/utils/response';

const router = Router();

router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { script, language, versionIndex, stdin } = req.body;
    
    if (!script || !language) {
      return sendResponse(res, 400, false, 'Script and language are required');
    }

    const result = await executeCode({ script, language, versionIndex, stdin });
    return sendResponse(res, 200, true, 'Code executed successfully', result);
  } catch (error: any) {
    console.error('JDoodle Error:', error.response?.data || error.message);
    return sendResponse(res, 500, false, 'Error executing code');
  }
});

export default router;
