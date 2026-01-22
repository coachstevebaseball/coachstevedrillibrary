import { Resend } from "resend";
import { ENV } from "./_core/env";

const resend = new Resend(ENV.resendApiKey);

export interface DrillAssignmentEmailData {
  athleteEmail: string;
  athleteName: string;
  drillName: string;
  drillDifficulty: string;
  drillDuration: string;
  coachNotes?: string;
  coachName?: string;
  portalUrl: string;
}

export async function sendDrillAssignmentEmail(data: DrillAssignmentEmailData): Promise<{ success: boolean; error?: string }> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] Resend API key not configured, skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const emailHtml = generateDrillAssignmentEmailHtml(data);

    const result = await resend.emails.send({
      from: "Coach Steve's Mobile Coach <onboarding@resend.dev>",
      to: data.athleteEmail,
      subject: `New Drill Assignment: ${data.drillName}`,
      html: emailHtml,
    });

    if (result.error) {
      console.error("[Email] Failed to send drill assignment email:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[Email] Drill assignment email sent successfully to", data.athleteEmail);
    return { success: true };
  } catch (error) {
    console.error("[Email] Error sending drill assignment email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function generateDrillAssignmentEmailHtml(data: DrillAssignmentEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .drill-card { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .drill-name { font-size: 20px; font-weight: bold; color: #1e3a8a; margin: 0 0 10px 0; }
          .drill-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
          .detail-item { font-size: 14px; }
          .detail-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .detail-value { color: #333; margin-top: 4px; }
          .notes-section { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
          .notes-label { font-weight: bold; color: #92400e; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
          .notes-text { color: #78350f; }
          .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
          .coach-name { color: #666; font-size: 14px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Drill Assignment</h1>
            <p>Hi ${data.athleteName}!</p>
          </div>
          
          <div class="content">
            <p>Your coach has assigned you a new drill. Check out the details below and log in to the athlete portal to get started!</p>
            
            <div class="drill-card">
              <div class="drill-name">${data.drillName}</div>
              
              <div class="drill-details">
                <div class="detail-item">
                  <div class="detail-label">Difficulty</div>
                  <div class="detail-value">${data.drillDifficulty}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Duration</div>
                  <div class="detail-value">${data.drillDuration}</div>
                </div>
              </div>
              
              ${data.coachNotes ? `
                <div class="notes-section">
                  <div class="notes-label">Coach Notes</div>
                  <div class="notes-text">${data.coachNotes}</div>
                </div>
              ` : ''}
            </div>
            
            <div style="text-align: center;">
              <a href="${data.portalUrl}" class="cta-button">View in Athlete Portal</a>
            </div>
            
            ${data.coachName ? `
              <div class="coach-name">
                <strong>Coach:</strong> ${data.coachName}
              </div>
            ` : ''}
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Log in to your athlete portal to track your progress and update the status of your drills. Good luck! 💪
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated email from Coach Steve's Mobile Coach. Please don't reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}


export interface SubmissionNotificationData {
  coachEmail: string;
  coachName: string;
  athleteName: string;
  drillName: string;
  submissionNotes?: string;
  submissionUrl: string;
}

export interface FeedbackNotificationData {
  athleteEmail: string;
  athleteName: string;
  coachName: string;
  drillName: string;
  feedback: string;
  feedbackUrl: string;
}

/**
 * Send email notification to coach when athlete submits drill work
 */
export async function sendSubmissionNotificationToCoach(data: SubmissionNotificationData): Promise<{ success: boolean; error?: string }> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] Resend API key not configured, skipping submission notification");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
      .submission-card { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626; }
      .athlete-name { font-size: 18px; font-weight: bold; color: #1e3a8a; }
      .drill-name { color: #666; font-size: 14px; margin-top: 5px; }
      .notes-section { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
      .notes-label { font-weight: bold; color: #92400e; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
      .notes-text { color: #78350f; }
      .cta-button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎯 New Drill Submission</h1>
      </div>
      <div class="content">
        <p>Hi ${data.coachName},</p>
        
        <p><strong>${data.athleteName}</strong> just submitted their work for the <strong>${data.drillName}</strong> drill!</p>
        
        <div class="submission-card">
          <div class="athlete-name">${data.athleteName}</div>
          <div class="drill-name">Drill: ${data.drillName}</div>
          ${data.submissionNotes ? `
          <div class="notes-section">
            <div class="notes-label">Athlete's Notes:</div>
            <div class="notes-text">${data.submissionNotes}</div>
          </div>
          ` : ''}
        </div>
        
        <p>Review the submission and provide feedback to keep your athlete engaged and motivated.</p>
        
        <div style="text-align: center;">
          <a href="${data.submissionUrl}" class="cta-button">View Submission</a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from Coach Steve's Mobile Coach.</p>
        </div>
      </div>
    </div>
  </body>
</html>
    `;

    const result = await resend.emails.send({
      from: "Coach Steve's Mobile Coach <onboarding@resend.dev>",
      to: data.coachEmail,
      subject: `New Submission: ${data.athleteName} - ${data.drillName}`,
      html: emailHtml,
    });

    if (result.error) {
      console.error("[Email] Failed to send submission notification:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[Email] Submission notification sent to", data.coachEmail);
    return { success: true };
  } catch (error) {
    console.error("[Email] Error sending submission notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send email notification to athlete when coach provides feedback
 */
export async function sendFeedbackNotificationToAthlete(data: FeedbackNotificationData): Promise<{ success: boolean; error?: string }> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] Resend API key not configured, skipping feedback notification");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
      .feedback-card { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
      .coach-name { font-size: 16px; font-weight: bold; color: #1e3a8a; }
      .drill-name { color: #666; font-size: 14px; margin-top: 5px; }
      .feedback-section { background: #ecfdf5; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981; }
      .feedback-label { font-weight: bold; color: #065f46; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
      .feedback-text { color: #047857; }
      .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>💬 Coach Feedback Received</h1>
      </div>
      <div class="content">
        <p>Hi ${data.athleteName},</p>
        
        <p><strong>${data.coachName}</strong> provided feedback on your <strong>${data.drillName}</strong> submission!</p>
        
        <div class="feedback-card">
          <div class="coach-name">${data.coachName}</div>
          <div class="drill-name">Drill: ${data.drillName}</div>
          <div class="feedback-section">
            <div class="feedback-label">Feedback:</div>
            <div class="feedback-text">${data.feedback}</div>
          </div>
        </div>
        
        <p>Keep up the great work! Review the feedback and continue improving your performance.</p>
        
        <div style="text-align: center;">
          <a href="${data.feedbackUrl}" class="cta-button">View Feedback</a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from Coach Steve's Mobile Coach.</p>
        </div>
      </div>
    </div>
  </body>
</html>
    `;

    const result = await resend.emails.send({
      from: "Coach Steve's Mobile Coach <onboarding@resend.dev>",
      to: data.athleteEmail,
      subject: `Feedback from ${data.coachName}: ${data.drillName}`,
      html: emailHtml,
    });

    if (result.error) {
      console.error("[Email] Failed to send feedback notification:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[Email] Feedback notification sent to", data.athleteEmail);
    return { success: true };
  } catch (error) {
    console.error("[Email] Error sending feedback notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export interface InviteEmailData {
  toEmail: string;
  inviteLink: string;
  inviteType: "coach" | "athlete";
  expiresAt: Date;
}

export async function sendInviteEmail(data: InviteEmailData): Promise<{ success: boolean; error?: string }> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] Resend API key not configured, skipping invite email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const emailHtml = generateInviteEmailHtml(data);
    const subject = data.inviteType === "coach" 
      ? "You're Invited to USA Baseball Drills Directory"
      : "Join Your Team on USA Baseball Drills Directory";

    const result = await resend.emails.send({
      from: "USA Baseball Drills Directory <onboarding@resend.dev>",
      to: data.toEmail,
      subject: subject,
      html: emailHtml,
    });

    if (result.error) {
      console.error("[Email] Failed to send invite email:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[Email] Invite email sent successfully to", data.toEmail);
    return { success: true };
  } catch (error) {
    console.error("[Email] Error sending invite email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function generateInviteEmailHtml(data: InviteEmailData): string {
  const roleText = data.inviteType === "coach" ? "Coach" : "Athlete";
  const expiresDate = new Date(data.expiresAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .cta-button { display: inline-block; background: #dc2626; color: white; padding: 14px 35px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 25px 0; font-size: 16px; }
          .features-list { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1e3a8a; }
          .features-list ul { margin: 10px 0; padding-left: 20px; }
          .features-list li { margin: 8px 0; }
          .expires-box { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .expires-label { font-weight: bold; color: #92400e; font-size: 12px; text-transform: uppercase; }
          .expires-date { color: #78350f; font-size: 14px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚾ Coach Steve Baseball — Player Drill Library</h1>
            <p>You're Invited!</p>
          </div>
          
          <div class="content">
            <p>Hi there!</p>
            <p>You've been invited to join Coach Steve's Baseball — Player Drill Library as an <strong>${roleText}</strong>.</p>
            
            <div class="features-list">
              <strong>What you'll get access to:</strong>
              <ul>
                ${data.inviteType === "coach" ? `
                  <li>200+ professional baseball drills</li>
                  <li>Assign drills to your athletes</li>
                  <li>Track athlete progress and completion</li>
                  <li>Provide feedback and notes</li>
                  <li>Customize drill content</li>
                ` : `
                  <li>View drills assigned by your coach</li>
                  <li>Track your progress</li>
                  <li>Add personal notes</li>
                  <li>Earn achievement badges</li>
                  <li>Receive coach feedback</li>
                `}
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.inviteLink}" class="cta-button">Accept Invitation</a>
            </div>
            
            <div class="expires-box">
              <div class="expires-label">⏰ Invitation Expires</div>
              <div class="expires-date">${expiresDate}</div>
            </div>
            
            <p>If you have any questions or didn't expect this invitation, please contact your coach or team administrator.</p>
            
            <p>Best regards,<br><strong>Coach Steve</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2026 Coach Steve Baseball — Player Drill Library. All rights reserved.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
