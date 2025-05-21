import { authService } from "../services/authService.js";
import { navigateTo } from "../router.js";
import { showAlert } from "../components/alert.js";

export async function renderLogoutPage() {
    const root = document.getElementById("root");
    root.innerHTML = ""; // Clear previous content

    // Show loading screen
    root.innerHTML = `
        <div id="pong-container">
            <h1>Good Bye!</h1>
            <p>Logging out...</p>
            <div class="loading-animation">
                <div class="spinner"></div>
            </div>
            <style>
                .loading-animation {
                    display: flex;
                    justify-content: center;
                    margin: 20px;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #000;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </div>
    `;

    // Attempt to logout
    try {
        const success = await authService.logout();
        if (success) {
            setTimeout(() => {
                navigateTo('/login');
            }, 1000); // Give user time to see goodbye message
        }
		else {
			console.error('Logout failed. Refreshing page...');
            showAlert('Failed to logout. Please try again.');
		}
    } catch (error) {
        showAlert('Failed to logout. Please try again.');
        console.error('Logout error:', error);
        root.innerHTML = `
            <div id="pong-container">
                <h1>Error!</h1>
                <p>Failed to logout. Please try again.</p>
                <button onclick="window.history.back()" class="btn btn-primary">Go Back</button>
            </div>
        `;
    }
}
