const express = require('express');
const db = require('../../db');
const { requireAuth, enforceOrigin } = require('../middleware/authentication');
const { processPayment, processRefund } = require('../utils/paymentGateway');
const { sendBookingConfirmationEmail } = require('../utils/mailer');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const COURT_PRICES_CENTS = {
  1: 5000,
  2: 5000,
  3: 4000,
  4: 4000,
  5: 7000,
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_SLOT_REGEX = /^\d{2}:00$/;

const formatPrice = (cents) => Number((cents / 100).toFixed(2));

const parseBookingDateTime = (bookingDate, timeSlot) => {
  if (!DATE_REGEX.test(bookingDate) || !TIME_SLOT_REGEX.test(timeSlot)) {
    return null;
  }
  const dateTime = new Date(`${bookingDate}T${timeSlot}:00`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
};

const calculateRefundCents = (priceCents, bookingDate, timeSlot) => {
  const bookingDateTime = parseBookingDateTime(bookingDate, timeSlot);
  if (!bookingDateTime) {
    return 0;
  }

  const hoursDiff = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursDiff >= 24) {
    return priceCents;
  }
  if (hoursDiff >= 2) {
    return Math.round(priceCents * 0.5);
  }
  return 0;
};

const validateBookingInput = ({
  courtNumber,
  bookingDate,
  timeSlot,
  customerName,
  customerPhone,
  paymentMethod,
  cardNumber,
}) => {
  if (!COURT_PRICES_CENTS[courtNumber]) {
    return 'Invalid court number.';
  }

  if (!DATE_REGEX.test(bookingDate)) {
    return 'Invalid booking date.';
  }

  if (!TIME_SLOT_REGEX.test(timeSlot)) {
    return 'Invalid time slot.';
  }

  if (!customerName || customerName.trim().length < 2) {
    return 'Name must be at least 2 characters.';
  }

  if (!customerPhone || customerPhone.trim().length < 6) {
    return 'Phone number looks invalid.';
  }

  if (!['card', 'cash'].includes(paymentMethod)) {
    return 'Invalid payment method.';
  }

  if (paymentMethod === 'card') {
    const rawCardNumber = String(cardNumber || '').trim();
    if (!rawCardNumber) {
      return 'Invalid card number.';
    }
  }

  return null;
};

router.get('/', requireAuth, (req, res) => {
  const bookingDate = req.query.date;

  if (!bookingDate || !DATE_REGEX.test(String(bookingDate))) {
    return res.status(400).json({ message: 'A valid date query is required (YYYY-MM-DD).' });
  }

  db.all(
    `SELECT b.id, b.user_id, b.court_number, b.booking_date, b.original_time_slot,
            b.customer_name, b.customer_phone, b.customer_email,
            b.price_cents, b.status, b.payment_status, b.refund_cents,
            b.cancelled_at, b.cancel_reason, b.validation_token, b.arrival_status,
            p.payment_method, p.card_last4
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.booking_date = ? AND b.status = 'confirmed'
     ORDER BY b.court_number ASC, b.original_time_slot ASC`,
    [bookingDate],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Server error.' });
      }

      const bookings = rows.map((row) => ({
        id: row.id,
        courtNumber: row.court_number,
        bookingDate: row.booking_date,
        timeSlot: row.original_time_slot,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerEmail: row.customer_email,
        price: formatPrice(row.price_cents),
        status: row.status,
        paymentStatus: row.payment_status,
        refund: formatPrice(row.refund_cents || 0),
        cancelledAt: row.cancelled_at,
        cancelReason: row.cancel_reason,
        validationToken: row.validation_token,
        arrivalStatus: row.arrival_status,
        paymentMethod: row.payment_method || null,
        cardLast4: row.card_last4 || null,
        isMine: row.user_id === req.user.id,
      }));

      return res.json({ bookings });
    }
  );
});

router.get('/mine', requireAuth, (req, res) => {
  db.all(
    `SELECT b.id, b.court_number, b.booking_date, b.original_time_slot,
            b.customer_name, b.customer_phone, b.customer_email,
            b.price_cents, b.status, b.payment_status, b.refund_cents,
            b.cancelled_at, b.cancel_reason, b.validation_token, b.arrival_status,
            p.payment_method, p.card_last4
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.user_id = ?
     ORDER BY b.booking_date DESC, b.original_time_slot ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Server error.' });
      }

      const bookings = rows.map((row) => ({
        id: row.id,
        courtNumber: row.court_number,
        bookingDate: row.booking_date,
        timeSlot: row.original_time_slot,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerEmail: row.customer_email,
        price: formatPrice(row.price_cents),
        status: row.status,
        paymentStatus: row.payment_status,
        refund: formatPrice(row.refund_cents || 0),
        cancelledAt: row.cancelled_at,
        cancelReason: row.cancel_reason,
        validationToken: row.validation_token,
        arrivalStatus: row.arrival_status,
        paymentMethod: row.payment_method || null,
        cardLast4: row.card_last4 || null,
      }));

      return res.json({ bookings });
    }
  );
});

router.post('/checkout', enforceOrigin, requireAuth, async (req, res) => {
  const courtNumber = Number(req.body.courtNumber);
  const bookingDate = String(req.body.bookingDate || '');
  const timeSlot = String(req.body.timeSlot || '');
  const customerName = String(req.body.customerName || '').trim();
  const customerPhone = String(req.body.customerPhone || '').trim();
  const paymentMethod = String(req.body.paymentMethod || '').toLowerCase();
  const cardNumber = String(req.body.cardNumber || '');
  const cardDigits = cardNumber.replace(/\D/g, '');

  const validationError = validateBookingInput({
    courtNumber,
    bookingDate,
    timeSlot,
    customerName,
    customerPhone,
    paymentMethod,
    cardNumber,
  });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const bookingDateTime = parseBookingDateTime(bookingDate, timeSlot);
  if (!bookingDateTime) {
    return res.status(400).json({ message: 'Invalid booking date/time.' });
  }
  if (bookingDateTime.getTime() <= Date.now()) {
    return res.status(400).json({ message: 'Cannot book past time slots.' });
  }

  const priceCents = COURT_PRICES_CENTS[courtNumber];
  const createdAt = new Date().toISOString();
  const cardLast4 = paymentMethod === 'card' ? cardDigits.slice(-4) : null;
  const validationToken = uuidv4();

  // Process payment if card payment is selected
  let paymentResult = null;
  if (paymentMethod === 'card') {
    paymentResult = await processPayment({
      amount: priceCents,
      cardNumber: cardNumber,
      cardholderName: customerName,
      expiryMonth: req.body.expiryMonth || '12',
      expiryYear: req.body.expiryYear || '25',
      cvv: req.body.cvv || '123',
      currency: 'USD',
    });

    if (!paymentResult.success) {
      return res.status(402).json({
        message: paymentResult.message,
        paymentError: true
      });
    }
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get(
      'SELECT id FROM bookings WHERE court_number = ? AND booking_date = ? AND original_time_slot = ? AND status = \'confirmed\'',
      [courtNumber, bookingDate, timeSlot],
      (checkErr, existing) => {
        if (checkErr) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Server error.' });
        }

        if (existing) {
          db.run('ROLLBACK');
          return res.status(409).json({ message: 'This slot is already booked.' });
        }

        db.run(
          `INSERT INTO bookings (
              user_id, court_number, booking_date, original_time_slot, time_slot,
              customer_name, customer_phone, customer_email,
              price_cents, status, payment_status, created_at, validation_token
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid', ?, ?)`,
          [
            req.user.id,
            courtNumber,
            bookingDate,
            timeSlot,
            timeSlot,
            customerName,
            customerPhone,
            req.user.email,
            priceCents,
            createdAt,
            validationToken,
          ],
          function onInsertBooking(insertBookingErr) {
            if (insertBookingErr) {
              db.run('ROLLBACK');
              if (insertBookingErr.message.includes('UNIQUE')) {
                return res.status(409).json({ message: 'This slot is already booked.' });
              }
              return res.status(500).json({ message: 'Server error.' });
            }

            const bookingId = this.lastID;
            const transactionId = paymentResult ? paymentResult.transactionId : null;

            db.run(
              'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
              [customerName, customerPhone, req.user.id],
              (profileErr) => {
                if (profileErr) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ message: 'Server error.' });
                }

                db.run(
                  `INSERT INTO payments (
                    booking_id, user_id, amount_cents, payment_method,
                    card_last4, transaction_id, status, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, 'paid', ?)`,
                  [bookingId, req.user.id, priceCents, paymentMethod, cardLast4, transactionId, createdAt],
                  (insertPaymentErr) => {
                    if (insertPaymentErr) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ message: 'Payment could not be processed.' });
                    }

                    db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ message: 'Server error.' });
                      }

                      const booking = {
                        id: bookingId,
                        courtNumber,
                        bookingDate,
                        timeSlot,
                        customerName,
                        customerPhone,
                        customerEmail: req.user.email,
                        price: formatPrice(priceCents),
                        status: 'confirmed',
                        paymentStatus: 'paid',
                        arrivalStatus: 'pending',
                        validationToken,
                        paymentMethod,
                        cardLast4,
                        transactionId,
                      };

                      const validationUrl = `${req.protocol}://${req.get('host')}/admin.html?validate=${validationToken}`;

                      void sendBookingConfirmationEmail({
                        to: req.user.email,
                        booking,
                        name: customerName,
                        paymentMethod,
                        cardLast4,
                        validationUrl,
                      }).catch((mailErr) => {
                        logger.warn('Booking confirmation email failed', {
                          error: mailErr.message,
                          bookingId,
                        });
                      });

                      return res.status(201).json({
                        message: 'Booking confirmed and payment received.',
                        booking,
                      });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

router.post('/:id/cancel', enforceOrigin, requireAuth, (req, res) => {
  const bookingId = Number(req.params.id);
  const cancelReason = String(req.body.reason || 'Cancelled by user').trim();

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({ message: 'Invalid booking id.' });
  }

  db.get(
    `SELECT b.id, b.user_id, b.court_number, b.booking_date, b.original_time_slot,
            b.price_cents, b.status,
            p.payment_method, p.transaction_id
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.id = ?`,
    [bookingId],
    async (findErr, booking) => {
      if (findErr) {
        return res.status(500).json({ message: 'Server error.' });
      }

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
      }

      const isOwner = booking.user_id === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'You cannot cancel this booking.' });
      }

      if (booking.status !== 'confirmed') {
        return res.status(400).json({ message: 'Booking is already cancelled.' });
      }

      const cancelledAt = new Date().toISOString();
      const releasedTimeSlot = `${booking.original_time_slot}_C${booking.id}`;
      const refundCents = calculateRefundCents(
        booking.price_cents,
        booking.booking_date,
        booking.original_time_slot
      );

      const paymentStatus = refundCents === 0
        ? 'paid'
        : refundCents === booking.price_cents
          ? 'refunded'
          : 'partial_refund';

      const refundStatus = refundCents === 0
        ? 'none'
        : refundCents === booking.price_cents
          ? 'completed'
          : 'partial';

      let refundMeta = null;
      if (refundCents > 0 && booking.payment_method === 'card') {
        const originalTransactionId = booking.transaction_id || `LEGACY_TX_${booking.id}`;
        refundMeta = await processRefund({
          originalTransactionId,
          amount: refundCents,
          reason: cancelReason,
        });

        if (!refundMeta.success) {
          return res.status(502).json({ message: 'Refund simulation failed. Please retry cancellation.' });
        }
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE bookings
           SET status = 'cancelled',
               payment_status = ?,
               refund_cents = ?,
               cancelled_at = ?,
               cancel_reason = ?,
               time_slot = ?
           WHERE id = ?`,
          [paymentStatus, refundCents, cancelledAt, cancelReason, releasedTimeSlot, bookingId],
          (updateBookingErr) => {
            if (updateBookingErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Could not cancel booking.' });
            }

            db.run(
              `UPDATE payments
               SET status = ?,
                   refund_status = ?,
                   refunded_cents = ?,
                   refunded_at = ?
               WHERE booking_id = ?`,
              [
                paymentStatus,
                refundStatus,
                refundCents,
                refundMeta ? refundMeta.timestamp : refundCents > 0 ? cancelledAt : null,
                bookingId,
              ],
              (updatePaymentErr) => {
                if (updatePaymentErr) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ message: 'Could not complete refund simulation.' });
                }

                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Server error.' });
                  }

                  return res.json({
                    message: 'Booking cancelled and refund simulation completed.',
                    booking: {
                      id: booking.id,
                      courtNumber: booking.court_number,
                      bookingDate: booking.booking_date,
                      timeSlot: booking.original_time_slot,
                      status: 'cancelled',
                      paymentStatus,
                      refund: formatPrice(refundCents),
                      refundId: refundMeta ? refundMeta.refundId : null,
                    },
                  });
                });
              }
            );
          }
        );
      });
    }
  );
});

router.get('/:id/qrcode.png', requireAuth, (req, res) => {
  const bookingId = Number(req.params.id);
  
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).send('Invalid booking id');
  }

  db.get(
    'SELECT validation_token FROM bookings WHERE id = ? AND user_id = ? AND status = "confirmed"',
    [bookingId, req.user.id],
    async (err, booking) => {
      if (err) {
        return res.status(500).send('Server error');
      }
      if (!booking || !booking.validation_token) {
        return res.status(404).send('Not found');
      }

      const url = `${req.protocol}://${req.get('host')}/admin.html?validate=${booking.validation_token}`;
      
      try {
        const QRCode = require('qrcode');
        const buffer = await QRCode.toBuffer(url, { width: 150, margin: 1, type: 'png' });
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours since it never changes
        res.send(buffer);
      } catch (error) {
        logger.error('QR Code generation failed', { error: error.message });
        res.status(500).send('Error generating QR code');
      }
    }
  );
});

module.exports = router;
