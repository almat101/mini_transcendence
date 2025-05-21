// index.js is for testing i could delete it lately
import { renderPongPage } from './pages/pong.js';
// Note: We import initializeGame, but we'll call it after the page is rendered.
import { initializeGame } from './pong/app.js';

document.addEventListener("DOMContentLoaded", () => {

  console.log("the rendering is looking good :)")
  // Render the HTML structure for the game
  renderPongPage();

  // Now that the page is built, initialize the game logic.
  // Remove any internal DOMContentLoaded listeners in initializeGame if possible.
  // initializeGame();
});
