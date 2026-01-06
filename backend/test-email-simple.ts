/**
 * Simple Email Test Script (SMTP only)
 * Tests email service without requiring all environment variables
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config({ path: '.env' });

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_ADDRESS = process.env.FROM_ADDRESS || SMTP_USER;

async function testEmail(email: string) {
  console.log('\n🧪 Testing Email Service...\n');
  console.log('SMTP Configuration:');
  console.log(`  Host: ${SMTP_HOST || 'Not configured'}`);
  console.log(`  Port: ${SMTP_PORT || 'Not configured'}`);
  console.log(`  Secure: ${SMTP_SECURE}`);
  console.log(`  User: ${SMTP_USER || 'Not configured'}`);
  console.log(`  From: ${FROM_ADDRESS || 'Not configured'}`);
  console.log('');

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('❌ SMTP not configured!');
    console.error('   Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env file.');
    process.exit(1);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  // Test connection
  console.log('1. Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (error: any) {
    console.error('❌ SMTP connection failed!');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }

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
            <li>SMTP Host: ${SMTP_HOST}</li>
            <li>SMTP Port: ${SMTP_PORT}</li>
            <li>From Address: ${FROM_ADDRESS}</li>
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

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Test Email - Monday Clone Email Service',
      html: testHtml,
      text: 'This is a test email from Monday Clone. Your SMTP configuration is working correctly!',
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`\n📧 Check your inbox at: ${email}`);
    console.log('\n✨ Email service is working correctly!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Failed to send test email.');
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address is required');
  console.log('\nUsage:');
  console.log('  npx tsx test-email-simple.ts <email-address>');
  console.log('\nExample:');
  console.log('  npx tsx test-email-simple.ts test@10minutemail.com');
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

