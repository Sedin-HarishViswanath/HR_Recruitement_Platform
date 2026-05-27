import { sendEmail } from '../../shared/utils/email';
import * as templates from '../../shared/templates/emailTemplates';
import { inAppNotificationService } from './inapp-notification.service';

export class NotificationService {
  async notifyWelcome(userId: string, name: string, email: string) {
    // Persistent In-App Notification
    await inAppNotificationService.create({
      userId,
      title: 'Welcome!',
      body: `Hi ${name}, welcome to RecruitAI!`,
      type: 'info'
    }).catch(err => console.error('Failed to save welcome notification:', err));

    return sendEmail({
      to: email,
      subject: 'Welcome to RecruitAI',
      html: templates.welcomeEmail(name),
      eventType: 'welcome'
    });
  }

  async notifyApplicationSubmitted(candidate: any, job: any, company: any) {
    // Persistent In-App Notification for candidate
    await inAppNotificationService.create({
      candidateId: candidate.id,
      title: 'Application Received',
      body: `Your application for ${job.title} at ${company.name} was received.`,
      type: 'success',
      link: '/candidate/applications'
    }).catch(err => console.error('Failed to save application submission notification:', err));

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
    
    // Persistent In-App Notification for candidate
    await inAppNotificationService.create({
      candidateId: candidate.id,
      title: 'Interview Scheduled',
      body: `Your interview for ${job.title} is scheduled for ${dateStr}.`,
      type: 'info',
      link: '/candidate/interviews'
    }).catch(err => console.error('Failed to save candidate interview notification:', err));

    // Persistent In-App Notification for interviewer if different from user
    if (interview.interviewer_id) {
      await inAppNotificationService.create({
        userId: interview.interviewer_id,
        title: 'New Interview Assigned',
        body: `You have been assigned an interview for ${job.title} with ${candidate.name}.`,
        type: 'info',
        link: '/company/interviews'
      }).catch(err => console.error('Failed to save interviewer interview notification:', err));
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
    // Persistent In-App Notification
    await inAppNotificationService.create({
      candidateId: candidate.id,
      title: 'Application Update',
      body: `Your application for ${job.title} has been moved to: ${newStage}.`,
      type: 'info',
      link: '/candidate/applications'
    }).catch(err => console.error('Failed to save status update notification:', err));

    return sendEmail({
      to: candidate.email,
      subject: `Application Update: ${job.title}`,
      html: templates.statusUpdate(candidate.name, job.title, newStage),
      eventType: 'status_update'
    });
  }
}

export const notificationService = new NotificationService();
