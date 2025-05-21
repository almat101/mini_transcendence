import { tokenService } from "../services/authService.js";
import { Navbar } from "../components/navbar.js";
import { showAlert } from '../components/alert.js';
import { ProfileSection } from '../components/settings/ProfileSection.js';
import { PasswordSection } from '../components/settings/PasswordSection.js';
import { TwoFASection } from '../components/settings/TwoFASection.js';
import { DeleteAccountSection } from '../components/settings/DeleteAccountSection.js';


export async function renderSettingsPage() {
    let userData;

    try {
        const response = await fetch('/api/user/getuserinfo/', {
            headers: {
                'Authorization': `Bearer ${tokenService.getAccessToken()}`
            }
        });
        userData = await response.json();
    } catch (error) {
        console.error('Error fetching user data:', error);
        showAlert('Failed to fetch user data', 'danger');
    }

    const root = document.getElementById("root");
    root.innerHTML = "";

    const navbar = Navbar();
    root.appendChild(navbar);

    const section = document.createElement('section');
    section.className = 'text-lg-start';

    const settingsSection = `
        <div class="container align-items-center">
            <div id="settingsSection">
                ${ProfileSection.createProfileSection(userData)}
                ${PasswordSection.createPasswordSection()}
                ${TwoFASection.createTwoFASection(userData)}
                ${DeleteAccountSection.createDeleteAccountSection(userData)}
            </div>
        </div>
    `;

    section.innerHTML += settingsSection;
    root.appendChild(section);

    /* Listeners */
    ProfileSection.setupEventListeners(userData);
    PasswordSection.setupEventListeners();
    TwoFASection.setupEventListeners(userData);
    DeleteAccountSection.setupEventListeners(userData);
}
