// Stadium entrance effects - Black & White Theme
document.addEventListener("DOMContentLoaded", () => {
  // Create floating particles effect
  const createParticles = () => {
    const particleContainer = document.createElement("div");
    particleContainer.className = "futsal-particles";
    particleContainer.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -1;
      overflow: hidden;
    `;
    document.body.appendChild(particleContainer);

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement("div");
      particle.innerHTML = ["⚽", "◯", "○", "●"][Math.floor(Math.random() * 4)];
      particle.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 1.2 + 0.4}rem;
        opacity: ${Math.random() * 0.15 + 0.05};
        color: ${Math.random() > 0.5 ? '#ffffff' : '#cccccc'};
        left: ${Math.random() * 100}vw;
        top: ${Math.random() * 100}vh;
        animation: futsalFloat ${Math.random() * 25 + 20}s ease-in-out infinite;
        animation-delay: ${Math.random() * -15}s;
      `;
      particleContainer.appendChild(particle);
    }
  };

  // Stadium vibes with seamless transitions
  const addStadiumVibes = () => {
    const vibeStyle = document.createElement("style");
    vibeStyle.textContent = `
      @keyframes futsalFloat {
        0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.05; }
        25% { transform: translateY(-25px) translateX(15px) rotate(90deg); opacity: 0.12; }
        50% { transform: translateY(-15px) translateX(-20px) rotate(180deg); opacity: 0.08; }
        75% { transform: translateY(-35px) translateX(8px) rotate(270deg); opacity: 0.15; }
        100% { transform: translateY(0) translateX(0) rotate(360deg); opacity: 0.05; }
      }
      
      .btn-primary {
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
      }
      
      .auth-card:hover {
        transform: translateY(-2px) scale(1.005);
        box-shadow: 
          0 30px 100px rgba(0, 0, 0, 0.9),
          0 0 50px rgba(255, 255, 255, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }
      
      input:focus {
        transform: scale(1.01);
        box-shadow: 
          0 0 0 4px rgba(255, 255, 255, 0.1),
          0 8px 25px rgba(255, 255, 255, 0.08) !important;
      }
      
      a {
        color: #ffffff !important;
        position: relative;
        transition: all 0.3s ease;
      }
      
      a:hover {
        color: #cccccc !important;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
      }
    `;
    document.head.appendChild(vibeStyle);
  };

  // Seamless page transitions
  const setupPageTransitions = () => {
    const transition = document.querySelector('.page-transition');
    const links = document.querySelectorAll('a[href]');
    
    // Handle link clicks with smooth transitions
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        
        transition.classList.add('active');
        
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      });
    });
    
    // Hide transition on page load
    setTimeout(() => {
      transition.classList.remove('active');
    }, 100);
  };

  createParticles();
  addStadiumVibes();
  setupPageTransitions();
});

// Enhanced auth handling with futsal flair
const form = document.querySelector("form");
const alertBox = document.querySelector(".alert");

const showAlert = (message, isError = false) => {
  if (!alertBox) return;
  
  const prefix = isError ? "⚠️ " : "✓ ";
  alertBox.innerHTML = `${prefix}${message}`;
  alertBox.classList.add("show");
  
  if (isError) {
    alertBox.style.borderColor = "rgba(255, 255, 255, 0.4)";
    alertBox.style.background = "rgba(40, 0, 0, 0.9)";
    alertBox.style.color = "#ffcccc";
  } else {
    alertBox.style.borderColor = "rgba(255, 255, 255, 0.6)";
    alertBox.style.background = "rgba(0, 40, 0, 0.9)";
    alertBox.style.color = "#ccffcc";
  }
  
  alertBox.style.animation = "futsalPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
};

const clearAlert = () => {
  if (!alertBox) return;
  alertBox.classList.remove("show");
};

// Add success celebration effect
const celebrateSuccess = () => {
  const celebration = document.createElement("div");
  celebration.innerHTML = "✨⚽✓⚽✨";
  celebration.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 2.5rem;
    color: white;
    z-index: 1000;
    animation: celebrate 1.5s ease-out forwards;
    pointer-events: none;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
  `;
  
  const style = document.createElement("style");
  style.textContent = `
    @keyframes celebrate {
      0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
      50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); opacity: 0; }
    }
    @keyframes futsalPop {
      0% { transform: scale(0.8) translateY(20px); }
      100% { transform: scale(1) translateY(0); }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(celebration);
  
  setTimeout(() => celebration.remove(), 1500);
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAlert();

  const submitBtn = form.querySelector(".btn-primary");
  const originalText = submitBtn.textContent;
  
  // Loading state with futsal flair
  submitBtn.textContent = originalText.includes("Enter") ? "🚀 Entering..." : "⚡ Joining...";
  submitBtn.style.transform = "scale(0.98)";
  
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const endpoint = form.dataset.endpoint;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    celebrateSuccess();
    showAlert(data.message || "Welcome! ⚽", false);
    
    const redirect = form.dataset.redirect || "/login.html";
    setTimeout(() => {
      window.location.href = redirect;
    }, 1200);
    
  } catch (error) {
    showAlert(error.message, true);
    submitBtn.style.animation = "shake 0.5s ease-in-out";
  } finally {
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.style.transform = "";
    }, 500);
  }
});

// Add shake animation for errors
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;
document.head.appendChild(shakeStyle);