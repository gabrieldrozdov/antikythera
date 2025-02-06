// Controls
function toggleControls() {
	const controls = document.querySelector('.controls');
	if (controls.dataset.active == 1) {
		controls.dataset.active = 0;
	} else {
		controls.dataset.active = 1;
	}
}
function showControls() {
	const controls = document.querySelector('.controls');
	controls.dataset.active = 1;
}

// Frame rate
let fps = 20;
function updateFrameRate(newValue) {
	fps = parseInt(newValue);
	const valueLabel = document.querySelector('#frame-rate-value');
	valueLabel.innerText = newValue;
	frameRate(fps);
}

// Scale canvas
let scale = 20;
function updateScale(newValue) {
	scale = parseInt(newValue);
	const valueLabel = document.querySelector('#scale-value');
	valueLabel.innerText = newValue;
	if (inLoop) {
		windowResized();
	} else {
		resizeCanvas((windowWidth/100)*scale, (windowHeight/100)*scale);
	}
}

// Threshold canvas
let threshold = 200;
function updateThreshold(newValue) {
	threshold = parseInt(newValue);
	const valueLabel = document.querySelector('#threshold-value');
	valueLabel.innerText = newValue;
}

// Percent animated
let percentAnimated = 50;
function updatePercentAnimated(newValue) {
	percentAnimated = parseInt(newValue);
	const valueLabel = document.querySelector('#percent-animated-value');
	valueLabel.innerText = newValue;
}

// Convert hex to rgb values
function hexToRgb(hex) {
	const bigint = parseInt(hex.slice(1), 16);
	return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// RGB to hex
function rgbToHex([r, g, b]) {
	let red = r.toString(16).padStart(2, '0'); // FF
	let green = g.toString(16).padStart(2, '0'); // C0
	let blue = b.toString(16).padStart(2, '0'); // CB
	return '#' + red + green + blue; // #FFC0CB
}

// Colors
let color1 = [0, 0, 0];
let color2 = [0, 0, 0];
function updateColor1(newValue) {
	const hex = newValue;
	color1 = hexToRgb(hex);
	const elmnt = document.querySelector('#color1');
	elmnt.value = hex;
}
updateColor1('#bdafa3');
function updateColor2(newValue) {
	const hex = newValue;
	color2 = hexToRgb(hex);
	const elmnt = document.querySelector('#color2');
	elmnt.value = hex;
}
updateColor2('#1a1a1a');

// Random hex code
function generateRandomHexCode() {
	// Generate a random number between 0 and 0xFFFFFF (inclusive)
	const randomNumber = Math.floor(Math.random() * 0xFFFFFF) + 1;
  
	// Convert the number to hexadecimal and pad with zeros if necessary
	const hexCode = randomNumber.toString(16).padStart(6, '0');
  
	// Add the '#' symbol to the beginning
	return `#${hexCode}`;
}

// Randomize colors
function randomizeColors() {
	updateColor1(generateRandomHexCode());
	updateColor2(generateRandomHexCode());
}

// Swap colors
function swapColors() {
	const temp = color2;
	color2 = color1;
	color1 = temp;
	updateColor1(rgbToHex(color1));
	updateColor2(rgbToHex(color2));
}

// Initialize canvas
let canvas;
let img = null;
let video = null;
let isVideo = false;
function setup() {
	canvas = createCanvas();
	canvas.id('dither');
	frameRate(fps);
	loadImage('genart-image-compressed.jpg', (loadedImage) => {
		img = loadedImage;
	});
	resizeCanvas((windowWidth/100)*scale, (windowHeight/100)*scale);


	document.querySelector('#dither').addEventListener('click', () => {showControls()});
}

// Main loop
let inLoop = false;
function draw() {
	if (img && !isVideo) {
		image(img, 0, 0, width, height);
	} else if (video && isVideo) {
		image(video, 0, 0, width, height);
	}

	// Dithering effect
	inLoop = true;
	loadPixels();
	for (let i = 0; i < pixels.length; i+=4) {
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];
		const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;

		let activeThreshold = threshold;
		if (Math.random() < percentAnimated/100) {
			activeThreshold = random(threshold);
		}

		if (brightness > activeThreshold) {
			pixels[i] = color1[0];
			pixels[i + 1] = color1[1];
			pixels[i + 2] = color1[2];
		} else {
			pixels[i] = color2[0];
			pixels[i + 1] = color2[1];
			pixels[i + 2] = color2[2];
		}
	}
	updatePixels();
	inLoop = false;
}

// Resize canvas to fit screen
function windowResized() {
	if (inLoop) {
		windowResized();
	} else {
		resizeCanvas((windowWidth/100)*scale, (windowHeight/100)*scale);
	}
}

// File input
document.getElementById('file').addEventListener('change', (event) => {
	const file = event.target.files[0];
	if (!file) return;

	const url = URL.createObjectURL(file);

	if (file.type.startsWith('image')) {
		isVideo = false;
		img = null; // Reset img to avoid conflicts
		loadImage(url, (loadedImage) => {
			img = loadedImage;
			redraw();
		});
	} else if (file.type.startsWith('video')) {
		isVideo = true;
		if (video) video.remove(); // Remove previous video element if it exists
		video = createVideo(url, () => {
			video.size(width, height);
			video.loop();
			video.hide();
			redraw();
		});
	}
});

// Pause/play toggle
let looping = true;
function pausePlay() {
	looping = !looping;
	if (looping) {
		loop();
	} else {
		noLoop();
	}
}

// Safe as gif
function makeRecording() {
	saveGif('dither', 5, { notificationDuration: 1 });
}