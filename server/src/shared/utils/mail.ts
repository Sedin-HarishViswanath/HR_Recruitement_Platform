import nodemailer from 'nodemailer';
import { env } from '../../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT),
  secure: env.SMTP_PORT === '465',
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"HR Platform" <${env.SMTP_USER || 'noreply@hrplatform.com'}>`,
      to,
      subject,
      html,
    });
    console.log(`Message sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
