import { sendEmail } from '../../shared/utils/email';
import * as templates from '../../shared/templates/emailTemplates';
import { notifyUser } from '../../socket';

export class NotificationService {
  async notifyWelcome(userId: string, name: string, email: string) {
    // Socket notification
    notifyUser(userId, 'notification', {
      title: 'Welcome!',
      message: `Hi ${name}, welcome to RecruitAI!`,
      type: 'info'
    });

    return sendEmail({
      to: email,
      subject: 'Welcome to RecruitAI',
      html: templates.welcomeEmail(name),
      eventType: 'welcome'
    });
  }

  async notifyApplicationSubmitted(candidate: any, job: any, company: any) {
    // Socket notification for candidate
    notifyUser(candidate.id, 'notification', {
      title: 'Application Received',
      message: `Your application for ${job.title} at ${company.name} was received.`,
      type: 'success'
    });

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
    
    // Socket notification for candidate
    notifyUser(candidate.id, 'notification', {
      title: 'Interview Scheduled',
      message: `Your interview for ${job.title} is scheduled for ${dateStr}.`,
      type: 'calendar'
    });

    // Socket notification for interviewer if different from user
    if (interview.interviewer_id) {
       notifyUser(interview.interviewer_id, 'notification', {
         title: 'New Interview Assigned',
         message: `You have been assigned an interview for ${job.title} with ${candidate.name}.`,
         type: 'calendar'
       });
    }

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
    // Socket notification
    notifyUser(candidate.id, 'notification', {
      title: 'Application Update',
      message: `Your application for ${job.title} has been moved to: ${newStage}.`,
      type: 'info'
    });

    return sendEmail({
      to: candidate.email,
      subject: `Application Update: ${job.title}`,
      html: templates.statusUpdate(candidate.name, job.title, newStage),
      eventType: 'status_update'
    });
  }
}

export const notificationService = new NotificationService();
