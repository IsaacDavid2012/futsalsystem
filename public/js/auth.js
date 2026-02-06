const form = document.querySelector("form");
const alertBox = document.querySelector(".alert");

const showAlert = (message, isError = false) => {
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.classList.add("show");
  alertBox.style.borderColor = isError
    ? "rgba(248, 113, 113, 0.6)"
    : "rgba(34, 197, 94, 0.6)";
  alertBox.style.color = isError ? "#fecaca" : "#bbf7d0";
};

const clearAlert = () => {
  if (!alertBox) return;
  alertBox.classList.remove("show");
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAlert();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  const endpoint = form.dataset.endpoint;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    showAlert(data.message || "Success", false);
    const redirect = form.dataset.redirect || "/login.html";
    setTimeout(() => {
      window.location.href = redirect;
    }, 900);
  } catch (error) {
    showAlert(error.message, true);
  }
});
