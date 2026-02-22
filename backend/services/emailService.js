import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        // Create transporter
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    /**
     * Send exam credentials to candidate
     */
    async sendExamCredentials(candidateEmail, candidateName, password, examDetails) {
        const mailOptions = {
            from: `"AI Interviewer Platform" <${process.env.EMAIL_USER}>`,
            to: candidateEmail,
            subject: 'Your AI Interviewer Exam Credentials',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .credentials-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #6366f1;
            }
            .credential-item {
              margin: 10px 0;
              padding: 10px;
              background: #f1f5f9;
              border-radius: 5px;
            }
            .credential-label {
              font-weight: bold;
              color: #6366f1;
              display: block;
              margin-bottom: 5px;
            }
            .credential-value {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              color: #1e293b;
            }
            .exam-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #64748b;
              font-size: 14px;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🤖 AI Interviewer Platform</h1>
            <p>Your Exam Credentials</p>
          </div>
          
          <div class="content">
            <h2>Hello ${candidateName},</h2>
            <p>You have been invited to take a coding exam on the AI Interviewer Platform. Below are your login credentials:</p>
            
            <div class="credentials-box">
              <h3>Login Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Username (Email):</span>
                <span class="credential-value">${candidateEmail}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${password}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Login URL:</span>
                <span class="credential-value">${process.env.FRONTEND_URL || 'http://localhost:5173'}/login</span>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> Please keep these credentials secure. You can change your password after logging in.
            </div>

            <div class="exam-details">
              <h3>Exam Details</h3>
              <p><strong>Number of Questions:</strong> ${examDetails.questionCount}</p>
              <p><strong>Time Limit:</strong> ${examDetails.timeLimit} minutes</p>
              <p><strong>Session ID:</strong> ${examDetails.sessionId}</p>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">
                Login to Start Exam
              </a>
            </div>

            <div class="footer">
              <p>This is an automated email from AI Interviewer Platform.</p>
              <p>If you did not expect this email, please contact the administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            // Don't throw error - just log it so exam creation doesn't fail
            return { success: false, error: error.message };
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(email, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"AI Interviewer Platform" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new EmailService();
