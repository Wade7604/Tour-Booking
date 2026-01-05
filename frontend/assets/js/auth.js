const firebaseConfig = {
  apiKey: "AIzaSyCBoZPHJMWBA1bVbXxz82G4tuK-meN-fU8",
  authDomain: "tour-booking-934ba.firebaseapp.com",
  projectId: "tour-booking-934ba",
  storageBucket: "tour-booking-934ba.firebasestorage.app",
  messagingSenderId: "1033423170310",
  appId: "1:1033423170310:web:47c95e5c98de254b86cc87",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Google Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ===== Utility Functions =====
function showAlert(message, type = "success") {
  const alertContainer = document.getElementById("alertContainer");
  const alertHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <i class="fas fa-${
        type === "success"
          ? "check-circle"
          : type === "danger"
          ? "exclamation-circle"
          : "info-circle"
      }"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  alertContainer.innerHTML = alertHTML;

  setTimeout(() => {
    alertContainer.innerHTML = "";
  }, 5000);
}

function setButtonLoading(button, loading) {
  const btnText = button.querySelector(".btn-text");
  const spinner = button.querySelector(".spinner-border");

  if (loading) {
    button.disabled = true;
    button.classList.add("loading");
    btnText.style.display = "none";
    spinner.classList.remove("d-none");
  } else {
    button.disabled = false;
    button.classList.remove("loading");
    btnText.style.display = "inline";
    spinner.classList.add("d-none");
  }
}

// ===== LOGIN PAGE =====
const loginForm = document.getElementById("loginForm");
const googleLoginBtn = document.getElementById("googleLoginBtn");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("loginBtn");

    setButtonLoading(loginBtn, true);

    try {
      const response = await API.login(email, password);

      if (response.success) {
        // Chỉ lưu token
        localStorage.setItem(
          "authToken",
          response.data.token || response.token
        );

        showAlert("Đăng nhập thành công! Đang chuyển hướng...", "success");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      }
    } catch (error) {
      showAlert(
        error.message || "Đăng nhập thất bại. Vui lòng thử lại.",
        "danger"
      );
    } finally {
      setButtonLoading(loginBtn, false);
    }
  });
}

// Google Sign In
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    setButtonLoading(googleLoginBtn, true);

    try {
      // Sign in with Google popup
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;

      // Get ID token from Firebase
      const idToken = await user.getIdToken();

      // Send to backend
      const response = await API.loginWithGoogle(idToken);

      if (response.success) {
        // Chỉ lưu token từ backend
        localStorage.setItem(
          "authToken",
          response.data.token || response.token
        );

        showAlert("Đăng nhập Google thành công!", "success");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      }
    } catch (error) {
      console.error("Google login error:", error);
      showAlert(error.message || "Đăng nhập Google thất bại.", "danger");
    } finally {
      setButtonLoading(googleLoginBtn, false);
    }
  });
}

// ===== VALIDATION UTILS (Đồng bộ với Backend) =====
const VALIDATION_RULES = {
  password: {
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&#]).{8,}$/,
    message:
      "Mật khẩu phải ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
  },
  phone: {
    regex: /^(0|\+84)[0-9]{9,10}$/,
    message: "Số điện thoại không đúng định dạng Việt Nam",
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Email không hợp lệ",
  },
};

// Hàm hiển thị lỗi chi tiết cho từng input
function displayFieldErrors(errors) {
  // Xóa tất cả lỗi cũ trước
  document.querySelectorAll(".invalid-feedback").forEach((el) => el.remove());
  document
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));

  errors.forEach((err) => {
    const input =
      document.getElementById(err.field) ||
      document.getElementsByName(err.field)[0];
    if (input) {
      input.classList.add("is-invalid");
      const feedback = document.createElement("div");
      feedback.className = "invalid-feedback";
      feedback.innerText = err.message;
      input.parentNode.appendChild(feedback);
    }
  });
}

// ===== REGISTER PAGE UPDATE =====
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  // Clear lỗi khi user nhập vào input
  const formInputs = registerForm.querySelectorAll("input");
  formInputs.forEach((input) => {
    input.addEventListener("input", function () {
      this.classList.remove("is-invalid");
      const feedback = this.parentNode.querySelector(".invalid-feedback");
      if (feedback) feedback.remove();
    });
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fields = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    };

    let clientErrors = [];

    // Kiểm tra các quy tắc giống Backend
    if (fields.fullName.length < 2 || fields.fullName.length > 100) {
      clientErrors.push({
        field: "fullName",
        message: "Họ tên phải từ 2-100 ký tự",
      });
    }
    if (!VALIDATION_RULES.email.regex.test(fields.email)) {
      clientErrors.push({
        field: "email",
        message: VALIDATION_RULES.email.message,
      });
    }
    if (fields.phone && !VALIDATION_RULES.phone.regex.test(fields.phone)) {
      clientErrors.push({
        field: "phone",
        message: VALIDATION_RULES.phone.message,
      });
    }
    if (!VALIDATION_RULES.password.regex.test(fields.password)) {
      clientErrors.push({
        field: "password",
        message: VALIDATION_RULES.password.message,
      });
    }
    if (fields.password !== fields.confirmPassword) {
      clientErrors.push({
        field: "confirmPassword",
        message: "Mật khẩu xác nhận không khớp",
      });
    }

    if (clientErrors.length > 0) {
      displayFieldErrors(clientErrors);
      return;
    }

    // Nếu qua được validation ở client, mới gọi API
    const registerBtn = document.getElementById("registerBtn");
    setButtonLoading(registerBtn, true);

    try {
      const response = await API.register(fields);
      if (response.success) {
        showAlert("Đăng ký thành công!", "success");
        setTimeout(() => (window.location.href = "login.html"), 2000);
      }
    } catch (error) {
      // Nếu server trả về lỗi validation (400), hiển thị lỗi đó lên field
      if (error.errors) {
        displayFieldErrors(error.errors);
      } else {
        showAlert(error.message, "danger");
      }
    } finally {
      setButtonLoading(registerBtn, false);
    }
  });
}

// ===== TOGGLE PASSWORD VISIBILITY =====
const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

if (togglePassword) {
  togglePassword.addEventListener("click", function () {
    const passwordInput = document.getElementById("password");
    const icon = this.querySelector("i");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
}

if (toggleConfirmPassword) {
  toggleConfirmPassword.addEventListener("click", function () {
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const icon = this.querySelector("i");

    if (confirmPasswordInput.type === "password") {
      confirmPasswordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      confirmPasswordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
}

// ===== CHECK AUTH STATUS =====
function checkAuthStatus() {
  const token = localStorage.getItem("authToken");

  // If on login/register page and already logged in, redirect to dashboard
  const currentPage = window.location.pathname;
  if (
    (currentPage.includes("login.html") ||
      currentPage.includes("register.html")) &&
    token
  ) {
    window.location.href = "index.html";
  }

  // If on protected page and not logged in, redirect to login
  const protectedPages = [
    "index.html",
    "profile.html",
    "dashboard.html",
    "booking.html",
  ];
  const isProtectedPage = protectedPages.some((page) =>
    currentPage.includes(page)
  );

  if (isProtectedPage && !token) {
    window.location.href = "login.html";
  }
}

// Run auth check on page load
document.addEventListener("DOMContentLoaded", checkAuthStatus);

// ===== LOGOUT FUNCTION =====
function logout() {
  // Clear token from localStorage
  localStorage.removeItem("authToken");

  // Sign out from Firebase
  auth
    .signOut()
    .then(() => {
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
      // Force redirect anyway
      window.location.href = "login.html";
    });
}
