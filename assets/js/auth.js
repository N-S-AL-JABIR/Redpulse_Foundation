/**
 * REDPULSE FOUNDATION — auth.js
 * Login + Register + JWT Authentication
 * Uses global API & Auth objects from app.js
 */

'use strict';

// If user is already logged in, redirect them away from auth pages
document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    window.location.replace(user && user.role === 'moderator' ? 'dashboard.html#moderator' : 'dashboard.html');
  }
});

/* ────────────────────────────────────────────────────────
   PASSWORD STRENGTH
──────────────────────────────────────────────────────── */
function checkStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

/* ────────────────────────────────────────────────────────
   VALIDATE REGISTER FORM
──────────────────────────────────────────────────────── */
function validateRegister(form) {
  let valid = true;

  // Required fields
  form.querySelectorAll('[required]').forEach(field => {
    const empty = !field.value.trim();

    field.closest('.form-group')?.classList.toggle(
      'error',
      empty
    );

    if (empty) valid = false;
  });

  // Password match
  const password = document.getElementById('reg-password');
  const confirm  = document.getElementById('reg-confirm-password');

  if (password && confirm) {
    const matched = password.value === confirm.value;

    confirm.closest('.form-group')?.classList.toggle(
      'error',
      !matched
    );

    if (!matched) {
      showToast('Passwords do not match.', 'error');
      valid = false;
    }
  }

  return valid;
}

/* ────────────────────────────────────────────────────────
   PASSWORD TOGGLE
──────────────────────────────────────────────────────── */
function initPasswordToggle() {
  document.querySelectorAll('.pass-toggle').forEach(btn => {

    btn.addEventListener('click', function () {

      const input = this.parentElement.querySelector('input');

      const isHidden = input.type === 'password';

      input.type = isHidden ? 'text' : 'password';

      this.querySelector('i').className =
        `fas fa-eye${isHidden ? '-slash' : ''}`;
    });

  });
}

/* ────────────────────────────────────────────────────────
   LOGIN
──────────────────────────────────────────────────────── */
function initLogin() {

  const form = document.getElementById('login-form');

  if (!form) return;

  const emailInp = document.getElementById('login-email');
  const passInp  = document.getElementById('login-password');

  form.addEventListener('submit', async function (e) {

    e.preventDefault();

    const submitBtn = this.querySelector('[type="submit"]');

    submitBtn.disabled = true;

    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i><span>Signing In...</span>';

    try {

      const payload = {
        email: emailInp.value.trim(),
        password: passInp.value
      };

      const data = await API.post(
        '/auth/login/',
        payload
      );

      // Save JWT
      Auth.setTokens(data.access, data.refresh);

      // Save user
      Auth.setUser(data.user);

      showToast('Login successful!', 'success');

      // Redirect by role
      if (data.user?.role === 'moderator') {

        window.location.href =
          '/moderator-dashboard.html';

      } else {

        window.location.href =
          '/dashboard.html';
      }
      console.log('Login response:', data);

    } catch (err) {

      console.error(err);

      let message = 'Login failed.';

      try {
        const parsed = JSON.parse(err.message);

        message =
          parsed.detail ||
          parsed.error ||
          'Invalid credentials';

      } catch (_) {}

      showToast(message, 'error');

    } finally {

      submitBtn.disabled = false;

      submitBtn.innerHTML =
        '<i class="fas fa-sign-in-alt"></i><span>Sign In</span>';
    }

  });
}

/* ────────────────────────────────────────────────────────
   REGISTER
──────────────────────────────────────────────────────── */
function initRegister() {

  const form = document.getElementById('register-form');

  if (!form) return;

  /* ── Photo Preview ─────────────────── */
  const photoInput   = document.getElementById('photo-input');
  const photoPreview = document.getElementById('photo-preview');

  if (photoInput && photoPreview) {

    photoInput.addEventListener('change', function () {

      const file = this.files[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = (e) => {

        photoPreview.src = e.target.result;

        photoPreview.style.display = 'block';
      };

      reader.readAsDataURL(file);
    });
  }

  /* ── Upload Area ───────────────────── */
  const uploadArea = document.getElementById('upload-area');

  if (uploadArea && photoInput) {

    uploadArea.addEventListener('click', () => {
      photoInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {

      e.preventDefault();

      uploadArea.style.borderColor = '#C0162C';
    });

    uploadArea.addEventListener('dragleave', () => {

      uploadArea.style.borderColor = '';
    });

    uploadArea.addEventListener('drop', (e) => {

      e.preventDefault();

      uploadArea.style.borderColor = '';

      const file = e.dataTransfer.files[0];

      if (file) {

        photoInput.files = e.dataTransfer.files;

        photoInput.dispatchEvent(
          new Event('change')
        );
      }
    });
  }

  /* ── Password Strength ─────────────── */
  const passInput   = document.getElementById('reg-password');
  const strengthBar = document.getElementById('pass-strength');

  if (passInput && strengthBar) {

    passInput.addEventListener('input', function () {

      const strength = checkStrength(this.value);

      const colors = [
        '',
        '#ef4444',
        '#f59e0b',
        '#22c55e',
        '#16a34a'
      ];

      const labels = [
        '',
        'Weak',
        'Fair',
        'Good',
        'Strong'
      ];

      strengthBar.style.width =
        (strength * 25) + '%';

      strengthBar.style.background =
        colors[strength];

      const label = document.getElementById(
        'pass-strength-label'
      );

      if (label) {
        label.textContent = labels[strength];
      }
    });
  }

  /* ── Confirm Password Validation ───── */
  const confirmPass = document.getElementById(
    'reg-confirm-password'
  );

  if (confirmPass && passInput) {

    confirmPass.addEventListener('input', function () {

      const matched =
        this.value === passInput.value;

      this.closest('.form-group')?.classList.toggle(
        'error',
        !matched && this.value.length > 0
      );
    });
  }

  /* ── Submit ────────────────────────── */
  form.addEventListener('submit', async function (e) {

    e.preventDefault();

    const submitBtn =
      this.querySelector('[type="submit"]');

    // Validate
    if (!validateRegister(this)) {

      showToast(
        'Please fill all required fields correctly.',
        'error'
      );

      return;
    }

    submitBtn.disabled = true;

    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i><span>Creating Account...</span>';

    try {

      // IMPORTANT: FormData for image upload
      const formData = new FormData(this);

      const data = await API.post(
        '/auth/register/',
        formData
      );

      // Save JWT
      Auth.setTokens(data.access, data.refresh);

      // Save user
      Auth.setUser(data.user);

      showToast(
        'Account created successfully!',
        'success'
      );

      window.location.href =
        '/dashboard.html';

    } catch (err) {

      console.error(err);

      let message = 'Registration failed.';

      try {

        const parsed = JSON.parse(err.message);

        if (parsed.detail) {

          message = parsed.detail;

        } else {

          const firstKey =
            Object.keys(parsed)[0];

          if (firstKey) {
            message =
              `${firstKey}: ${parsed[firstKey]}`;
          }
        }

      } catch (_) {}

      showToast(message, 'error');

    } finally {

      submitBtn.disabled = false;

      submitBtn.innerHTML =
        '<i class="fas fa-user-plus"></i><span>Create Account</span>';
    }

  });
}

/* ────────────────────────────────────────────────────────
   INIT
──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  initPasswordToggle();

  initLogin();

  initRegister();
});