/**
 * Email Service
 * Handles sending emails via SMTP using nodemailer
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if SMTP is configured
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn('SMTP not configured. Email functionality will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ? parseInt(env.SMTP_PORT) : 465,
        secure: env.SMTP_SECURE ?? true, // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      this.isConfigured = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter || !this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP verification failed:', error);
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter || !this.isConfigured) {
      logger.warn('Email service not configured. Email not sent:', options.to);
      return false;
    }

    try {
      const fromAddress = env.FROM_ADDRESS || env.SMTP_USER || 'noreply@mondayclone.com';
      
      await this.transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      });

      logger.info(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Load email template
   */
  private loadTemplate(templateName: string, variables: Record<string, any>): string {
    try {
      // Try multiple possible paths for templates
      const possiblePaths = [
        // Development: from src directory
        path.resolve(process.cwd(), 'src', 'templates', 'emails', `${templateName}.html`),
        // Production: from dist directory (if templates are copied)
        path.resolve(__dirname, '..', 'templates', 'emails', `${templateName}.html`),
        // Fallback: from project root
        path.resolve(process.cwd(), 'backend', 'src', 'templates', 'emails', `${templateName}.html`),
      ];
      
      let templatePath: string | null = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          templatePath = possiblePath;
          break;
        }
      }
      
      if (!templatePath) {
        logger.warn(`Email template not found: ${templateName}. Tried paths: ${possiblePaths.join(', ')}`);
        return this.generateBasicTemplate(templateName, variables);
      }

      let template = fs.readFileSync(templatePath, 'utf-8');
      
      // Simple variable replacement ({{variableName}})
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const value = variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
        template = template.replace(regex, value);
      });

      // Handle conditional blocks ({{#if variableName}}...{{/if}})
      const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
      template = template.replace(ifRegex, (match, varName, content) => {
        return variables[varName] ? content : '';
      });

      return template;
    } catch (error) {
      logger.error(`Error loading email template ${templateName}:`, error);
      return this.generateBasicTemplate(templateName, variables);
    }
  }

  /**
   * Generate basic HTML template if template file doesn't exist
   */
  private generateBasicTemplate(templateName: string, variables: Record<string, any>): string {
    const title = variables.title || 'Email from Monday Clone';
    const content = variables.content || variables.message || '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #0073ea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Monday Clone</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
            ${content}
          </div>
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated email from Monday Clone. Please do not reply.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, name: string, tempPassword?: string): Promise<boolean> {
    const variables = {
      name,
      tempPassword: tempPassword || '',
      hasTempPassword: !!tempPassword,
      loginUrl: `${env.FRONTEND_URL}/login`,
    };

    const html = this.loadTemplate('welcome', variables);
    
    return this.sendEmail({
      to,
      subject: 'Welcome to Monday Clone!',
      html,
    });
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(
    to: string,
    inviterName: string,
    organizationName: string,
    tempPassword: string,
    role?: string
  ): Promise<boolean> {
    const variables = {
      name: to.split('@')[0], // Use email prefix as name if not provided
      inviterName,
      organizationName,
      tempPassword,
      role: role || 'Member',
      loginUrl: `${env.FRONTEND_URL}/login`,
    };

    const html = this.loadTemplate('invite', variables);
    
    return this.sendEmail({
      to,
      subject: `You've been invited to join ${organizationName} on Monday Clone`,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const variables = {
      name,
      resetUrl,
      resetToken, // In case URL doesn't work
    };

    const html = this.loadTemplate('password-reset', variables);
    
    return this.sendEmail({
      to,
      subject: 'Reset Your Password - Monday Clone',
      html,
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(to: string, name: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const variables = {
      name,
      verificationUrl,
      verificationToken, // In case URL doesn't work
    };

    const html = this.loadTemplate('email-verification', variables);
    
    return this.sendEmail({
      to,
      subject: 'Verify Your Email - Monday Clone',
      html,
    });
  }
}

export const emailService = new EmailService();

