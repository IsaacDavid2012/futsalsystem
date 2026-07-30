/**
 * Dashboard page handler
 * Manages session verification and logout functionality
 */

const alertBox = document.querySelector('.alert');
const sessionEmail = document.querySelector('#session-email');
const logoutButton = document.querySelector('#logout-btn');

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
};

/**
 * Load and display current user session
 */
const loadSession = async () => {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();

    if (!data.user || !data.user.email) {
      throw new Error('Invalid session data');
    }

    if (sessionEmail) {
      sessionEmail.textContent = `Signed in as ${data.user.email}`;
    }
  } catch (error) {
    console.error('Session load error:', error);
    showAlert(error.message, true);

    setTimeout(() => {
      window.location.href = '/login.html';
    }, 2000);
  }
};

/**
 * Handle logout action
 */
const logout = async () => {
  if (!logoutButton) return;

  logoutButton.disabled = true;
  logoutButton.dataset.originalText = logoutButton.textContent;
  logoutButton.textContent = 'Logging out...';

  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Could not log out. Try again.');
    }

    // Redirect to login after brief delay
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 500);
  } catch (error) {
    console.error('Logout error:', error);
    showAlert(error.message, true);

    logoutButton.disabled = false;
    logoutButton.textContent = logoutButton.dataset.originalText || 'Logout';
  }
};

// Event listeners
logoutButton?.addEventListener('click', logout);

// Load session on page load
loadSession();
