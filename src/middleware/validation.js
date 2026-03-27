/**
 * Middleware factory for validating request data with Joi schemas
 * @param {object} schema - Joi schema to validate against
 * @param {string} source - Request property to validate (body, query, params)
 * @returns {function} - Express middleware
 */
const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        message: 'Validation error.',
        errors: messages,
      });
    }

    // Replace the request property with validated data
    req[source] = value;
    next();
  };
};

module.exports = { validateRequest };
