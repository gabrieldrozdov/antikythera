// Floyd-Steinberg dithering algorithm adapted from Tobia Giachetti
// https://github.com/tgiachett/canvas-floyd-steinberg-dither

// BSD 2-Clause License

// Copyright (c) 2019, Tobia Giachetti
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:

// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer.

// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
// FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
// CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
// OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

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

// Scale canvas
let scale = 90;
function updateScale(newValue) {
	scale = parseInt(newValue);
	const valueLabel = document.querySelector('#scale-value');
	valueLabel.innerText = newValue;
}

// Thresholds
let thresholdRed = 1;
function updateThresholdRed(newValue) {
	thresholdRed = parseInt(newValue) / 100;
	const valueLabel = document.querySelector('#threshold-red-value');
	valueLabel.innerText = newValue;
}
let thresholdGreen = 1;
function updateThresholdGreen(newValue) {
	thresholdGreen = parseInt(newValue) / 100;
	const valueLabel = document.querySelector('#threshold-green-value');
	valueLabel.innerText = newValue;
}
let thresholdBlue = 1;
function updateThresholdBlue(newValue) {
	thresholdBlue = parseInt(newValue) / 100;
	const valueLabel = document.querySelector('#threshold-blue-value');
	valueLabel.innerText = newValue;
}

// Crossover
let crossover = 128;
function updateCrossover(newValue) {
	crossover = parseInt(newValue);
	const valueLabel = document.querySelector('#crossover-value');
	valueLabel.innerText = newValue;
}

// Brightness
let brightness = 200;
function updateBrightness(newValue) {
	brightness = parseInt(newValue);
	const valueLabel = document.querySelector('#brightness-value');
	valueLabel.innerText = newValue;
}

// Opacity of canvas
let canvasOpacity = 100;
function updateOpacity(newValue) {
	const canvas = document.querySelector('#canvas');
	canvasOpacity = parseInt(newValue);
	const valueLabel = document.querySelector('#opacity-value');
	valueLabel.innerText = newValue;
	canvas.style.opacity = canvasOpacity / 100;
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
updateColor1('#1a1a1a');
function updateColor2(newValue) {
	const hex = newValue;
	color2 = hexToRgb(hex);
	const elmnt = document.querySelector('#color2');
	elmnt.value = hex;
}
updateColor2('#bdafa3');

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

// Blend modes
let blendMode = 'normal';
function updateBlendMode(newValue) {
	const canvas = document.querySelector('#canvas');
	blendMode = newValue;
	const valueLabel = document.querySelector('#blend-mode-value');
	valueLabel.innerText = blendMode;
	canvas.style.mixBlendMode = blendMode;
}

// File input
const video = document.querySelector('#video');
const img = document.querySelector('#image');
document.getElementById('file').addEventListener('change', (event) => {
	const file = event.target.files[0];
	if (!file) return;

	const url = URL.createObjectURL(file);
	const canvasContainer = document.querySelector('#canvas-container');
	videoActive = false;

	if (file.type.startsWith('image')) {
		fileLoaded = false;
		img.src = url;
		videoActive = false;
		canvasContainer.dataset.media = 'image';
		img.onload = () => {
			fileLoaded = true;
		};
	} else if (file.type.startsWith('video')) {
		fileLoaded = false
		video.querySelector('source').src = url;
		video.load();
		videoPaused = false;
		videoActive = true;
		canvasContainer.dataset.media = 'video';
	}
});

// Pause/play toggle
let videoActive = true;
let videoPaused = false;
function pausePlay() {
	if (!videoPaused) {
		video.pause();
		videoPaused = true;
	} else {
		video.play();
		videoPaused = false;
	}
}

// Initialize video
let fileLoaded = false;
video.addEventListener('loadeddata', () => {
	fileLoaded = true;
	processFrame();
});

// Main loop
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
function processFrame() {
	if (fileLoaded) {
		if (videoActive) {
			// Draw the current video frame to the canvas
			canvas.width = video.videoWidth / (11 - scale / 10);
			canvas.height = video.videoHeight / (11 - scale / 10);
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		} else {
			// Draw the current image to the canvas
			canvas.width = img.naturalWidth / (11 - scale / 10);
			canvas.height = img.naturalHeight / (11 - scale / 10);
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		}
	}

	// Get the current frame's pixel data
	let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	// Apply Floyd-Steinberg dithering with dark tone gradients
	imageData = dither(imageData);

	// Continue processing frames
	requestAnimationFrame(processFrame);
}

// Determine if pixel is dark or light
function findClosestPalCol(srcPx) {
	if (256 - srcPx < crossover) {
		return 255;
	} else {
		return 0;
	}
}

// Floyd-Steinberg dither algorithm
function dither() {
	let idataSrc = ctx.getImageData(0, 0, canvas.width, canvas.height),
		idataTrg = ctx.createImageData(canvas.width, canvas.height),
		dataSrc = idataSrc.data,
		dataTrg = idataTrg.data,
		len = dataSrc.length, luma;

	// Convert to grayscale
	for (let i = 0; i < len; i += 4) {
		luma = (dataSrc[i] * (0.2126 * thresholdRed) + dataSrc[i + 1] * (.7152 * thresholdGreen) + dataSrc[i + 2] * (.0722 * thresholdBlue)) * (brightness / 200);
		dataTrg[i] = dataTrg[i + 1] = dataTrg[i + 2] = luma;
		dataTrg[i + 3] = dataSrc[i + 3];
	}

	if (ditherActive) {
		for (let i = 0; i < len; i += 4) {
			if (dataTrg[i + (canvas.width * 4)] === -1 || dataTrg[i + 4] === -1) {
				break;
			} else {
				let oldPixel = dataTrg[i];
				let newPixel = findClosestPalCol(dataTrg[i]);

				dataTrg[i] = dataTrg[i + 1] = dataTrg[i + 2] = newPixel;
				let quantError = oldPixel - newPixel;
				dataTrg[i + 4] = dataTrg[i + 4] + quantError * (7 / 16);
				dataTrg[i + (canvas.width * 4)] = dataTrg[i + (canvas.width * 4)] + quantError * (5 / 16);
				dataTrg[i + (canvas.width * 4 - 4)] = dataTrg[i + (canvas.width * 4 - 4)] + quantError * (3 / 16);
				dataTrg[i + (canvas.width * 4 + 4)] = dataTrg[i + (canvas.width * 4 + 4)] + quantError * (1 / 16);
			}
		}
	}

	// Finish dither process
	ctx.putImageData(idataTrg, 0, 0);

	// Duotone process
	if (duotoneActive) {

		// Get the image data
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const data = imageData.data;

		// Loop through every pixel again
		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];     // Red
			const g = data[i + 1]; // Green
			const b = data[i + 2]; // Blue

			// Check if it's black (0, 0, 0) or white (255, 255, 255)
			if (r <= crossover && g <= crossover && b <= crossover) {
				// Change black to your desired hex color
				data[i] = color1[0];
				data[i + 1] = color1[1];
				data[i + 2] = color1[2];
			} else if (r > crossover && g > crossover && b > crossover) {
				// Change white to your desired hex color
				data[i] = color2[0];
				data[i + 1] = color2[1];
				data[i + 2] = color2[2];
			}
		}

		// Put the modified image data back on the canvas
		ctx.putImageData(imageData, 0, 0);
	}
};

// Toggle filters
let ditherActive = true;
function toggleDither() {
	ditherActive = !ditherActive;
}
let duotoneActive = true;
function toggleDuotone() {
	duotoneActive = !duotoneActive;
}

// Save as image
function saveCanvas() {
	var link = document.createElement('a');
	link.download = 'floyd-steinberg.png';
	link.href = document.getElementById('canvas').toDataURL();
	link.click();
}

// Record as video
function Recorder(canvas, fps) {

	var fps = fps || 30;
	var ctx = canvas.getContext("2d");

	var videoStream = canvas.captureStream(fps);
	var mediaRecorder = new MediaRecorder(videoStream);

	var videoURL;

	var chunks = [];
	mediaRecorder.ondataavailable = function (e) {
		chunks.push(e.data);
	}

	function download(dataurl, filename) {
		const link = document.createElement("a");
		link.href = dataurl;
		link.download = filename;
		link.click();
	}

	mediaRecorder.onstop = function (e) {
		var blob = new Blob(chunks, {
			'type': 'video/mp4'
		});
		chunks = [];
		videoURL = URL.createObjectURL(blob);
		//console.log("mp4 video url:", videoURL);
		var myReader = new FileReader();
		myReader.readAsDataURL(blob);
		myReader.addEventListener("loadend", function (e) {
			document.getElementById('video').src = e.srcElement.result;
			document.getElementById('canvas').hidden = true;
			document.getElementById('video').hidden = false;
		});
	}

	mediaRecorder.ondataavailable = function (e) {
		chunks.push(e.data);
	}

	this.start = () => mediaRecorder.start();
	this.stop = () => mediaRecorder.stop();
	this.pause = () => mediaRecorder.pause();
	this.resume = () => mediaRecorder.resume();
	this.getUrl = () => videoURL;
	this.download = (fileName) => {
		if (videoURL != "")
			download(videoURL, fileName)
	}
}

// Recording GIFs using gif.js
let recordingLength = 5;
function updateRecordingLength(newValue) {
	recordingLength = parseInt(newValue);
	const valueLabel = document.querySelector('#recording-length-value');
	valueLabel.innerText = recordingLength;
}
let frameRate = 45;
function updateFrameRate(newValue) {
	frameRate = parseInt(newValue);
	const valueLabel = document.querySelector('#frame-rate-value');
	valueLabel.innerText = frameRate;
}
function makeRecording() {
	const overlay = document.querySelector('.overlay');
	const overlayTotal = document.querySelector('#overlay-total');
	overlay.dataset.active = 1;
	overlayTotal.innerText = recordingLength*frameRate;

	var gif = new GIF({
		workers: 2,
		quality: 10
	});

	for (let i=0; i<recordingLength*frameRate; i++) {
		gif.addFrame(canvas, { delay: 1000/frameRate });
	}

	gif.on('finished', function (blob) {
		overlay.dataset.active = 0;
		window.open(URL.createObjectURL(blob));
	});

	gif.render();
}