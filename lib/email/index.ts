export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@kigasuru.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'Kigasuru';

  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject: subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid API error:', errorText);
      throw new Error(`Failed to send email: ${response.status} ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}
