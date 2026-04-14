/**
 * Makeshift Payment Gateway
 * Simulates payment processing for demonstration purposes
 * In production, replace with real payment provider (Stripe, PayPal, etc.)
 */

const crypto = require('crypto');

const MOCK_PROCESSING_DELAY = 1000; // ms

/**
 * Validate card format for demo payments
 * @param {string} cardNumber - Card number entered by the user
 * @returns {object} - { valid: boolean, error?: string }
 */
const validateCardNumber = (cardNumber) => {
  const rawValue = String(cardNumber || '').trim();

  if (!rawValue) {
    return { valid: false, error: 'Card number is required' };
  }

  return { valid: true };
};

/**
 * Process a payment with mock gateway
 * @param {object} options
 * @returns {Promise<object>} Payment result
 */
const processPayment = async (options) => {
  const {
    amount,
    cardNumber,
    cardholderName,
    expiryMonth,
    expiryYear,
    cvv,
    currency = 'USD',
  } = options;

  return new Promise((resolve) => {
    setTimeout(() => {
      // Validate inputs
      if (!amount || amount <= 0) {
        resolve({
          success: false,
          message: 'Invalid payment amount',
          transactionId: null,
        });
        return;
      }

      const rawCardNumber = String(cardNumber || '').trim();
      const digitsOnly = rawCardNumber.replace(/\D/g, '');

      // Validate card
      const validation = validateCardNumber(rawCardNumber);
      if (!validation.valid) {
        resolve({
          success: false,
          message: validation.error,
          transactionId: null,
        });
        return;
      }

      if (!cardholderName || cardholderName.trim().length < 2) {
        resolve({
          success: false,
          message: 'Invalid cardholder name',
          transactionId: null,
        });
        return;
      }

      if (!expiryMonth || !expiryYear) {
        resolve({
          success: false,
          message: 'Invalid expiry date',
          transactionId: null,
        });
        return;
      }

      if (!cvv || String(cvv).replace(/\D/g, '').length < 3) {
        resolve({
          success: false,
          message: 'Invalid CVV',
          transactionId: null,
        });
        return;
      }

      const transactionId = `TX_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      resolve({
        success: true,
        message: 'Payment approved',
        transactionId,
        cardLast4: digitsOnly.slice(-4),
        amount: (amount / 100).toFixed(2), // Convert from cents
        currency,
        timestamp: new Date().toISOString(),
      });
    }, MOCK_PROCESSING_DELAY);
  });
};

/**
 * Process refund with mock gateway
 * @param {object} options
 * @returns {Promise<object>} Refund result
 */
const processRefund = async (options) => {
  const {
    originalTransactionId,
    amount,
    reason = 'Customer requested refund',
  } = options;

  return new Promise((resolve) => {
    setTimeout(() => {
      if (!originalTransactionId) {
        resolve({
          success: false,
          message: 'Original transaction ID required',
          refundId: null,
        });
        return;
      }

      if (!amount || amount <= 0) {
        resolve({
          success: false,
          message: 'Invalid refund amount',
          refundId: null,
        });
        return;
      }

      const refundId = `RF_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      resolve({
        success: true,
        message: 'Refund processed successfully',
        refundId,
        originalTransactionId,
        amount: (amount / 100).toFixed(2),
        reason,
        timestamp: new Date().toISOString(),
      });
    }, MOCK_PROCESSING_DELAY);
  });
};

module.exports = {
  processPayment,
  processRefund,
  validateCardNumber,
};
