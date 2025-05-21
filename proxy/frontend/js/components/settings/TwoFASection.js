import { showAlert } from '../alert.js';
import { tokenService } from "../../services/authService.js";
import { TwoFASetup } from '../TwoFA.js';

export const TwoFASection = {
	createTwoFASection(userData) {
		return `
			<div class="twofa-card">
				<div class="card">
					<div class="card-body">
						<h3 class="card-title mb-4">Two-Factor Authentication</h3>
						${userData.has_2fa ?
							`<div class="alert alert-success">
								<i class="bi bi-shield-check me-2"></i> Two-factor authentication is enabled
							</div>
							<button id="disable2fa" class="btn btn-danger w-100 mt-3" data-bs-toggle="modal" data-bs-target="#disable2faModal">Disable Two-Factor Authentication</button>`
							:
							`<p>Protect your account with two-factor authentication. When enabled, you'll need to enter a code from your authentication app when signing in.</p>
							<button id="setup2fa" class="btn btn-primary w-100 mt-3">Enable Two-Factor Authentication</button>`
						}
					</div>
				</div>
			</div>

			<div class="modal fade" id="disable2faModal" tabindex="-1" aria-labelledby="disable2faModalLabel">
				<div class="modal-dialog modal-dialog-centered">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title" id="disable2faModalLabel">Disable Two-Factor Authentication</h5>
							<i class="bi bi-x-lg" data-bs-dismiss="modal"></i>
						</div>
						<div class="modal-body">
							<p>Please enter your authentication code to disable 2FA:</p>
							<div class="form-group">
								<label for="deleteConfirmPassword">Authentication code</label>
								<input type="text" class="form-control" id="disableToken" required>
							</div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
							<button type="button" class="btn btn-danger" id="confirmDisable2fa">Disable 2FA</button>
						</div>
					</div>
				</div>
			</div>
		`;
	},

	setupEventListeners(userData) {
		if (userData.has_2fa) {
			document.getElementById('confirmDisable2fa').addEventListener('click', () => this.handleDisable2FA());
		} else {
			document.getElementById('setup2fa').addEventListener('click', () => this.handleSetup2FA());
		}
	},

	handleSetup2FA: function() {
		TwoFASetup.show();
	},

	handleDisable2FA: async function() {
		try {
			const token = document.getElementById('disableToken').value;
			if (!token) {
				showAlert('Authentication code is required', 'danger');
				return
			}

			const response = await fetch('/api/auth/2fa/disable/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${tokenService.getAccessToken()}`
				},
				body: JSON.stringify({ token })
			});

			if (response.ok) {
				showAlert('Two-factor authentication has been disabled', 'success');
				window.location.reload();
			} else {
				const data = await response.json();
				showAlert(data.error || 'Failed to disable 2FA', 'danger');
			}
		} catch (error) {
			console.error('Error:', error);
			showAlert('Failed to disable 2FA', 'danger');
		}
	}
};
