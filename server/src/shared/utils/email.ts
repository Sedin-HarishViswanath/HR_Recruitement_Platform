import nodemailer from 'nodemailer';
import { db } from '../../config/db';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  ...(process.env.SMTP_USER && process.env.SMTP_PASS ? {
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  } : {}),
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
}

export const sendEmail = async (options: SendEmailOptions) => {
  const { to, subject, html, eventType, entityType, entityId } = options;

  // 1. Create log entry
  const [logId] = await db('notification_logs').insert({
    recipient_email: to,
    subject,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    status: 'pending',
    attempts: 1,
    last_attempt_at: db.fn.now(),
  }).returning('id');

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"HR Platform" <noreply@hrplatform.com>',
      to,
      subject,
      html,
    });

    // 2. Update log to sent
    await db('notification_logs')
      .where({ id: logId.id || logId })
      .update({ status: 'sent', sent_at: db.fn.now() });

  } catch (error: any) {
    console.error('Failed to send email:', error);
    
    // 3. Update log to failed
    await db('notification_logs')
      .where({ id: logId.id || logId })
      .update({ status: 'failed', error_message: error.message });
  }
};
