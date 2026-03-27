const Joi = require('joi');

/**
 * Validation schemas for authentication
 */

const signupSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address.',
      'any.required': 'Email is required.',
    }),
  password: Joi.string()
    .min(8)
    .max(72)
    .required()
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .messages({
      'string.min': 'Password must be at least 8 characters.',
      'string.max': 'Password is too long.',
      'string.pattern.name': 'Password must contain uppercase, lowercase, and numbers.',
      'any.required': 'Password is required.',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address.',
      'any.required': 'Email is required.',
    }),
  password: Joi.string()
    .max(72)
    .required()
    .messages({
      'string.max': 'Password is too long.',
      'any.required': 'Password is required.',
    }),
});

/**
 * Validate input against schema
 * @param {object} data - Data to validate
 * @param {object} schema - Joi schema
 * @returns {object} - { error: null | error, value: validated data }
 */
const validate = (data, schema) => {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};

module.exports = {
  signupSchema,
  loginSchema,
  validate,
};
