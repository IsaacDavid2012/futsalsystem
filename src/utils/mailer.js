const nodemailer = require('nodemailer');
const config = require('./config');
const logger = require('./logger');

const transporter = config.mail.enabled
  ? nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
  })
  : null;

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const bookingEmailHtml = ({ name, booking, paymentMethod, cardLast4 }) => {
  const rows = [
    ['Court', `Court ${booking.courtNumber}`],
    ['Date', booking.bookingDate],
    ['Time', booking.timeSlot],
    ['Customer', name || booking.customerName || 'Valued player'],
    ['Email', booking.customerEmail],
    ['Phone', booking.customerPhone],
    ['Payment', paymentMethod === 'card' ? `Card ending ${cardLast4 || '----'}` : 'Pay at venue'],
    ['Amount', formatMoney(booking.price)],
  ];

  const rowsMarkup = rows.map(([label, value]) => `
    <tr>
      <td style="padding:12px 0;color:#6b7280;font-size:14px;width:140px;">${label}</td>
      <td style="padding:12px 0;color:#1f2937;font-size:14px;font-weight:600;">${value}</td>
    </tr>
  `).join('');

  return `
    <div style="margin:0;padding:0;background:#f5fbf8;font-family:Poppins,Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dfe6e9;box-shadow:0 18px 40px rgba(17,39,29,0.12);">
          <div style="padding:28px;background:linear-gradient(135deg,#00b894,#00916e);color:#ffffff;">
            <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.85;">FutsalHub</div>
            <h1 style="margin:10px 0 0;font-size:28px;line-height:1.1;">Booking confirmed</h1>
            <p style="margin:10px 0 0;font-size:15px;opacity:0.95;">Your court is reserved and the booking details are below.</p>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7;">Hi ${name || 'player'}, your booking has been successfully created. We have attached the key details so you can keep everything handy.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rowsMarkup}</table>
            <div style="margin-top:24px;padding:16px 18px;border-radius:18px;background:#f8faf9;border:1px solid #dfe6e9;">
              <p style="margin:0;color:#2d3436;font-size:14px;line-height:1.7;">If you need to make changes, sign in to your account and manage the booking from your dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const sendBookingConfirmationEmail = async ({ to, booking, name, paymentMethod, cardLast4 }) => {
  if (!transporter) {
    logger.warn('Booking email skipped because SMTP is not configured.');
    return;
  }

  const recipients = [to, config.mail.notificationEmail]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter((value, index, array) => array.indexOf(value) === index);

  if (!recipients.length) {
    return;
  }

  await transporter.sendMail({
    from: config.mail.from,
    to: recipients[0],
    bcc: recipients.slice(1),
    subject: `FutsalHub booking confirmed - Court ${booking.courtNumber}`,
    text: [
      'Your FutsalHub booking is confirmed.',
      `Court: Court ${booking.courtNumber}`,
      `Date: ${booking.bookingDate}`,
      `Time: ${booking.timeSlot}`,
      `Customer: ${name || booking.customerName || 'Valued player'}`,
      `Email: ${booking.customerEmail}`,
      `Phone: ${booking.customerPhone}`,
      `Payment: ${paymentMethod === 'card' ? `Card ending ${cardLast4 || '----'}` : 'Pay at venue'}`,
      `Amount: ${formatMoney(booking.price)}`,
    ].join('\n'),
    html: bookingEmailHtml({ name, booking, paymentMethod, cardLast4 }),
  });
};

module.exports = { sendBookingConfirmationEmail };