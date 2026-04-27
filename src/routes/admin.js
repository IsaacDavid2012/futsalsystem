const express = require('express');
const db = require('../../db');
const { requireAuth, requireAdmin } = require('../middleware/authentication');

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

router.get('/users', requireAuth, requireAdmin, (_req, res) => {
  db.all(
    `SELECT
       u.id,
       u.email,
       u.role,
       u.full_name,
       u.phone,
       u.created_at,
       COUNT(b.id) AS total_bookings,
       SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS active_bookings,
       SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
       COALESCE(SUM(b.price_cents), 0) AS total_spend_cents,
       COALESCE(SUM(b.refund_cents), 0) AS total_refund_cents,
       MAX(b.booking_date) AS last_booking_date
     FROM users u
     LEFT JOIN bookings b ON b.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Server error.' });
      }

      return res.json({
        users: rows.map((row) => ({
          id: row.id,
          email: row.email,
          role: row.role,
          fullName: row.full_name || '',
          phone: row.phone || '',
          createdAt: row.created_at,
          totalBookings: row.total_bookings || 0,
          activeBookings: row.active_bookings || 0,
          cancelledBookings: row.cancelled_bookings || 0,
          totalSpend: formatPrice(row.total_spend_cents || 0),
          totalRefund: formatPrice(row.total_refund_cents || 0),
          lastBookingDate: row.last_booking_date || null,
        })),
      });
    }
  );
});

router.patch('/users/:id/role', requireAuth, requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const role = String(req.body.role || '').trim().toLowerCase();

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'Invalid user id.' });
  }

  if (!['admin', 'customer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  if (userId === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own role.' });
  }

  db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Server error.' });
    }

    if (!this.changes) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ message: 'User role updated.', role });
  });
});

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

router.get('/validate/:token', requireAuth, requireAdmin, (req, res) => {
  const token = String(req.params.token || '').trim();

  if (!token) {
    return res.status(400).json({ message: 'Validation token is required.' });
  }

  db.get(
    `SELECT b.id, b.user_id, b.court_number, b.booking_date, b.original_time_slot,
            b.customer_name, b.customer_phone, b.customer_email,
            b.price_cents, b.status, b.payment_status, b.arrival_status,
            p.payment_method
     FROM bookings b
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.validation_token = ?`,
    [token],
    (err, booking) => {
      if (err) {
        return res.status(500).json({ message: 'Server error.' });
      }

      if (!booking) {
        return res.status(404).json({ message: 'Invalid or unknown booking token.' });
      }

      return res.json({
        booking: {
          id: booking.id,
          courtNumber: booking.court_number,
          bookingDate: booking.booking_date,
          timeSlot: booking.original_time_slot,
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          customerEmail: booking.customer_email,
          price: formatPrice(booking.price_cents),
          status: booking.status,
          paymentStatus: booking.payment_status,
          arrivalStatus: booking.arrival_status,
          paymentMethod: booking.payment_method,
        }
      });
    }
  );
});

router.post('/validate/:token/confirm', requireAuth, requireAdmin, (req, res) => {
  const token = String(req.params.token || '').trim();

  if (!token) {
    return res.status(400).json({ message: 'Validation token is required.' });
  }

  db.run(
    `UPDATE bookings
     SET arrival_status = 'arrived'
     WHERE validation_token = ? AND status = 'confirmed'`,
    [token],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Server error.' });
      }

      if (!this.changes) {
        return res.status(404).json({ message: 'Booking not found or not active.' });
      }

      return res.json({ message: 'Booking successfully validated.' });
    }
  );
});

module.exports = router;
