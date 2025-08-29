/**
 * Nodemailer wrapper for sending invite emails.
 * Reads SMTP configuration from env and exposes sendInviteEmail(email, link).
 * In dev you can use Ethereal or Mailtrap to inspect messages.
 */
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendInviteEmail(toEmail, inviteLink) {
  const from = process.env.FROM_EMAIL || 'no-reply@example.com';
  const html = `<p>You have been invited to register. Click the link below to complete your signup:</p>
    <p><a href="${inviteLink}">${inviteLink}</a></p>
    <p>If you didn't expect this, ignore this message.</p>`;
  const info = await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'Invitation to join Leave Management',
    html
  });
  return info;
}
