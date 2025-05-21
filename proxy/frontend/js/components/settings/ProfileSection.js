import { showAlert } from '../alert.js';
import { userService } from "../../services/userService.js";
import { tokenService } from "../../services/authService.js";

export const ProfileSection = {
	createProfileSection(userData) {
		return `
			<div class="profile-card">
                    <div class="card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between">
                                <h3 class="card-title mb-4">Profile Settings</h3>
                                <a">Member since: ${new Date(userData.created_at).toLocaleDateString()}</a>
                            </div>
                            <div class="text-center mb-4">
                                <div id="avatarContainer" style="position: relative; width: 100px; height: 100px; margin: 0 auto;">
                                    <div id="avatarPreview" style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto; overflow: hidden; cursor: pointer;">
                                        ${userData.avatar ? `<img src="${userData.avatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${userData.username}'s avatar">` : ''}
                                    </div>
                                    <div id="avatarOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background: rgba(0,0,0,0.5); color: white; display: none; justify-content: center; align-items: center; cursor: pointer;">
                                        <i class="bi bi-camera-fill"></i>
                                    </div>
                                    <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                                </div>
                            </div>

                            <form id="profileForm" class="flex-grow-1 d-flex flex-column">
                                <div class="mb-3">
                                    <label for="username" class="form-label">Username</label>
                                    <input type="text" class="form-control" id="username" value="${userData.username || ''}" autocomplete="username" required>
                                </div>

                                <div class="mb-3">
                                    <label for="email"  class="form-label">Email</label>
                                    <input type="email" class="form-control" id="email" value="${userData.email || ''}" autocomplete="email" required>
                                </div>

                                <div class="mb-3">
                                    <label for="bio" class="form-label">Bio</label>
                                    <input type="bio" class="form-control" id="bio" value="${userData.bio || ''}" autocomplete="none">
                                </div>

                                <button type="submit" class="btn btn-primary w-100 mt-4 mb-4">Update Profile</button>
                            </form>
                        </div>
                    </div>
                </div>
		`;
	},

	setupEventListeners(userData) {
        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', this.handleProfileSubmit);

        // Avatar upload handling
        this.setupAvatarHandlers(userData);
    },

	handleProfileSubmit: async function(event) {
        event.preventDefault();

        try {
            const response = await fetch('/api/user/updateuser/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenService.getAccessToken()}`
                },
                body: JSON.stringify({
                    username: document.getElementById('username').value,
                    email: document.getElementById('email').value,
                    bio: document.getElementById('bio').value
                })
            });

            if (response.ok) {
                // Update stored user data
                userService.updateUserData({
                    username: document.getElementById('username').value,
                    email: document.getElementById('email').value,
                    bio: document.getElementById('bio').value
                });

                showAlert('Profile updated successfully', 'success');
            } else {
                const error = await response.json();
                showAlert(error.error || 'Failed to update profile', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Failed to update profile', 'danger');
        }
    },

	setupAvatarHandlers: function(userData) {
		const avatarPreview = document.getElementById('avatarPreview');
		const avatarOverlay = document.getElementById('avatarOverlay');
		const avatarInput = document.getElementById('avatarInput');
		const avatarContainer = document.getElementById('avatarContainer');

		// Show overlay on hover
		avatarContainer.addEventListener('mouseenter', () => {
			avatarOverlay.style.display = 'flex';
		});

		avatarContainer.addEventListener('mouseleave', () => {
			avatarOverlay.style.display = 'none';
		});

		// Trigger file input on click
		avatarContainer.addEventListener('click', () => {
			avatarInput.click();
		});

		// Handle file selection
		avatarInput.addEventListener('change', async (event) => {
			event.preventDefault();

			if (!event.target.files.length) return;

			const file = event.target.files[0];

			// Validate file type
			if (!file.type.match('image.*')) {
				showAlert('Please select an image file', 'warning');
				return;
			}

			// Validate file size (5MB max)
			if (file.size > 5 * 1024 * 1024) {
				showAlert('File size cannot exceed 5MB', 'warning');
				return;
			}

			try {
				// Show loading indicator
				avatarPreview.innerHTML = '<div class="spinner-border text-light" style="margin: 30px auto;"></div>';
				avatarOverlay.style.display = 'none';

				const formData = new FormData();
				formData.append('avatar', file);

				const response = await fetch('/api/user/updateavatar/', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${tokenService.getAccessToken()}`
					},
					body: formData
				});

				const data = await response.json();

				if (response.ok) {
					// Update the avatar preview
					userData.avatar = data.avatar; // Update the stored user data
					userService.updateUserData({ avatar: data.avatar });
					avatarPreview.innerHTML = `<img src="${data.avatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${userData.username}'s avatar">`;
					showAlert('Avatar updated successfully', 'success');
				} else {
					throw new Error(data.error || 'Failed to update avatar');
				}
			} catch (error) {
				console.error('Error updating avatar:', error);
				showAlert(error.message, 'danger');
				if (!userData.avatar) avatarPreview.innerHTML = '';
			}
		});
	}
};
