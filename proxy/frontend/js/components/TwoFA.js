import { authService, tokenService } from "../services/authService.js";
import { showAlert } from './alert.js';

export const TwoFASetup = {
    show: async function() {
        try {
            const response = await fetch('/api/auth/2fa/setup/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenService.getAccessToken()}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                showAlert(error.error || 'Failed to setup 2FA', 'danger');
                return;
            }

            const data = await response.json();

            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'setup2faModal';
            modal.setAttribute('tabindex', '-1');

            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Setup Two-Factor Authentication</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6 text-center">
                                    <h6>1. Scan this QR code with your authenticator app</h6>
                                    <div class="qr-container my-3">
                                        <img src="${data.qr_code}" alt="QR Code" class="img-fluid">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6>2. Or enter this code manually into your app:</h6>
                                    <div class="secret-key my-3 p-2 bg-light text-center">
                                        <code>${data.secret}</code>
                                    </div>
                                    <h6 class="mt-4">3. Enter the verification code from your app:</h6>
                                    <div class="form-group my-3">
                                        <input type="text" class="form-control" id="verificationCode" placeholder="Enter 6-digit code">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="verify2faSetup">Verify & Activate</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            const modalInstance = new bootstrap.Modal(document.getElementById('setup2faModal'));

            modal.addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(modal);
            });

            modalInstance.show();

            document.getElementById('verify2faSetup').addEventListener('click', async () => {
                const token = document.getElementById('verificationCode').value;

                if (!token || token.length !== 6) {
                    showAlert('Please enter a valid 6-digit verification code', 'warning');
                    return;
                }

                try {
                    const verifyResponse = await fetch('/api/auth/2fa/verify-setup/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${tokenService.getAccessToken()}`
                        },
                        body: JSON.stringify({ token })
                    });

                    if (verifyResponse.ok) {
                        showAlert('Two-factor authentication has been enabled successfully', 'success');
                        modalInstance.hide();
                        // Refresh page to update UI
                        window.location.reload();
                    } else {
                        const error = await verifyResponse.json();
                        showAlert(error.error || 'Verification failed', 'danger');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showAlert('Failed to verify 2FA setup', 'danger');
                }
            });
        } catch (error) {
            console.error('Error:', error);
            showAlert('Failed to initialize 2FA setup', 'danger');
        }
    }
};

export const TwoFAVerify = {
    show: function(userId) {
        return new Promise((resolve, reject) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'verify2faLoginModal';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('data-backdrop', 'static');
            modal.setAttribute('data-keyboard', 'false');

            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Two-Factor Authentication</h5>
                        </div>
                        <div class="modal-body">
                            <p>Enter the 6-digit verification code from your authenticator app:</p>
                            <div class="form-group mb-3">
                                <input type="text" class="form-control" id="loginVerificationCode" placeholder="Enter 6-digit code">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="verify2faLogin">Verify & Login</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            const modalInstance = new bootstrap.Modal(document.getElementById('verify2faLoginModal'), {
                backdrop: 'static',
                keyboard: false
            });
            modalInstance.show();

            // Add verification handler
            document.getElementById('verify2faLogin').addEventListener('click', async () => {
                const token = document.getElementById('loginVerificationCode').value;

                if (!token || token.length !== 6) {
                    showAlert('Please enter a valid 6-digit verification code', 'warning');
                    return;
                }

                try {
                    const response = await fetch('/api/auth/2fa/verify-login/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ token, user_id: userId })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        tokenService.setAccessToken(data.access);

                        // Fetch user data
                        await authService.fetchAndStoreUserData();

                        modalInstance.hide();

                        showAlert('Login successful', 'success');
                        resolve({ success: true });
                    } else {
                        showAlert(data.error || 'Verification failed', 'danger');
                    }
                } catch (error) {
                    console.error('2FA verification error:', error);
                    showAlert('Failed to verify login', 'danger');
                    reject(error);
                }
            });

            // Handle modal close/dismiss
            modalInstance._element.addEventListener('hidden.bs.modal', () => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                    resolve({ success: false, error: 'Authentication cancelled' });
                }
            });
        });
    }
};
