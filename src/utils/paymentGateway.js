/**
 * Makeshift Payment Gateway
 * Simulates payment processing for demonstration purposes
 * In production, replace with real payment provider (Stripe, PayPal, etc.)
 */

const crypto = require('crypto');

// Simulated payment responses based on card patterns
const MOCK_RESPONSES = {
  // Test card patterns
  '4111111111111111': { success: true, message: 'Payment approved' },
  '5555555555554444': { success: true, message: 'Payment approved' },
  '378282246310005': { success: true, message: 'Payment approved' },
  // Declined cards
  '4000000000000002': { success: false, message: 'Card declined' },
  '5555555555554445': { success: false, message: 'Insufficient funds' },
  // Default for demo
};

const MOCK_PROCESSING_DELAY = 1000; // ms

/**
 * Validate card format
 * @param {string} cardNumber - Card number (digits only)
 * @returns {object} - { valid: boolean, error?: string }
 */
const validateCardNumber = (cardNumber) => {
  const digitsOnly = String(cardNumber || '').replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 12 || digitsOnly.length > 19) {
    return { valid: false, error: 'Invalid card number length' };
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'Invalid card number (Luhn check failed)' };
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

      const digitsOnly = String(cardNumber || '').replace(/\D/g, '');

      // Validate card
      const validation = validateCardNumber(digitsOnly);
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

      // Check if card is in test patterns
      const response = MOCK_RESPONSES[digitsOnly] || { success: true, message: 'Payment approved' };

      const transactionId = `TX_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      resolve({
        success: response.success,
        message: response.message,
        transactionId: response.success ? transactionId : null,
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
