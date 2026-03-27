const express = require('express');
const db = require('../../db');
const { requireAuth } = require('../middleware/authentication');

const router = express.Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const formatPrice = (cents) => Number((cents / 100).toFixed(2));

const parseDate = (value) => {
  if (!DATE_REGEX.test(String(value || ''))) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const daysBetweenInclusive = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor((endDate.getTime() - startDate.getTime()) / oneDay) + 1;
};

const requireAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  db.get('SELECT role FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Server error.' });
    }
    if (!row) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }
    if (row.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    req.user.role = 'admin';
    return next();
  });
};

router.get('/overview', requireAuth, requireAdmin, (req, res) => {
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const startDateRaw = String(req.query.startDate || todayKey);
  const endDateRaw = String(req.query.endDate || startDateRaw);

  const startDate = parseDate(startDateRaw);
  const endDate = parseDate(endDateRaw);

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate must be YYYY-MM-DD.' });
  }

  if (startDate.getTime() > endDate.getTime()) {
    return res.status(400).json({ message: 'startDate must be before or equal to endDate.' });
  }

  db.all(
    `SELECT b.id, b.user_id, b.court_number, b.booking_date, b.original_time_slot,
            b.customer_name, b.customer_phone, b.customer_email,
            b.price_cents, b.status, b.payment_status, b.refund_cents,
            b.cancelled_at, b.cancel_reason,
            p.payment_method, p.card_last4, p.refund_status
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.booking_date >= ? AND b.booking_date <= ?
     ORDER BY b.booking_date DESC, b.court_number ASC, b.original_time_slot ASC`,
    [startDateRaw, endDateRaw],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Server error.' });
      }

      const days = daysBetweenInclusive(startDate, endDate);
      const slotsPerDay = 15;
      const courtUtilization = {
        1: { booked: 0, utilizationPct: 0 },
        2: { booked: 0, utilizationPct: 0 },
        3: { booked: 0, utilizationPct: 0 },
        4: { booked: 0, utilizationPct: 0 },
        5: { booked: 0, utilizationPct: 0 },
      };

      let totalBookings = 0;
      let activeBookings = 0;
      let cancelledBookings = 0;
      let grossRevenueCents = 0;
      let refundedCents = 0;

      const bookings = rows.map((row) => {
        totalBookings += 1;
        grossRevenueCents += row.price_cents || 0;
        refundedCents += row.refund_cents || 0;

        if (row.status === 'confirmed') {
          activeBookings += 1;
          if (courtUtilization[row.court_number]) {
            courtUtilization[row.court_number].booked += 1;
          }
        }

        if (row.status === 'cancelled') {
          cancelledBookings += 1;
        }

        return {
          id: row.id,
          userId: row.user_id,
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
          paymentMethod: row.payment_method || null,
          cardLast4: row.card_last4 || null,
          refundStatus: row.refund_status || null,
        };
      });

      const totalSlots = days * slotsPerDay;

      Object.keys(courtUtilization).forEach((court) => {
        const booked = courtUtilization[court].booked;
        courtUtilization[court].utilizationPct = totalSlots > 0
          ? Number(((booked / totalSlots) * 100).toFixed(2))
          : 0;
      });

      return res.json({
        period: {
          startDate: startDateRaw,
          endDate: endDateRaw,
          days,
        },
        summary: {
          totalBookings,
          activeBookings,
          cancelledBookings,
          grossRevenue: formatPrice(grossRevenueCents),
          refunded: formatPrice(refundedCents),
          netRevenue: formatPrice(grossRevenueCents - refundedCents),
        },
        courtUtilization,
        bookings,
      });
    }
  );
});

module.exports = router;
