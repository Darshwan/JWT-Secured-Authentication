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
    const verificationLink = `http://localhost:3000/api/auth/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Verify your Account - JWT Auth',
        html: `<h2>Welcome!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}" style="padding: 10px; background-color: blue; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <br>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationLink}</p>`,
    };
    try {
        await transporter.sendMail(mailOptions)
        console.log('Verification email sent to', to);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
    
}

export default sendVerificationEmail;