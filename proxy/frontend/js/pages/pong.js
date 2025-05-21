import { Navbar } from "../components/navbar.js";
import { initializeGame } from "../pong/app.js";
import { initializeGame3D } from "../pong3D/main.js"; // Import the Pong 3D initialization function

export function renderPongPage() {
  const root = document.getElementById("root");
  root.innerHTML = ""; // Clear previous content

  // Add the navbar
  const navbar = Navbar();
  root.appendChild(navbar);

  // Pong container
  const pongContainer = document.createElement("div");
  pongContainer.id = "pong-container";

  // Title
  const title = document.createElement("h1");
  title.id = "title";
  title.textContent = "Pong";
  pongContainer.appendChild(title);

  // Menu
  const menu = document.createElement("div");
  menu.id = "menu";

  // Buttons in the menu
  const startButton = document.createElement("button");
  startButton.id = "startGameButton";
  startButton.textContent = "Start Game";
  menu.appendChild(startButton);

  const tournamentButton = document.createElement("button");
  tournamentButton.id = "tournamentButton";
  tournamentButton.textContent = "Play tournament";
  menu.appendChild(tournamentButton);

  const cpuButton = document.createElement("button");
  cpuButton.id = "cpuButton";
  cpuButton.textContent = "Play vs CPU";
  menu.appendChild(cpuButton);

  const pong3DButton = document.createElement("button");
  pong3DButton.id = "pong3DButton";
  pong3DButton.textContent = "Play Pong 3D";
  menu.appendChild(pong3DButton); // Add Pong 3D button

  pongContainer.appendChild(menu);

  // Scores
  const scores = document.createElement("div");
  scores.id = "scores";
  scores.style.display = "none";

  const player1Score = document.createElement("span");
  player1Score.id = "player1Score";
  player1Score.textContent = "Player 1: 0";
  scores.appendChild(player1Score);

  const player2Score = document.createElement("span");
  player2Score.id = "player2Score";
  player2Score.textContent = "Player 2: 0";
  scores.appendChild(player2Score);
  pongContainer.appendChild(scores);

  // Tournament setup section
  const tournamentSetup = document.createElement("div");
  tournamentSetup.id = "tournamentSetup";
  tournamentSetup.style.display = "none";

  const headingForTournament = document.createElement("h2");
  headingForTournament.textContent = "Setup Tournament";
  tournamentSetup.appendChild(headingForTournament);

  const tournamentForm = document.createElement("form");
  tournamentForm.id = "playerNamesForm";

  const formHeading = document.createElement("h3");
  formHeading.textContent = "Enter player names, the logged in user is already added";
  tournamentForm.appendChild(formHeading);

  const playerNamesInputs = document.createElement("div");
  playerNamesInputs.id = "playerNamesInputs";

  const playerNamesInput = document.createElement("input");
  playerNamesInput.type = "text";
  playerNamesInput.id = "playerNames";
  playerNamesInput.placeholder = "Enter player names separated by commas";
  playerNamesInputs.appendChild(playerNamesInput);

  tournamentForm.appendChild(playerNamesInputs);

  const submitTournamentButton = document.createElement("button");
  submitTournamentButton.type = "submit";
  submitTournamentButton.textContent = "Start Tournament";
  tournamentForm.appendChild(submitTournamentButton);

  tournamentSetup.appendChild(tournamentForm);

  const cancelTournamentSetupButton = document.createElement("button");
  cancelTournamentSetupButton.id = "cancelTournamentSetup";
  cancelTournamentSetupButton.textContent = "Back";
  tournamentSetup.appendChild(cancelTournamentSetupButton);

  pongContainer.appendChild(tournamentSetup);

  // Match announcement section
  const matchAnnouncement = document.createElement("div");
  matchAnnouncement.id = "matchAnnouncement";
  matchAnnouncement.style.display = "none";

  const matchHeader = document.createElement("div");
  matchHeader.textContent = "Upcoming match";
  matchAnnouncement.appendChild(matchHeader);

  const matchP = document.createElement("p");
  matchP.id = "matchAnnouncementText";
  matchP.textContent = "testing";
  matchAnnouncement.appendChild(matchP);

  const startMatchButton = document.createElement("button");
  startMatchButton.id = "startMatchButton";
  startMatchButton.textContent = "Start match";
  matchAnnouncement.appendChild(startMatchButton);

  pongContainer.appendChild(matchAnnouncement);

  // Game Canvas
  const gameCanvas = document.createElement("canvas");
  gameCanvas.id = "gameCanvas";
  gameCanvas.width = 1000;
  gameCanvas.height = 500;
  gameCanvas.style.display = "none";
  pongContainer.appendChild(gameCanvas);

  // const gameCanvas3dContainer = document.createElement("div");
  // gameCanvas3dContainer.id = "gameCanvas3dContainer";
  // gameCanvas3dContainer.style.position = "relative";
  // gameCanvas3dContainer.style.display = 'none';
  //?VERY IMPORTANT
  //* Game Canvas for Pong 3D
  const gameCanvas3d = document.createElement("canvas");
  gameCanvas3d.id = "gameCanvas3d";
  gameCanvas3d.style.display = "none";
  pongContainer.appendChild(gameCanvas3d);

  const gameOverButton = document.createElement("button");
  gameOverButton.id = "gameOver";
  gameOverButton.textContent = "go back to the menu";
  gameOverButton.style.display = 'none';
  pongContainer.appendChild(gameOverButton);
  // Winning Screen
  //! only in case you use the gameCanvasContainer3d
  // root.appendChild(gameCanvas3dContainer);

  const winningScreen = document.createElement("div");
  winningScreen.id = "winningScreen";
  winningScreen.style.display = "none";

  const winnerMessage = document.createElement("h2");
  winnerMessage.id = "winnerMessage";
  winningScreen.appendChild(winnerMessage);

  const restartButton = document.createElement("button");
  restartButton.id = "restartButton";
  restartButton.textContent = "Restart Game";
  winningScreen.appendChild(restartButton);

  pongContainer.appendChild(winningScreen);

  // Append the pong container to the root
  root.appendChild(pongContainer);


  // Initialize the game logic
  initializeGame(navbar);

  // Add event listeners for the buttons
  startButton.addEventListener('click', () => initializeGame(navbar));
  tournamentButton.addEventListener('click', () => initializeGame(navbar));
  cpuButton.addEventListener('click', () => initializeGame(navbar));
  pong3DButton.addEventListener('click', () => initializeGame3D(navbar)); // Add event listener for Pong 3D button
}

/*
problemi finali riscontrati fin'ora:
  il gioco 3d va con l'apposito canvas e container div
  il bottone compare sopra di esso a fine partita rimandando al menu principale ottimo
  !problemi:
  quando ritorni al menu principale 2 bottoni vengono sballati
  quando hai fatto una partita in 3d pare che i lgioco salvi la partita stessa la sua scena [x] sistemato
  sistemati i bottoni bastava associare il canvas al container pong che si sballa se nascosto

*/
