export class Ball {
	constructor(x, y, radius, speedX, speedY, canvas) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.speedX = speedX;
		this.speedY = speedY;
		this.canvas = canvas;
		this.context = canvas.getContext('2d');
	}

	draw() {
		this.context.beginPath();
		this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		this.context.fillStyle = 'blue';
		this.context.fill();
		this.context.closePath();
	}

	move() {
		this.x += this.speedX;
		this.y += this.speedY;

		// Bounce off walls
		if (this.x + this.radius > this.canvas.width || this.x - this.radius < 0) {
		this.speedX = -this.speedX;
		}
		if (this.y + this.radius > this.canvas.height || this.y - this.radius < 0) {
		this.speedY = -this.speedY;
		}
	}

	// Increase speed slightly
	increaseSpeed() {
		const speedIncreaseFactor = 1.05;
		this.speedX *= speedIncreaseFactor;
		this.speedY *= speedIncreaseFactor;
		// console.log("%cSpeed increased to: ", "color: green;", this.speedX, this.speedY);
	}

	// Reset the ball to the center of the canvas
	reset() {
		this.x = this.canvas.width / 2;
		this.y = this.canvas.height / 2;
		this.speedX = -this.speedX; // Change direction
		this.speedY = (Math.random() > 0.5 ? 1 : -1) * Math.abs(this.speedY); // Randomize vertical direction
	}
}
