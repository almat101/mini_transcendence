import { showAlert } from '../alert.js';
import { tokenService } from "../../services/authService.js";

export const PasswordSection = {
	createPasswordSection() {
		return `
			<div class="password-card">
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Change Password</h3>
                            <form id="passwordForm">
                                <div class="mb-3">
                                    <label for="currentPassword" class="form-label">Current Password</label>
                                    <input type="password" class="form-control" id="currentPassword" required>
                                </div>

                                <div class="mb-3">
                                    <label for="newPassword" class="form-label">New Password</label>
                                    <input type="password" class="form-control" id="newPassword" required>
                                </div>

                                <div class="mb-3">
                                    <label for="confirmPassword" class="form-label">Re-type New Password</label>
                                    <input type="password" class="form-control" id="confirmPassword" required>
                                </div>

                                <button type="submit" class="btn btn-primary w-100  mt-4 mb-4">Update Password</button>
                            </form>
                        </div>
                    </div>
                </div>
		`;
	},

	setupEventListeners() {
        document.getElementById('passwordForm').addEventListener('submit', this.handlePasswordSubmit);
    },

	handlePasswordSubmit: async function(event) {
		event.preventDefault();

        try {
            if (document.getElementById('confirmPassword').value !== document.getElementById('newPassword').value) {
                showAlert('Passwords do not match');
                return;
            }
            const response = await fetch('/api/user/password-reset/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenService.getAccessToken()}`
                },
                body: JSON.stringify({
                    old_password: document.getElementById('currentPassword').value,
                    new_password: document.getElementById('newPassword').value,
                    confirm_password: document.getElementById('confirmPassword').value
                })
            });

            if (response.ok) {
                showAlert('Password updated successfully', 'success');
				document.getElementById('passwordForm').reset();
            } else {
                const error = await response.json();
                showAlert(error.error || 'Failed to update password', 'danger');
				document.getElementById('passwordForm').reset();
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.error || 'Failed to update password', 'danger');
        }
    }
};
