import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

let resendClient: Resend | null = null;
let transporter: Transporter | null = null;
let lastPasswordResetLink: string | null = null;

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(env.RESEND_API_KEY);
  return resendClient;
}

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

function buildPasswordResetContent(resetUrl: string): { subject: string; text: string; html: string } {
  const subject = 'Reset hasła — szybkiewystawianie.pl';
  const text = [
    'Otrzymaliśmy prośbę o reset hasła do konta szybkiewystawianie.pl.',
    '',
    `Ustaw nowe hasło: ${resetUrl}`,
    '',
    'Link jest ważny przez 1 godzinę. Jeśli to nie Ty — zignoruj tę wiadomość.',
  ].join('\n');
  const html = `
    <p>Otrzymaliśmy prośbę o reset hasła do konta <strong>szybkiewystawianie.pl</strong>.</p>
    <p><a href="${resetUrl}">Ustaw nowe hasło</a></p>
    <p>Link jest ważny przez 1 godzinę. Jeśli to nie Ty — zignoruj tę wiadomość.</p>
  `.trim();
  return { subject, text, html };
}

async function sendViaResend(to: string, subject: string, text: string, html: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  if (error) throw new Error(error.message);
}

async function sendViaSmtp(to: string, subject: string, text: string): Promise<void> {
  const transport = getTransporter();
  if (!transport) return;

  await transport.sendMail({ from: env.EMAIL_FROM, to, subject, text });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const { subject, text, html } = buildPasswordResetContent(resetUrl);

  if (env.EMAIL_MOCK) {
    lastPasswordResetLink = resetUrl;
    logger.info('password_reset_email_mock', { to, resetUrl });
    return;
  }

  if (env.RESEND_API_KEY) {
    await sendViaResend(to, subject, text, html);
    return;
  }

  const transport = getTransporter();
  if (transport) {
    await sendViaSmtp(to, subject, text);
    return;
  }

  lastPasswordResetLink = resetUrl;
  logger.warn('password_reset_email_no_provider', { to, resetUrl });
}

export function getLastPasswordResetLinkForTests(): string | null {
  return lastPasswordResetLink;
}

export function clearLastPasswordResetLinkForTests(): void {
  lastPasswordResetLink = null;
}
