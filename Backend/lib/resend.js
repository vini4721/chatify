import { Resend } from 'resend';

export function hasResendConfig() {
  return Boolean(
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.EMAIL_FROM_NAME
  );
}

export function getResendClient() {
  if (!hasResendConfig()) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}
