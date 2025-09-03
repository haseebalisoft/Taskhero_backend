import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

export const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };

  try {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendVerificationEmail = async (email, code) => {
  const subject = 'Your Verification Code';
  const text = `Your verification code is: ${code}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Email Verification</h2>
      <p>Your verification code is:</p>
      <div style="background: #f3f4f6; padding: 10px; display: inline-block; 
                  font-size: 24px; font-weight: bold; letter-spacing: 2px;">
        ${code}
      </div>
      <p>This code will expire in 10 minutes.</p>
    </div>
  `;

  return sendEmail(email, subject, text, html);
};