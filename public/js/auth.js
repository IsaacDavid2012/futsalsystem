/**
 * Authentication form handler
 * Manages signup and login form submissions
 */

const form = document.querySelector('form');
const alertBox = document.querySelector('.alert');

/**
 * Display an alert message to the user
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether this is an error message
 */
const showAlert = (message, isError = false) => {
  if (!alertBox) return;

  alertBox.textContent = message;
  alertBox.classList.add('show');
  alertBox.setAttribute('role', 'alert');
  alertBox.style.borderColor = isError
    ? 'rgba(248, 113, 113, 0.6)'
    : 'rgba(34, 197, 94, 0.6)';
  alertBox.style.color = isError ? '#fecaca' : '#bbf7d0';

  // Auto-hide success messages after 5 seconds
  if (!isError) {
    setTimeout(clearAlert, 5000);
  }
};

/**
 * Clear the alert message
 */
const clearAlert = () => {
  if (!alertBox) return;
  alertBox.classList.remove('show');
  alertBox.removeAttribute('role');
};

/**
 * Parse API response safely
 * @param {Response} response - Fetch response object
 * @returns {Promise<object>} - Parsed JSON or error object
 */
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return { message: 'Unexpected server response.' };
};

/**
 * Disable form submission and show loading state
 */
const disableForm = (submitButton) => {
  if (!submitButton) return;

  submitButton.disabled = true;
  submitButton.dataset.originalText = submitButton.textContent;
  submitButton.textContent = 'Please wait...';
};

/**
 * Re-enable form submission
 */
const enableForm = (submitButton) => {
  if (!submitButton) return;

  submitButton.disabled = false;
  submitButton.textContent = submitButton.dataset.originalText || 'Submit';
};

// Form submission handler
form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearAlert();

  const submitButton = form.querySelector("button[type='submit']");
  disableForm(submitButton);

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const endpoint = form.dataset.endpoint;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      const errorMessage = data.errors?.[0] || data.message || 'Something went wrong';
      throw new Error(errorMessage);
    }

    showAlert(data.message || 'Success', false);

    // Redirect after success
    const redirect = form.dataset.redirect || '/home';
    setTimeout(() => {
      window.location.href = redirect;
    }, 1000);
  } catch (error) {
    console.error('Form submission error:', error);
    showAlert(error.message || 'An unexpected error occurred', true);
    enableForm(submitButton);
  }
});

