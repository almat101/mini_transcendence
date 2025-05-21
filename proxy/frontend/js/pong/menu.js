export function showMenu(start1v1Callback, startTournamentCallback, startCpuGameCallback) {
	const menu = document.getElementById('menu');
	const start1v1Button = document.getElementById('startGameButton');
	const startTournamentButton = document.getElementById('tournamentButton');
	const startCpuGameButton = document.getElementById('cpuButton');

	// Display the main menu
	menu.style.display = 'block';

	// Ensure the "Start Tournament" and "Play Against CPU" buttons are visible
	startTournamentButton.style.display = 'block';
	startCpuGameButton.style.display = 'block';

	// Remove previous event listeners to prevent multiple bindings
	start1v1Button.replaceWith(start1v1Button.cloneNode(true));
	startTournamentButton.replaceWith(startTournamentButton.cloneNode(true));
	startCpuGameButton.replaceWith(startCpuGameButton.cloneNode(true));

	const newStart1v1Button = document.getElementById('startGameButton');
	const newStartTournamentButton = document.getElementById('tournamentButton');
	const newStartCpuGameButton = document.getElementById('cpuButton');

	// 1v1 mode
	newStart1v1Button.addEventListener('click', () => {
	  menu.style.display = 'none';
	  start1v1Callback();
	});

	// Tournament mode: just show the tournament setup form
	newStartTournamentButton.addEventListener('click', () => {
	//   console.log('Start Tournament Button Clicked');
	  menu.style.display = 'none';
	  document.getElementById('tournamentSetup').style.display = 'block';
	});

	// CPU mode: start the game against the bot
	newStartCpuGameButton.addEventListener('click', () => {
	//   console.log('Play Against CPU Button Clicked');
	  menu.style.display = 'none';
	  startCpuGameCallback();
	});
  }
