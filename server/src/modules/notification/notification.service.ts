import { sendEmail } from '../../shared/utils/email';
import * as templates from '../../shared/templates/emailTemplates';

export class NotificationService {
  async notifyWelcome(name: string, email: string) {
    return sendEmail({
      to: email,
      subject: 'Welcome to HR Recruitment Platform',
      html: templates.welcomeEmail(name),
      eventType: 'welcome'
    });
  }

  async notifyApplicationSubmitted(candidate: any, job: any, company: any) {
    return sendEmail({
      to: candidate.email,
      subject: `Application Confirmation: ${job.title}`,
      html: templates.applicationConfirmation(candidate.name, job.title, company.name),
      eventType: 'application_submitted',
      entityType: 'application',
      entityId: candidate.application_id
    });
  }

  async notifyInterviewScheduled(candidate: any, job: any, interview: any) {
    const dateStr = new Date(interview.scheduled_at).toLocaleString();
    return sendEmail({
      to: candidate.email,
      subject: `Interview Invitation: ${job.title}`,
      html: templates.interviewScheduled(candidate.name, job.title, interview.round_type, dateStr, interview.meeting_link),
      eventType: 'interview_scheduled',
      entityType: 'interview',
      entityId: interview.id
    });
  }

  async notifyStatusUpdate(candidate: any, job: any, newStage: string) {
    return sendEmail({
      to: candidate.email,
      subject: `Application Update: ${job.title}`,
      html: templates.statusUpdate(candidate.name, job.title, newStage),
      eventType: 'status_update'
    });
  }
}

export const notificationService = new NotificationService();
