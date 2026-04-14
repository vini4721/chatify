import { createWelcomeEmailTemplate } from './templates.js';
import { getResendClient, hasResendConfig } from '../lib/resend.js';

export async function sendWelcomeEmail({ email, name, clientURL }) {
  if (!hasResendConfig()) {
    return { skipped: true, reason: 'Resend config missing' };
  }

  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Welcome to Chatify',
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    throw new Error('Failed to send welcome email');
  }

  return { skipped: false };
}
