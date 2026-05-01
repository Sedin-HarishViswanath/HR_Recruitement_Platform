export const sendResponse = (res: any, status: number, success: boolean, message: string, data: any = null) => {
  return res.status(status).json({
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};
