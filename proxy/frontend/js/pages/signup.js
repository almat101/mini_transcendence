import { showAlert } from '../components/alert.js';
import { authService } from '../services/authService.js';
import { EmailVerification } from '../components/emailVerification.js';

export function renderSignupPage() {
  const root = document.getElementById("root");
  root.innerHTML = ""; // Clear previous content

   // Add required CSS
  const style = document.createElement('style');
  style.textContent = `
    .cascading-right {
      margin-right: -50px;
    }
    @media (max-width: 991.98px) {
      .cascading-right {
        margin-right: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Add login form
  const section = document.createElement('section');
  section.className = 'text-center text-lg-start';

  // Create container structure
  const container = `
    <div class="container py-4 align-items-center">
      <div class="row g-0 align-items-center justify-content-center">
        <div class="col-lg-6 mb-5 mb-lg-0">
          <div class="card cascading-right bg-body-tertiary text-center" style="backdrop-filter: blur(30px);"  id="login-card">
            <div class="card-body p-5 shadow-10 text-center">
              <h2 class="fw-bold mb-5">Sign up now</h2>
              <form id="login-form">
                <div class="form-outline mb-4">
                  <label class="form-label" for="username">Username</label>
                  <input type="text" id="username" class="form-control" required autocomplete="username"/>
                </div>

                <div class="form-outline mb-4">
                  <label class="form-label" for="email">Email address</label>
                  <input type="email" id="email" class="form-control" required autocomplete="email"/>
                </div>

                <div class="form-outline mb-4">
                  <label class="form-label" for="password">Password</label>
                  <input type="password" id="password" class="form-control" required autocomplete="new-password"/>
                </div>

                <div class="form-outline mb-4">
                  <label class="form-label" for="confirm-password">Confirm Password</label>
                  <input type="password" id="confirm-password" class="form-control" required autocomplete="new-password"/>
                </div>

                <button id="signupbutt" type="submit" class="btn btn-primary btn-block mb-4">
                  <span class="spinner-border spinner-border-sm d-none" id="subSpinner" role="status" aria-hidden="true"></span>
                  Signup
                </button>

              </form>
            </div>
            <p>Already have an account? <a href="/login" class="fw-bold">Login</a></p>
            <p class="mb-5">Need to verify your email? <a onclick="verifyEmail()" class="fw-bold">Send Email</a></p>
          </div>
        </div>
        <div class="col-lg-6 mb-5 mb-lg-0 d-none d-lg-block">
          <img src="/assets/846-02793586en_Masterfile.jpg" class="w-100 rounded-4 shadow-4" alt="Login background" />
        </div>
      </div>
    </div>
  `;

  section.innerHTML = container;
  root.appendChild(section);


  // Add form submission handler
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm-password').value;

    // Frontend validation
    if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      showAlert("Username must be 3-20 characters long and contain only letters, numbers, and underscores");
      return;
    }

    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      showAlert("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      showAlert("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirm_password) {
      showAlert("Passwords do not match");
      return;
    }

    // Show loading state
    const submitBtn = document.getElementById('signupbutt');
    const spinner = document.getElementById('subSpinner');

    submitBtn.disabled = true;
    spinner.classList.remove('d-none');

    try {
      const response = await fetch('/api/user/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password,
          confirm_password
        })
     });

      const data = await response.json();

      if (response.ok) {
        showAlert('Account created! Please verify your email.', 'success');
        setTimeout(() => {
          EmailVerification.showOTPVerificationModal(email);
        }, 500);
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
      } else {
        // Handle different error cases
        submitBtn.disabled = false;
        spinner.classList.add('d-none');

        if (data.username) {
          showAlert(data.username);
        } else if (data.email) {
          showAlert(data.email);
        } else if (data.password) {
          showAlert(data.password);
        } else if (data.confirm_password) {
          showAlert(data.confirm_password);
        }
        else {
          showAlert(data.error || 'Signup failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error:', error);

      submitBtn.disabled = false;
      spinner.classList.add('d-none');

      showAlert('Something went wrong. Please try again later.', 'danger');
    }
  });
}
