import { tokenService } from '../services/authService.js';

export async function create_local_game(payload) {
	try {
		const response = await fetch('/api/history/match/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (jsonError) {
				throw new Error('Failed to save local game data. Server returned non-JSON response.');
			}
			throw new Error(errorData.error || 'Failed to save local game data.');
		}
		// alert('Local match data saved successfully!');
	} catch (error) {
		console.log("Error saving Local game data.", error);
		alert('Cannot create local match!')
	}
};


export async function create_tournament_game(payload) {
	try {
		const response = await fetch('/api/history/tournament/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (jsonError) {
				throw new Error('Failed to save tournament game data. Server returned non-JSON response.');
			}
			throw new Error(errorData.error || 'Failed to save tournament game data.');
		}
		// alert('Tournament data saved successfully!');
	} catch (error) {
		console.log("Error saving tournament game data.", error);
	}
};



export async function get_local_matches() {
	try {
		const response = await fetch('/api/history/match/', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			}
		});
		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (jsonError) {
				throw new Error('Failed to get local game data. Server returned non-JSON response.');
			}
			throw new Error(errorData.error || 'Failed to get local game data.');
		}
		// alert('Getting local matches successfully!');
		const local_matches = await response.json()
		console.log("local matches: ", local_matches)
		return local_matches;
	} catch (error) {
		console.log("Error getting Local game data.", error);
	}
};


export async function get_local_tournament() {
	try {
		const response = await fetch('/api/history/tournament/', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			}
		});
		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (jsonError) {
				throw new Error('Failed to get tournament game data. Server returned non-JSON response.');
			}
			throw new Error(errorData.error || 'Failed to save tournament game data.');
		}
		// alert('Getting local tournament successfully!');
		const local_tournament = await response.json()
		console.log("local tournament: ", local_tournament)
		return local_tournament;
	} catch (error) {
		console.log("Error getting tournament game data.", error);
	}
};


export async function get_local_matches_by_player(player1_id) {
	try {
		const response = await fetch(`/api/history/match/${player1_id}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			}
		});
		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (jsonError) {
				throw new Error('Failed to get local match by player data. Server returned non-JSON response.');
			}
			throw new Error(errorData.error || 'Failed to get local game by player data.');
		}
		// alert('Getting local matches successfully!');
		const local_matches = await response.json()

		if (!Array.isArray(local_matches)) {
			throw new Error('Invalid data format: expected an array of local matches.');
		}

		// console.log("local matches by player: ", local_matches)
		return local_matches;
	} catch (error) {
		console.log("Error getting Local game by player data.", error);
	}
};


export async function get_local_tournament_by_player(player1_id) {
	try {
		const response = await fetch(`/api/history/tournament/${player1_id}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			}
		});
		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (jsonError) {
				throw new Error('Failed to get tournament by player game data. Server returned non-JSON response.');
			}
			throw new Error(errorData.error || 'Failed to get tournament by player game data.');
		}
		// alert('Getting local tournament successfully!');
		const local_tournament = await response.json()
		// console.log("local tournament by player: ", local_tournament)

		if (!Array.isArray(local_tournament)) {
			throw new Error('Invalid data format: expected an array of local tournament.');
		}

		return local_tournament;
	} catch (error) {
		console.log("Error getting tournament game by player data.", error);
	}
};

//*patch to update the total_players and user_final_position
export async function update_tournament(tournamentId, total_players, user_final_position) {
	try {
		const response = await fetch(`/api/history/tournament/${tournamentId}/update/`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			},
			body: JSON.stringify({
				total_players: total_players,
				user_final_position: user_final_position
			})
		});

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (jsonError) {
				throw new Error('Failed to update tournament game data. Server returned non-JSON response.');
			}
			throw new Error(errorData.error || 'Failed to update tournament game data.');
		}

		// Optionally, you can handle the success response here
		const data = await response.json();
		// console.log('Tournament updated successfully:', data);
	} catch (error) {
		console.log("Error updating tournament game data.", error);
	}
}


export async function create_tournament(tournamentId,player1_id){
	try {
		const response = await fetch('/api/history/tournament/create', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tokenService.getAccessToken()}`
			},
			body: JSON.stringify({
				player1_id: player1_id,
				total_players: 0,
				user_final_position: 0
			})
		});

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (jsonError) {
				throw new Error('Failed to save tournament game data. Server returned non-JSON response.');
			}
			throw new Error(errorData.error || 'Failed to save tournament game data.');
		}
		const responseData = await response.json();
		//*now i have the tournament id to link all local match of the tournament
		tournamentId = responseData.id;
		// console.log('Tournament created with ID:', tournamentId);
		return tournamentId;
		// alert('Tournament data saved successfully!');
	} catch (error) {
		console.log("Error saving tournament game data.", error);
	}
}

export async function cleanupInvalidTournaments() {
    try {
        const response = await fetch('/api/history/tournament/cleanup/', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${tokenService.getAccessToken()}`,
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

        if (response.status !== 204) {
            const data = await response.json();
            console.log(data.detail);
        }
    } catch (error) {
        console.log("Error cleaning up invalid tournaments.", error);
    }
}
