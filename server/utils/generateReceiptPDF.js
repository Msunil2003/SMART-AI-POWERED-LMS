import PDFDocument from 'pdfkit';
import { buffer } from 'stream/consumers';
import fs from 'fs';
import path from 'path';

export const generateReceiptPDF = async ({ user, payment }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // ✅ 1. Add Watermark
  const watermarkText = 'SMART AI POWERED LMS';
  doc.opacity(0.05)
    .fontSize(60)
    .fillColor('gray')
    .rotate(45, { origin: [300, 350] })
    .text(watermarkText, 100, 200, {
      align: 'center',
      width: 500,
    });
  doc.rotate(-45, { origin: [300, 350] }); // Reset rotation
  doc.opacity(1); // Reset opacity

  // ✅ 2. Header with Logo
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 50 });
  }

  doc
    .fontSize(26)
    .fillColor('#1A73E8')
    .text('SMART LMS', 110, 57)
    .fontSize(14)
    .fillColor('#555')
    .text('Official Payment Receipt', 110, 80);
  doc.moveDown(2);

  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(1.5);

  doc
    .fontSize(13)
    .fillColor('#000')
    .text(`Dear ${user.name},`)
    .moveDown(0.5)
    .text('Thank you for your payment. Below is your receipt.')
    .moveDown(1);

  // ✅ 3. User Info Table
  doc.fontSize(15).fillColor('#1A73E8').text(' User Information', { underline: true }).moveDown(0.5);
  drawTable(doc, [
    ['Name', user.name],
    ['Email', user.email],
    ['Subscription Status', user.status],
  ]);
  doc.moveDown(1.5);

  // ✅ 4. Payment Info Table
  doc.fontSize(15).fillColor('#1A73E8').text(' Payment Information', { underline: true }).moveDown(0.5);
  drawTable(doc, [
    ['Payment ID', payment.payment_id],
    ['Order ID', payment.order_id],
    ['Amount Paid', `₹${Number(payment.amount).toLocaleString('en-IN')}`],
    ['Payment Date', new Date(payment.createdAt).toLocaleString('en-IN')],
    ['Payment Mode', 'Razorpay Gateway'],
  ]);
  doc.moveDown(2);

  // ✅ 5. Signature Block
  doc
    .fontSize(13)
    .fillColor('#000')
    .text('Thanks again for choosing SMART LMS!')
    .moveDown(1)
    .font('Helvetica-Oblique')
    .fontSize(12)
    .text('— Team Smart LMS', { align: 'right' });

  doc.moveDown(2);

  // ✅ 6. Footer
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ccc').stroke();
  doc.moveDown(1);
  doc
    .fontSize(10)
    .fillColor('#555')
    .text('If you have any questions, contact us at: admin.smartlms@gmail.com');
  doc
    .fontSize(10)
    .fillColor('#888')
    .text(`© ${new Date().getFullYear()} SMART LMS`, { align: 'center' });

  doc.end();
  const pdfBuffer = await buffer(doc);
  return pdfBuffer;
};

// 🔧 Helper: Draw Two-Column Info Table
function drawTable(doc, rows) {
  const startY = doc.y;
  const labelX = 60;
  const valueX = 250;

  rows.forEach(([label, value], index) => {
    const y = startY + index * 20;
    doc
      .fontSize(11)
      .fillColor('#333')
      .text(label + ':', labelX, y)
      .fillColor('#000')
      .text(value, valueX, y);
  });
}
