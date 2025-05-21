import { showAlert } from '../alert.js';
import { userService } from "../../services/userService.js";
import { tokenService } from "../../services/authService.js";

export const DeleteAccountSection = {
	createDeleteAccountSection(userData) {
		return `
			<div class="delete-account-card">
                <div class="card">
                    <div class="card-body">
                        <h3 class="card-title mb-4">Delete Account</h3>
                        <p>Once you delete your account, there is no going back. Please be certain.</p>
                        <button type="button" class="btn w-100 mt-4 mb-4" id="deleteAccount" data-bs-toggle="modal" data-bs-target="#deleteAccountModal">Delete Account</button>
                    </div>
                </div>
            </div>

            <div class="modal fade" id="deleteAccountModal" tabindex="-1" aria-labelledby="deleteAccountModalLabel">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="deleteAccountModalLabel">Delete Account</h5>
                            <i class="bi bi-x-lg" data-bs-dismiss="modal" aria-label="Close"></i>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                            ${!userData.has_oauth ? `
                                <div class="form-group">
                                    <label for="deleteConfirmPassword">Enter your password to confirm:</label>
                                    <input type="password" class="form-control" id="deleteConfirmPassword" required>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="confirmDelete">Delete Account</button>
                        </div>
                    </div>
                </div>
            </div>
		`;
	},

	setupEventListeners(userData) {
		// Profile form submission
		document.getElementById('confirmDelete').addEventListener('click', () => this.handleDeleteAccount(userData));
	},

	handleDeleteAccount: async function(userData) {
		try {
            const headers = {
                'Authorization': `Bearer ${tokenService.getAccessToken()}`
            };

            // If not OAuth user, include password
            if (!userData.has_oauth) {
                const password = document.getElementById('deleteConfirmPassword').value;
                if (!password) {
                    showAlert('Password is required', 'danger');
                    return;
                }
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch('/api/user/deleteuser/', {
                method: 'POST',
                headers: headers,
                body: !userData.has_oauth ? JSON.stringify({
                    password: document.getElementById('deleteConfirmPassword').value
                }) : undefined,
                credentials: 'include'
            });

            if (response.ok) {
                tokenService.removeTokens();
                userService.clearUserData();
                window.location.replace('/login');
            } else {
                const error = await response.json();
                showAlert(error.error || 'Failed to delete account', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.error || 'Failed to delete account', 'danger');
        }
	},
};
