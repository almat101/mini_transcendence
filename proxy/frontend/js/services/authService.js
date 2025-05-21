import { showAlert } from '../components/alert.js';
import { TwoFAVerify } from '../components/TwoFA.js';
import { userService } from './userService.js';

export const authService = {
	async logout() {
		try {
			const token = tokenService.getAccessToken();
			const response = await fetch('/api/auth/logout/', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
				credentials: 'include'
			});

			if (response.ok) {
				tokenService.removeTokens();
				userService.clearUserData();
				return true;
			}
			return false;
		} catch (error) {
			console.error('Logout failed:', error);
			return false;
		}
	},

	async login(username_or_email, password) {
		try {
			const response = await fetch('/api/auth/login/', {
				method: 'POST',
				headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
				},
				body: JSON.stringify({
					username_or_email,
					password
				}),
				credentials: 'include'
			});

			const data = await response.json();

			if (response.ok) {
				if (data.requires_2fa) {
					// Handle 2FA verification
					try {
						const result = await TwoFAVerify.show(data.user_id);
						if (result.success) {
							return { success: true };
						} else {
							return { success: false, error: result.error || 'Verification failed' };
						}
					} catch (error) {
						console.error('2FA error:', error);
						return { success: false, error: 'Authentication failed' };
					}
				} else {
					tokenService.setAccessToken(data.access);
					await this.fetchAndStoreUserData();
					showAlert('Login successful', 'success');
					return { success: true };
				}
			}

			showAlert(data.error);
			return { success: false, error: data.error };

		} catch (error) {
			showAlert('Failed to login. Please try again.', 'danger');
			return { success: false, error: error.message };
		}
	},

	async fetchAndStoreUserData() {
        try {
            const response = await fetch('/api/user/getuserinfo/', {
                headers: {
                    'Authorization': `Bearer ${tokenService.getAccessToken()}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                userService.setUserData(userData);
                return userData;
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
        return null;
    }
};

export const tokenService = {
	setAccessToken(token) {
		localStorage.setItem('access_token', token);
	},

	getAccessToken() {
		return localStorage.getItem('access_token');
	},

	removeTokens() {
		localStorage.removeItem('access_token');
		//remove cookie

	},

	async validateToken() {
	  const token = this.getAccessToken();
	  if (!token) return false;

	  try {
		  const response = await fetch('/api/auth/validate/', {
			  headers: {
				  'Authorization': `Bearer ${token}`,
				  'Content-Type': 'application/json'
			  },
			  credentials: 'include'
		  });

		  if (response.ok) return true;

		  const refreshResponse = await fetch('/api/auth/refresh/', {
			  method: 'POST',
			  credentials: 'include'
		  });

		  if (refreshResponse.ok) {
			  const data = await refreshResponse.json();
			  this.setAccessToken(data.access);
			  return true;
		  }

		  this.removeTokens();
		  return false;
	  } catch (error) {
		  console.error('Auth validation error:', error);
		  this.removeTokens();
		  return false;
	  }
	}
  };
