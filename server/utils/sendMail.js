import nodemailer from 'nodemailer';

/**
 * Send an email via Gmail SMTP with optional PDF attachment
 * 
 * @param {string} fromMail - Sender email (e.g., 'SMART LMS <your@gmail.com>')
 * @param {string} toMail - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email body in HTML format
 * @param {Buffer|null} pdfAttachmentBuffer - Optional PDF buffer (for receipt or invoice)
 */
const sendMail = async (fromMail, toMail, subject, message, pdfAttachmentBuffer = null) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.APP_PASSWORD, // App password from Google
      },
    });

    const mailOptions = {
      from: fromMail,
      to: toMail,
      subject,
      html: message,
      attachments: [],
    };

    if (pdfAttachmentBuffer) {
      mailOptions.attachments.push({
        filename: 'SmartLMS_Receipt.pdf',
        content: pdfAttachmentBuffer,
        contentType: 'application/pdf',
      });
    }

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${toMail}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw new Error('Email sending failed');
  }
};

export default sendMail;
