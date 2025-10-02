import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // For Phase 1, we'll use a simple configuration
    // In production, you'd want to use a proper email service like SendGrid, Mailgun, etc.
    
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      console.log('📧 Email service not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables to enable email notifications.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.log('📧 Email service not configured, skipping email to:', options.to);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });

      console.log('📧 Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('📧 Failed to send email:', error);
      return false;
    }
  }

  async sendGiftReminder(
    to: string, 
    friendName: string, 
    occasionType: string, 
    occasionDate: string, 
    customMessage?: string
  ): Promise<boolean> {
    const subject = `🎁 Gift Reminder: ${occasionType.replace('_', ' ')} for ${friendName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎁 Gift Reminder</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Don't forget about ${friendName}!</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #666;"><strong>Friend:</strong> ${friendName}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Occasion:</strong> ${occasionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(occasionDate).toLocaleDateString()}</p>
          </div>
          
          ${customMessage ? `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <p style="margin: 0; color: #1976d2; font-style: italic;">"${customMessage}"</p>
            </div>
          ` : ''}
          
          <p style="color: #666; line-height: 1.6;">
            This is a friendly reminder that ${friendName}'s ${occasionType.replace('_', ' ')} is coming up. 
            It's time to start thinking about the perfect gift!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.WEBAPP_URL || 'http://localhost:3000'}" 
               style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Find Gift Ideas 🎁
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This reminder was sent by GiftGenie. To manage your reminders, visit your dashboard.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  // Test email functionality
  async testEmail(to: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: '🎁 GiftGenie Email Test',
      html: `
        <h2>Email service is working!</h2>
        <p>If you received this email, your GiftGenie email configuration is working correctly.</p>
        <p>You can now receive gift reminders via email.</p>
      `,
    });
  }
}

export const emailService = new EmailService();