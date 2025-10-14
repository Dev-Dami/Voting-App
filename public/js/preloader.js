document.addEventListener("DOMContentLoaded", function () {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.getElementById("togglePassword");
  const eyeIcon = document.getElementById("eyeIcon");

  if (passwordInput && toggleBtn && eyeIcon) {
    toggleBtn.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      if (type === "text") {
        eyeIcon.classList.remove("fa-eye");
        eyeIcon.classList.add("fa-eye-slash");
      } else {
        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");
      }
    });
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      const loader = document.getElementById("loader");
      if (loader) {
        loader.classList.add("opacity-0", "transition-opacity", "duration-500");
        setTimeout(() => {
          loader.classList.add("hidden");
          const mainContent = document.getElementById("main-content");
          if (mainContent) {
            mainContent.classList.remove("hidden");
          }
        }, 500);
      }
    }, 1000);
  });
});
