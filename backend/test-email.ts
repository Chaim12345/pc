/**
 * Email Service Test Script
 * 
 * This script tests the email service by sending a test email to a temporary email address.
 * 
 * Usage:
 *   npx tsx test-email.ts <email-address>
 * 
 * Example:
 *   npx tsx test-email.ts test@10minutemail.com
 */

import dotenv from 'dotenv';
import { emailService } from './src/services/emailService';
import { env } from './src/config/env';

dotenv.config();

async function testEmail(email: string) {
  console.log('\n🧪 Testing Email Service...\n');
  console.log('SMTP Configuration:');
  console.log(`  Host: ${env.SMTP_HOST || 'Not configured'}`);
  console.log(`  Port: ${env.SMTP_PORT || 'Not configured'}`);
  console.log(`  Secure: ${env.SMTP_SECURE ?? 'Not configured'}`);
  console.log(`  User: ${env.SMTP_USER || 'Not configured'}`);
  console.log(`  From: ${env.FROM_ADDRESS || env.SMTP_USER || 'Not configured'}`);
  console.log('');

  // Test connection
  console.log('1. Testing SMTP connection...');
  const connectionOk = await emailService.verifyConnection();
  
  if (!connectionOk) {
    console.error('❌ SMTP connection failed!');
    console.error('   Please check your SMTP configuration in .env file.');
    process.exit(1);
  }
  
  console.log('✅ SMTP connection successful!\n');

  // Send test email
  console.log(`2. Sending test email to ${email}...`);
  
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0073ea; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .success { color: #28a745; font-weight: bold; font-size: 18px; }
        .info { background-color: #fff; padding: 15px; border-left: 4px solid #0073ea; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">Monday Clone</h1>
      </div>
      <div class="content">
        <h2>Email Service Test</h2>
        <p class="success">✅ Success!</p>
        <p>This is a test email from your Monday Clone application.</p>
        <p>If you received this email, your SMTP configuration is working correctly!</p>
        
        <div class="info">
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>SMTP Host: ${env.SMTP_HOST || 'Not configured'}</li>
            <li>SMTP Port: ${env.SMTP_PORT || 'Not configured'}</li>
            <li>From Address: ${env.FROM_ADDRESS || env.SMTP_USER || 'Not configured'}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This email was sent to verify that your email service is configured correctly.
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated test email from Monday Clone.</p>
      </div>
    </body>
    </html>
  `;

  const sent = await emailService.sendEmail({
    to: email,
    subject: 'Test Email - Monday Clone Email Service',
    html: testHtml,
  });

  if (sent) {
    console.log('✅ Test email sent successfully!');
    console.log(`\n📧 Check your inbox at: ${email}`);
    console.log('\n✨ Email service is working correctly!\n');
    process.exit(0);
  } else {
    console.error('❌ Failed to send test email.');
    console.error('   Check server logs for details.');
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address is required');
  console.log('\nUsage:');
  console.log('  npx tsx test-email.ts <email-address>');
  console.log('\nExample:');
  console.log('  npx tsx test-email.ts test@10minutemail.com');
  console.log('  npx tsx test-email.ts your-email@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: Invalid email format');
  process.exit(1);
}

testEmail(email).catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
