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
    if (!transition) return;
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