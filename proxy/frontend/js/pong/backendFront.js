// Fetch all matches from the backend
import { authService, tokenService } from "../services/authService.js";
export async function fetchMatches() {
	try {
		const response = await fetch(`/api/tournament/users/`, {
			method: 'GET',
			headers: {
				'Content-type' : 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			}
		});
		// console.log("Fetch Response:", response);
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to fetch matches.');
		}
		const matches = await response.json();
		// console.log('Fetched Matches:', matches);
		return matches;
	} catch (error) {
		console.log('Error fetching matches:', error);
		alert(`Error fetching matches: ${error.message}`);
		return [];
	}
}

// Save users to the backend
export async function saveUsers(names, afterSaveCallback) {
	try {
		// console.log("Saving Users:", names);
		const response = await fetch(`/api/tournament/users/save/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			},
			body: JSON.stringify({ names }),
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to save users.');
		}
		// console.log('Users saved successfully!');

		// HIDE tournament button & setup form after saving
		const startTournamentBtn = document.getElementById('startTournamentButton');
		if (startTournamentBtn) startTournamentBtn.style.display = 'none';
		const setupForm = document.getElementById('tournamentSetup');
		if (setupForm) setupForm.style.display = 'none';

		if (afterSaveCallback) afterSaveCallback();
	} catch (error) {
		console.log('Error saving users:', error);
		alert(`Failed to save users: ${error.message}`);
	}
}

// Delete a user (loser) from the backend
export async function deleteUser(loserName) {
	try {
		const response = await fetch(`/api/tournament/users/delete/`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			},
			body: JSON.stringify({ names: [loserName] }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to delete user.');
		}

		const remainingUsers = await response.json();
		// console.log('Remaining Users:', remainingUsers);
	} catch (error) {
		console.log('Error deleting user:', error);
		alert(`Failed to delete user: ${error.message}`);
	}
}

export async function deleteAllUsers() {
	try {
		const response = await fetch(`/api/tournament/users/delete_all/`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			},
		});
		if (!response.ok) {
			let errorData;
            try {
                errorData = await response.json();
            } catch (jsonError) {
                throw new Error('Failed to cleanup invalid tournaments. Server returned non-JSON response.');
            }
            throw new Error(errorData.error || 'Failed to cleanup invalid tournaments.');
        }
		// console.log('All users were deleted successfully.');
		// Return a success flag
		return true;
	} catch (error) {
		console.log('Error deleting all users:', error);
		// alert(`Failed to delete all users: ${error.message}`);
		return false;
	}
}

export async function fetchAllUsers() {
	try {
		const response = await fetch(`/api/tournament/users/list/`, {
			method  : 'GET',
			headers : {
					'Content-type' : 'application/json',
					'Authorization': `Bearer ${tokenService.getAccessToken()}`
			},
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to fetch all users.');
		}
		const users = await response.json();
		// console.log('Fetched All Users:', users);
		return users;
	} catch (error) {
		console.log('Error fetching all users:', error);
		alert(`Error fetching all users: ${error.message}`);
		return [];
	}
}
