import { showAlert } from './alert.js';

export const EmailVerification = {
    showEmailVerificationModal: function() {
        // First remove any existing modals
        const existingModal = document.getElementById('emailVerificationModal');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'emailVerificationModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Verify Your Email</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Please enter your email address to receive a verification code:</p>
                        <form id="emailVerificationForm">
                            <div class="form-group mb-3">
                                <label for="verificationEmail">Email address</label>
                                <input type="email" class="form-control" id="verificationEmail" required>
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary" id="sendEmailBtn">
                                    <span class="spinner-border spinner-border-sm d-none" id="emailSpinner" role="status" aria-hidden="true"></span>
                                    <span id="emailBtnText">Send Verification Code</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(document.getElementById('emailVerificationModal'));

        // Clean up modal when hidden
        modal.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modal);
        });

        // Add event listener for form submission
        const form = document.getElementById('emailVerificationForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('verificationEmail').value;

            // Show loading state
            const submitBtn = document.getElementById('sendEmailBtn');
            const spinner = document.getElementById('emailSpinner');
            const btnText = document.getElementById('emailBtnText');

            submitBtn.disabled = true;
            spinner.classList.remove('d-none');
            btnText.textContent = 'Sending...';

            try {
                const response = await fetch('/api/user/resend-email-verification/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Verification email sent successfully!', 'success');
                    modalInstance.hide();

                    // Show OTP modal after a short delay
                    setTimeout(() => {
                        this.showOTPVerificationModal(email);
                    }, 300);
                } else {
                    // Reset loading state
                    submitBtn.disabled = false;
                    spinner.classList.add('d-none');
                    btnText.textContent = 'Send Verification Code';

                    showAlert(data.error || 'Failed to send verification email', 'danger');
                }
            } catch (error) {
                console.error('Error:', error);

                // Reset loading state
                submitBtn.disabled = false;
                spinner.classList.add('d-none');
                btnText.textContent = 'Send Verification Code';

                showAlert('Failed to send verification email', 'danger');
            }
        });

        modalInstance.show();
    },

    showOTPVerificationModal: function(email) {
        // First remove any existing modals
        const existingModal = document.getElementById('otpVerificationModal');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'otpVerificationModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Enter Verification Code</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>We've sent a verification code to ${email}. Please enter it below:</p>
                        <form id="otpVerificationForm">
                            <div class="form-group mb-3">
                                <label for="otpCode">Verification Code</label>
                                <input type="text" class="form-control" id="otpCode" placeholder="Enter 6-digit code" required>
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary" id="verifyOtpBtn">
                                    <span class="spinner-border spinner-border-sm d-none" id="otpSpinner" role="status" aria-hidden="true"></span>
                                    <span id="otpBtnText">Verify Email</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(document.getElementById('otpVerificationModal'));

        // Clean up modal when hidden
        modal.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modal);
        });

        // Add event listener for form submission
        const form = document.getElementById('otpVerificationForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const otpCode = document.getElementById('otpCode').value;

            // Show loading state
            const submitBtn = document.getElementById('verifyOtpBtn');
            const spinner = document.getElementById('otpSpinner');
            const btnText = document.getElementById('otpBtnText');

            submitBtn.disabled = true;
            spinner.classList.remove('d-none');
            btnText.textContent = 'Verifying...';

            try {
                const response = await fetch('/api/user/verify-email/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email_otp: otpCode })
                });

                const data = await response.json();

                if (response.ok) {
                    showAlert('Email verified successfully! You can now log in.', 'success');
                    modalInstance.hide();
                    window.location.href = '/login';
                } else {
                    // Reset loading state
                    submitBtn.disabled = false;
                    spinner.classList.add('d-none');
                    btnText.textContent = 'Verify Email';

                    showAlert(data.error || 'Invalid verification code', 'danger');
                }
            } catch (error) {
                console.error('Error:', error);

                // Reset loading state
                submitBtn.disabled = false;
                spinner.classList.add('d-none');
                btnText.textContent = 'Verify Email';

                showAlert('Failed to verify email', 'danger');
            }
        });

        modalInstance.show();
    }
};
