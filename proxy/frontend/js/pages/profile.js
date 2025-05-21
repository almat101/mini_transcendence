import { Navbar } from "../components/navbar.js";
import { showAlert } from '../components/alert.js';
import { get_local_matches_by_player, get_local_tournament_by_player, cleanupInvalidTournaments } from '../pong/history.js';
import { userService } from "../services/userService.js";

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', { timeZone: 'Europe/Rome' });
}

export async function renderProfilePage() {
    const userData = userService.getUserData();

    const root = document.getElementById("root");
    root.innerHTML = "";

    const navbar = Navbar();
    root.appendChild(navbar);

    const section = document.createElement('section');
    section.className = 'text-lg-start';
    section.style.paddingTop = '20px';

    const profileSection = `
        <div class="container align-items-center">
            <div id="profileSection">
                <div class="local-games-card">
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Local 1vs1 Games</h3>
                            <table class="table table-striped" id="localGamesTable">
                                <thead>
                                    <tr>
                                        <th class="text-center">Player 1</th>
                                        <th class="text-center">Player 2</th>
                                        <th class="text-center">Score</th>
                                        <th class="text-center">Winner</th>
                                        <th class="text-center">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Local games data will be inserted here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="tournament-games-card">
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Tournament 1vs1 Games</h3>
                            <table class="table table-striped" id="tournamentGamesTable">
                                <thead>
                                    <tr>
                                        <th class="text-center">Player 1</th>
                                        <th class="text-center">Player 2</th>
                                        <th class="text-center">Score</th>
                                        <th class="text-center">Winner</th>
                                        <th class="text-center">Tournament ID</th>
                                        <th class="text-center">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Tournament games data will be inserted here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="tournament-summary-card">
                    <div class="card">
                        <div class="card-body">
                            <h3 class="card-title mb-4">Tournament Summary</h3>
                            <table class="table table-striped" id="tournamentSummaryTable">
                                <thead>
                                    <tr>
                                        <th class="text-center">Tournament ID</th>
                                        <th class="text-center">Total Players</th>
                                        <th class="text-center">User Final Position</th>
                                        <th class="text-center">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Tournament summary data will be inserted here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

    section.innerHTML += profileSection;
    root.appendChild(section);

    try {

        //*API calls to clean invalid tournament
        await cleanupInvalidTournaments();

        const localGames = await get_local_matches_by_player(userData.id);
        if (!Array.isArray(localGames)) {
            throw new Error('Invalid data format: expected an array of local games.');
        }
        const localGamesTableBody = document.getElementById('localGamesTable').querySelector('tbody');
        localGamesTableBody.innerHTML = '';
        if (localGames.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" class="text-center">No local games found.</td>`;
            localGamesTableBody.appendChild(row);
        } else {
            localGames.forEach(game => {
                if (!game.is_tournament) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="text-center">${game.player1_name}</td>
                        <td class="text-center">${game.player2_name}</td>
                        <td class="text-center">${game.player1_score} - ${game.player2_score}</td>
                        <td class="text-center">${game.winner}</td>
                        <td class="text-center">${formatDate(game.date)}</td>
                    `;
                    localGamesTableBody.appendChild(row);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching local games data:', error);
        showAlert('Failed to fetch local games data', 'danger');
    }

    try {
        const tournamentGames = await get_local_matches_by_player(userData.id);
        if (!Array.isArray(tournamentGames)) {
            throw new Error('Invalid data format: expected an array of tournament games.');
        }
        const tournamentGamesTableBody = document.getElementById('tournamentGamesTable').querySelector('tbody');
        tournamentGamesTableBody.innerHTML = '';
        if (tournamentGames.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan=6" class="text-center">No tournament games found.</td>`;
            tournamentGamesTableBody.appendChild(row);
        } else {
            tournamentGames.forEach(game => {
                if (game.is_tournament) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="text-center">${game.player1_name}</td>
                        <td class="text-center">${game.player2_name}</td>
                        <td class="text-center">${game.player1_score} - ${game.player2_score}</td>
                        <td class="text-center">${game.winner}</td>
                        <td class="text-center">${game.tournament}</td>
                        <td class="text-center">${formatDate(game.date)}</td>
                    `;
                    tournamentGamesTableBody.appendChild(row);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching tournament games data:', error);
        showAlert('Failed to fetch tournament games data', 'danger');
    }

    try {
        const tournamentSummary = await get_local_tournament_by_player(userData.id);
        if (!Array.isArray(tournamentSummary)) {
            throw new Error('Invalid data format: expected an array of tournament summary.');
        }
        const tournamentSummaryTableBody = document.getElementById('tournamentSummaryTable').querySelector('tbody');
        tournamentSummaryTableBody.innerHTML = '';
        if (tournamentSummary.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" class="text-center">No tournament summary found.</td>`;
            tournamentSummaryTableBody.appendChild(row);
        } else {
            tournamentSummary.forEach(game => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="text-center">${game.id}</td>
                    <td class="text-center">${game.total_players}</td>
                    <td class="text-center">${game.user_final_position}</td>
                    <td class="text-center">${formatDate(game.date)}</td>
                `;
                tournamentSummaryTableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error fetching tournament summary data:', error);
        showAlert('Failed to fetch tournament summary data', 'danger');
    }
}
