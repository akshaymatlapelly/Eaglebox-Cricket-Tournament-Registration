// REFERENCE BACKEND EMAIL SERVICE (Resend Integration mockup)

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

// In-memory log of sent emails (useful for dashboard display/notifications logs)
export const emailLog: (EmailPayload & { sentAt: Date })[] = [];

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<{ success: boolean; id?: string }> {
  console.log(`[Resend Email Sent]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content Preview: ${html.substring(0, 150)}...`);
  
  const payload = { to, subject, html, sentAt: new Date() };
  emailLog.push(payload);
  
  // Return simulated Resend response
  return {
    success: true,
    id: `res_msg_${Math.random().toString(36).substring(2, 11)}`
  };
}

export async function sendRegistrationEmail(to: string, teamName: string, tournamentName: string, qrCodeData: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #0d0f12; color: #fff;">
      <h1 style="color: #10b981; text-align: center;">CricketHub Pro</h1>
      <h2 style="text-align: center;">Registration Confirmed!</h2>
      <p>Hello Captain,</p>
      <p>Your team <strong>${teamName}</strong> is successfully registered for <strong>${tournamentName}</strong>!</p>
      <div style="background-color: #161b22; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #8b949e;">Your Check-in QR Token:</p>
        <code style="font-size: 18px; color: #10b981; font-weight: bold; letter-spacing: 1px;">${qrCodeData}</code>
      </div>
      <p>Use this QR Code at the venue for swift scan-in by the organizers.</p>
      <p>Good luck!</p>
      <hr style="border-color: #21262d;" />
      <p style="font-size: 12px; color: #8b949e; text-align: center;">&copy; 2026 CricketHub Pro. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to, subject: `Registration Confirmed: ${teamName} at ${tournamentName}`, html });
}

export async function sendReminderEmail(to: string, teamName: string, tournamentName: string, date: string, venue: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #0d0f12; color: #fff;">
      <h1 style="color: #10b981; text-align: center;">Match Reminder!</h1>
      <p>Get ready! <strong>${teamName}</strong>, you have an upcoming match in <strong>${tournamentName}</strong>.</p>
      <div style="background-color: #161b22; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date/Time:</strong> ${date}</p>
        <p><strong>Venue:</strong> ${venue}</p>
      </div>
      <p>Organize your players, double-check your gear, and ensure you arrive 30 minutes before time for QR verification.</p>
      <hr style="border-color: #21262d;" />
      <p style="font-size: 12px; color: #8b949e; text-align: center;">&copy; 2026 CricketHub Pro. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to, subject: `Upcoming Match Reminder: ${tournamentName}`, html });
}

export async function sendMembershipEmail(to: string, userName: string, membershipTier: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #0d0f12; color: #fff;">
      <h1 style="color: #eab308; text-align: center;">Welcome to the Elite Club!</h1>
      <p>Hello ${userName},</p>
      <p>Congratulations! Your membership has been upgraded to the <strong>${membershipTier.toUpperCase()}</strong> tier.</p>
      <p>You can now enjoy advanced registration priorities, exclusive member pricing discounts, and custom career certificates.</p>
      <hr style="border-color: #21262d;" />
      <p style="font-size: 12px; color: #8b949e; text-align: center;">&copy; 2026 CricketHub Pro. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to, subject: `Membership Activated: Welcome to ${membershipTier.toUpperCase()}`, html });
}

export async function sendCertificateEmail(to: string, userName: string, tournamentName: string, type: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #0d0f12; color: #fff;">
      <h1 style="color: #10b981; text-align: center;">Certificate Awarded!</h1>
      <p>Hello ${userName},</p>
      <p>A new <strong>${type.toUpperCase()} Certificate</strong> has been generated for your performance in <strong>${tournamentName}</strong>.</p>
      <p>You can view, verify, and download your high-resolution LinkedIn-style certificate from your CricketHub Pro career profile dashboard.</p>
      <hr style="border-color: #21262d;" />
      <p style="font-size: 12px; color: #8b949e; text-align: center;">&copy; 2026 CricketHub Pro. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to, subject: `CricketHub Pro Achievement: Certificate Awarded`, html });
}

export async function sendWinnerEmail(to: string, teamName: string, tournamentName: string, prizePool: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #0d0f12; color: #fff;">
      <h1 style="color: #eab308; text-align: center;">🎉 Champions! 🎉</h1>
      <p>Hello Captain,</p>
      <p>Hearty congratulations to <strong>${teamName}</strong> on winning <strong>${tournamentName}</strong>!</p>
      <p>Your team has outperformed everyone to claim the crown and secure a portion of the ₹${prizePool} prize pool!</p>
      <p>Our organizers will reach out soon to coordinate the payment transfers.</p>
      <hr style="border-color: #21262d;" />
      <p style="font-size: 12px; color: #8b949e; text-align: center;">&copy; 2026 CricketHub Pro. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to, subject: `Tournament Champions: ${teamName} wins ${tournamentName}!`, html });
}
