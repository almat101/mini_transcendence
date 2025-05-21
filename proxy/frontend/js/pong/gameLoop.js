import { Ball } from './ball.js';
import { Paddle } from './paddle.js';


export function gameLoop(canvas, endGameCallback, player1Name, player2Name, isCpu = false) {
	const ctx = canvas.getContext('2d');
	const ball = new Ball(canvas.width / 2, canvas.height / 2, 10, 4, 3, canvas);
	const paddle1 = new Paddle(canvas, 10, 'w', 's');
	const paddle2 = new Paddle(canvas, canvas.width - 20, 'ArrowUp', 'ArrowDown');

	let score1 = 0;
	let score2 = 0;

	const player1ScoreElement = document.getElementById('player1Score');
	const player2ScoreElement = document.getElementById('player2Score');
	player1ScoreElement.textContent = `${player1Name}: 0`;
	player2ScoreElement.textContent = `${player2Name}: 0`;

	function updateScores() {
		// i reduce the ball speed of 20%
		if ((ball.speedX > 4 && ball.speedY > 3 ) || (-ball.speedX > 4 && -ball.speedY > 3) ){
			// console.log("%cSpeed decreased to: ", "color: red;", ball.speedX, ball.speedY);
			ball.speedX = ball.speedX < 0 ? -ball.speedX * 0.8 : ball.speedX * 0.8;
			ball.speedY = ball.speedY < 0 ? -ball.speedY * 0.8 : ball.speedY * 0.8;
		}
		player1ScoreElement.textContent = `${player1Name}: ${score1}`;
		player2ScoreElement.textContent = `${player2Name}: ${score2}`;
	}
	updateScores();

	let keys = {};
	window.addEventListener('keydown', (e) => { keys[e.key] = true; });
	window.addEventListener('keyup', (e) => { keys[e.key] = false; });

	let lastReactionTime = performance.now(); // Moved outside for persistence
	let predictedY = paddle2.y; // initial prediction

	function drawDottedLine() {
		ctx.setLineDash([5, 15]);
		ctx.beginPath();
		ctx.moveTo(canvas.width / 2, 0);
		ctx.lineTo(canvas.width / 2, canvas.height);
		ctx.strokeStyle = 'white';
		ctx.stroke();
		ctx.setLineDash([]);
	}

	function update() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawDottedLine();
		ball.draw();
		ball.move();

		// Update left paddle (player-controlled)
		paddle1.update(keys);

		// Update right paddle: CPU behavior versus human control
		if (isCpu) {
			const cpuReactionTime = 1; // Reaction delay in seconds
			const currentTime = performance.now();
			const timeSinceLastReaction = (currentTime - lastReactionTime) / 1000;
			const minY = 0;
			const maxY = canvas.height - paddle2.height;

			if (ball.speedX > 0) {
			// Only update prediction after the CPU reaction delay
				if (timeSinceLastReaction >= cpuReactionTime) {
					let remainingDistance = paddle2.x - ball.x;
					let remainingTime = remainingDistance / Math.abs(ball.speedX);
					let simulatedY = ball.y;
					let simulatedSpeedY = ball.speedY;
					let simulatedTime = 0;

					//simulate wall bounces
					while (simulatedTime < remainingTime){
						const timeStep = Math.min(remainingTime - simulatedTime, 0.1);
						simulatedY += simulatedSpeedY * timeStep;
						simulatedTime += timeStep;

						if (simulatedY < 0){
							simulatedY = -simulatedY;
							simulatedSpeedY = -simulatedSpeedY;
						} else if (simulatedY > canvas.height){
							simulatedY = 2 * canvas.height - simulatedY;
							simulatedSpeedY = -simulatedSpeedY;
						}
					}

					predictedY = simulatedY - paddle2.height / 2;
					predictedY += Math.random() * 140 - 65; // Add some randomness to the prediction
					predictedY = Math.min(Math.max(predictedY, minY), maxY);
					lastReactionTime = currentTime;
				}
			}else{
				predictedY = paddle2.y;
			}
				// Smooth movement with acceleration
				const offset = predictedY - paddle2.y;
				if (Math.abs(offset) > paddle2.speed) {
					paddle2.y += (offset > 0 ? paddle2.speed : -paddle2.speed);
				} else {
					paddle2.y += offset;
				}
				  paddle2.y = Math.min(Math.max(paddle2.y, minY), maxY);
		} else {
			paddle2.update(keys);
		}

		paddle1.draw();
		paddle2.draw();

		// Collision and scoring logic…
		if (
			(ball.x - ball.radius < paddle1.x + paddle1.width &&
			 ball.y > paddle1.y &&
			 ball.y < paddle1.y + paddle1.height) ||
			(ball.x + ball.radius > paddle2.x &&
			 ball.y > paddle2.y &&
			 ball.y < paddle2.y + paddle2.height)
		) {
			ball.speedX = -ball.speedX;
			ball.increaseSpeed();
		}
		if (ball.x - ball.radius < 0) {
			score2++;
			ball.reset();

			updateScores();
			if (score2 >= 5) {
				endGameCallback(player2Name);
				return;
			}
		} else if (ball.x + ball.radius > canvas.width) {
			score1++;
			ball.reset();
			updateScores();
			if (score1 >= 5) {
				endGameCallback(player1Name);
				return;
			}
		}
		requestAnimationFrame(update);
	}
	update();
}
