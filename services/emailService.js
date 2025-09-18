import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

async function sendVerificationEmail(to, token) {
    const verificationLink = `http://localhost:3000/api/verify?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Verify your Account - JWT Auth',
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Almost there, ${to}!</h2>
    <p>Thanks for signing up! Please confirm your email address to activate your account and get started.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${verificationLink}" 
         style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify My Email Address
      </a>
    </div>
    <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #555;">${verificationLink}</p>
    <hr style="border: none; border-top: 1px solid #eee;">
    <p style="color: #999; font-size: 0.9em;">If you didn't create an account with us, please ignore this email.</p>
  </div>`,
    };
    try {
        await transporter.sendMail(mailOptions)
        console.log('Verification email sent to', to, 'with token:', token);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }

}

export default sendVerificationEmail;