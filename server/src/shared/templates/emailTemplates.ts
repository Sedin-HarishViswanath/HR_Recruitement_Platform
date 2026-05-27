const baseTemplate = (content: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #2563eb; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">HR Recruitment Platform</h1>
    </div>
    <div style="padding: 30px; line-height: 1.6; color: #1e293b;">
      ${content}
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
      © ${new Date().getFullYear()} HR Recruitment Platform. All rights reserved.
    </div>
  </div>
`;

export const welcomeEmail = (name: string) => baseTemplate(`
  <h2>Welcome, ${name}!</h2>
  <p>Thank you for joining our platform. We're excited to help you find your next great opportunity.</p>
  <p>You can now log in and complete your profile to start applying for jobs.</p>
  <div style="margin-top: 30px;">
    <a href="http://localhost:5173/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Get Started</a>
  </div>
`);

export const applicationConfirmation = (candidateName: string, jobTitle: string, companyName: string) => baseTemplate(`
  <h2>Application Received</h2>
  <p>Hi ${candidateName},</p>
  <p>This is to confirm that we have received your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
  <p>The recruitment team will review your profile and get back to you if your qualifications match our requirements.</p>
`);

export const interviewScheduled = (candidateName: string, jobTitle: string, roundType: string, date: string, meetingLink: string) => baseTemplate(`
  <h2>Interview Scheduled</h2>
  <p>Hi ${candidateName},</p>
  <p>We are pleased to invite you for an interview for the <strong>${jobTitle}</strong> position.</p>
  <p><strong>Round:</strong> ${roundType}</p>
  <p><strong>Time:</strong> ${date}</p>
  <div style="margin-top: 30px;">
    <a href="${meetingLink || 'http://localhost:5173/candidate/interviews'}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Interview</a>
  </div>
`);

export const statusUpdate = (candidateName: string, jobTitle: string, newStage: string) => baseTemplate(`
  <h2>Application Update</h2>
  <p>Hi ${candidateName},</p>
  <p>Your application for <strong>${jobTitle}</strong> has been moved to the <strong>${newStage}</strong> stage.</p>
  <p>You can track your application status anytime on your dashboard.</p>
`);

export const userInviteEmail = (name: string, role: string, companyName: string, inviteLink: string) => baseTemplate(`
  <h2>You have been invited!</h2>
  <p>Hi ${name},</p>
  <p>You have been invited to join <strong>${companyName}</strong> as a <strong>${role}</strong> on Recruiting AI.</p>
  <p>To sign in to your account, click the button below:</p>
  <div style="margin-top: 30px; margin-bottom: 30px;">
    <a href="${inviteLink}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation & Sign In</a>
  </div>
  <p>Or copy and paste this link in your browser:</p>
  <p style="word-break: break-all; color: #2563eb;">${inviteLink}</p>
`);
