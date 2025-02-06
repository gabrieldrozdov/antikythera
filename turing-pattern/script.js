"use strict";
const canvas = document.getElementById('canvas');
const glsl = SwissGL(canvas);

// Controls
let skipIterations = 0;
let timeSteps = 1;
let preblurSteps = 4;
let steepness = 1000;
let sigmoidCenter = 40;
let originalDimensions = 512;
let croppedDimensions = 256;
let upscaledDimensions = 1000;
let filterType = 'linear';
let shader = 'colormapped';
let preset = 'turing';
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
function updateSkipIterations(newValue) {
	skipIterations = newValue;
	const valueLabel = document.querySelector('#skip-iterations-value');
	valueLabel.innerText = skipIterations;
	reset();
}
function updateTimeSteps(newValue) {
	timeSteps = newValue;
	const valueLabel = document.querySelector('#time-steps-value');
	valueLabel.innerText = timeSteps;
}
function updatePreblurSteps(newValue) {
	preblurSteps = newValue;
	const valueLabel = document.querySelector('#preblur-steps-value');
	valueLabel.innerText = preblurSteps;
}
function updateSteepness(newValue) {
	steepness = newValue;
	const valueLabel = document.querySelector('#steepness-value');
	valueLabel.innerText = steepness;
}
function updateSigmoidCenter(newValue) {
	sigmoidCenter = newValue;
	const valueLabel = document.querySelector('#sigmoid-center-value');
	valueLabel.innerText = sigmoidCenter;
}
function updateOriginalDimensions(newValue) {
	originalDimensions = 2 * Math.round(newValue / 2); // has to be divisible by 2
	const valueLabel = document.querySelector('#original-dimensions-value');
	valueLabel.innerText = originalDimensions;
	reset();
}
function updateCroppedDimensions(newValue) {
	croppedDimensions = 2 * Math.round(newValue / 2); // has to be divisible by 2
	const valueLabel = document.querySelector('#cropped-dimensions-value');
	valueLabel.innerText = croppedDimensions;
}
function updateUpscaledDimensions(newValue) {
	upscaledDimensions = 2 * Math.round(newValue / 2); // has to be divisible by 2
	const valueLabel = document.querySelector('#upscaled-dimensions-value');
	valueLabel.innerText = upscaledDimensions;
}
function updateFilter(newValue) {
	filterType = newValue;
	const valueLabel = document.querySelector('#filter-value');
	valueLabel.innerText = filterType;
}
function updateShader(newValue) {
	shader = newValue;
	const valueLabel = document.querySelector('#shader-value');
	valueLabel.innerText = shader;
}
function updatePreset(newValue) {
	preset = newValue;
	const valueLabel = document.querySelector('#preset-value');
	valueLabel.innerText = preset;
}
function downloadCanvas() {
	requestAnimationFrame(() => {
		// Capture the image after the next frame
		const imageUrl = canvas.toDataURL('image/png'); // Capture image data

		// Create an anchor element to download the image
		const link = document.createElement('a');
		link.href = imageUrl;
		link.download = 'antikythera.png';

		// Trigger the download
		link.click();
	});
}

function generateRandomHexCode() {
	// Generate a random number between 0 and 0xFFFFFF (inclusive)
	const randomNumber = Math.floor(Math.random() * 0xFFFFFF) + 1;
  
	// Convert the number to hexadecimal and pad with zeros if necessary
	const hexCode = randomNumber.toString(16).padStart(6, '0');
  
	// Add the '#' symbol to the beginning
	return `#${hexCode}`;
}

let color1RGB = [0.0, 0.0, 0.0];
let color1Hex = '#bdafa3';
const color1 = document.querySelector('#color1');
color1.value = color1Hex;

let color2RGB = [1.0, 1.0, 1.0];
let color2Hex = '#1a1a1a';
const color2 = document.querySelector('#color2');
color2.value = color2Hex;

function updateColor1(newValue) {
	color1Hex = newValue;
	hexToRgbPercent();
}
function updateColor2(newValue) {
	color2Hex = newValue;
	hexToRgbPercent();
}
function hexToRgbPercent() {
	// Remove hashtag
	let hex1 = color1Hex.replace(/^#/, '');
	let hex2 = color2Hex.replace(/^#/, '');

	// Parse the hex code into its RGB components
	let r1 = parseInt(hex1.substring(0, 2), 16);
	let g1 = parseInt(hex1.substring(2, 4), 16);
	let b1 = parseInt(hex1.substring(4, 6), 16);
	let r2 = parseInt(hex2.substring(0, 2), 16);
	let g2 = parseInt(hex2.substring(2, 4), 16);
	let b2 = parseInt(hex2.substring(4, 6), 16);

	// Convert each component to a percentage (0.0 to 1.0)
	color1RGB = [r1 / 255, g1 / 255, b1 / 255];
	color2RGB = [r2 / 255, g2 / 255, b2 / 255];
}
hexToRgbPercent();
function randomizeColors() {
	color1Hex = generateRandomHexCode();
	color2Hex = generateRandomHexCode();
	updateColor1(color1Hex);
	updateColor2(color2Hex);
	const color1 = document.querySelector('#color1');
	color1.value = color1Hex;
	const color2 = document.querySelector('#color2');
	color2.value = color2Hex;
}
function swapColors() {
	const temp = color1Hex;
	color1Hex = color2Hex;
	color2Hex = temp;
	updateColor1(color1Hex);
	updateColor2(color2Hex);
	const color1 = document.querySelector('#color1');
	color1.value = color1Hex;
	const color2 = document.querySelector('#color2');
	color2.value = color2Hex;
}

// All shader code
function runShader() {
	glsl.adjustCanvas();

	// Get correct generation pattern
	let generationPatternCode = "";
	switch (preset) {
		case "cell division":
			generationPatternCode = `
				const float k = 0.053 * 1.0;
				const float f = 0.021 * 0.98;
				float s = 1.-exp(-10.0*dot(XY,XY));
				float m = s * hash(I.xyx+int(seed)).x * 0.0035;
			`;
			break
		case "cow":
			generationPatternCode = `
				const float k = 0.05684 * 0.8;
				const float f = 0.02542 * 0.8;

				float s = 1.-exp(-1.2*dot(XY,XY));
				float m = s * hash(I.xyx+int(seed)).x * 0.004;
			`;
			break
		case "eggs":
			generationPatternCode = `
				const float k = 0.053 * 0.95;
				const float f = 0.021 * 0.95;

				float s = 1.-exp(-12.0*dot(XY,XY));
				float m = s * hash(I.xyx+int(seed)).x * 0.0025;
			`;
			break
		case "poltergeist":
			generationPatternCode = `
				
			`;
			break
		case "quickening":
			generationPatternCode = `
				const float k = 0.053 * 1.0;
				const float f = 0.021 * 0.98;

				float s = 1.-exp(-10.0*dot(XY,XY));
				float m = s * hash(I.xyx+int(seed)).x * 0.0035;
			`;
			break
		case "slow eggs":
			generationPatternCode = `
				const float k = 0.053 * 0.95;
				const float f = 0.021 * 0.95;

				float s = 1.-exp(-12.0*dot(XY,XY));
				float m = s * hash(I.xyx+int(seed)).x * 0.0025;
			`;
			break
		case "turing":
			generationPatternCode = `
				const float k = 0.05684 * 0.8;
				const float f = 0.02542 * 0.8;

				float s = 1.0-exp(-1.2*dot(XY,XY));
				float m = s * hash(I.xyx+int(seed)).x * 0.004;
			`;
			break
		case "vibroeggs":
			generationPatternCode = `
				const float k = 0.053 * 0.95;
				const float f = 0.021 * 0.95;

				float s = 1.-exp(-1.0*dot(XY,XY));
				float m = s * hash(I.xyx+int(seed)).x * 0.003;
			`;
			break
	}

	for (let j=0; j<timeSteps; ++j) { // Time steps (controls speed)

		// Preblur
		for (let i=0; i<preblurSteps; ++i) // n preblur steps (controls time until distortion)
		glsl({FP: `

			// Fetch the pixel as a vector (x and y position)

			vec2 v = Src(I).xy;

			{

				// Get width/height of the canvas

				ivec2 D = Src_size();

				// Text substitution
				// Gives us a shortcut between the two to make code more comptact
				// i.e. S(x,y) = Src(ivec2(x,y)).xy
				// Which fetches pixel data at a specific location

				#define S(x,y) Src(ivec2(x,y)).xy

				// Neighboring pixels
				// l:left, r:right, u:up, and d:down
				// % used to adjust for wraparound dimensions
				
				int x = I.x; // base x pos
				int y = I.y; // base y pos
				int l = (x-1+D.x)%D.x; // x-1 pos
				int r = (x+1)%D.x; // x+1 pos
				int u = (y-1+D.y)%D.y; // y-1 pos
				int d = (y+1)%D.y; // y+1 pos

				// Blur the values of all adjacent pixels together
				// This is blurring in all 8 directions (including diagonals)
				// 4.0, 8.0, and 16.0 control the weight of each neighboring pixel
				// Reminder that v is the original pixel’s source vector

				vec2 blur =
					v / 4.0 + // original pixel
					(S(l,y) + S(r,y) + S(x,u) + S(x,d)) / 8.0 + // direct neighbors
					(S(l,u) + S(r,u) + S(l,d) + S(r,d)) / 16.0; // diagonal

				// Blends original pixel value v with blurred value blur
				// Weight 1.0 for original, 0.5 for blur

				v = mix(v, blur, vec2(1.0, 0.5));
			}

			// Output the new pixel vector

			FOut.xy = v;

		`}, state);

		// Introducing randomness based on seed value

		glsl({seed: randomSeed, FP: `

			// Fetch the pixel as a vector (x and y position)

			vec2 v = Src(I).xy;

			{
				// Same blurring steps as before (shortened here)

				ivec2 D = Src_size();
				#define S(x,y) Src(ivec2(x,y)).xy   
				int x = I.x, y = I.y, l = (x-1+D.x)%D.x, r = (x+1)%D.x, u = (y-1+D.y)%D.y, d = (y+1)%D.y;
				vec2 blur = v / 4.0 + (S(l,y) + S(r,y) + S(x,u) + S(x,d)) / 8.0 + (S(l,u) + S(r,u) + S(l,d) + S(r,d)) / 16.0;
				v = mix(v, blur, vec2(1.0, 0.5));

			}

			// Constants that add specific amounts of adjustment
			// k is randomness
			// f is noise generation

			// hash() generates a pseudo-random number
			// s is a smooth step based on difference from the center
			// m is small perturbation added to the result

			${generationPatternCode}

			// Original value v is modified by random offset r
			// Then this is outputed using the constants f and k

			float r = v.x * v.y * v.y + m;
			FOut.xy = v + vec2(-r+f*(1.0-v.x), r-(f+k)*v.y);
			
		`}, state);
	}

	const crop = glsl({
			// crop[0] is the returned image data of cropped region from prev glsl shader
			// Passing that data as the input for the new shader
			state: state[0],
			FP: `
				// Takes the pixel coordinates I and crops them to new region

				FOut = state(

					ivec2(
						I.x + ${originalDimensions/2} - ${croppedDimensions/2},
						I.y + ${originalDimensions/2} - ${croppedDimensions/2}
					)
				);
			`
		}, {
			size: [croppedDimensions, croppedDimensions],
			format: 'rgba16f',
			filter: filterType,
			story: 2,
			tag: 'crop'
		});
	crop[0].filter = filterType;
	crop[1].filter = filterType;

	// Increases resolution of cropped area
	const upres = glsl({
			// crop[0] is the returned image data of cropped region from prev glsl shader
			// Passing that data as the input for the new shader
			crop: crop[0],
			FP: `
				// UV coordinates are color values normalized from (0,0) to (1,1) i.e. top-left to bottom-right

				FOut = crop(UV);
			`
		}, {
			size: [upscaledDimensions, upscaledDimensions],
			format: 'rgba16f',
			filter: filterType,
			story: 2,
			tag: 'upres'
		});
	upres[0].filter = filterType;
	upres[1].filter = filterType;

	// Color mapping and rendering as before
	const colormapped = glsl({
			// upres[0] is the returned image data of cropped region from prev glsl shader
			// Passing that data as the input for the new shader
			upres: upres[0],
			FP: `
				// This extracts the y-component of the color from the upscaled image (using the texture upres[0]), applies a square root to it. This transformation can brighten or adjust the intensity of the colors in the y-channel.

				float v = sqrt(upres(I).y);

				// Edge sharpness
				float steepness = ${steepness}.0;

				// Sigmoid function used to create smooth transitions between two values
				// Centered at 0.4
				// i.e. values of v below 0.4 will gradually move towards lower end of output range, and values above 0.4 will move towards upper end

				float w = 1.0 / (1.0 + exp(-steepness * (v - 0.${sigmoidCenter})));

				// Smooths value w to stay within [0, 1] range

				w = smoothstep(0.0, 1.0, w);

				// Mix interpolates between two colors
				// When w is close to 0, the first color is prioritized
				// Opposite for when w is close to 1

				FOut.rgb = mix(
						vec3(${color1RGB[0]}, ${color1RGB[1]}, ${color1RGB[2]}),
						vec3(${color2RGB[0]}, ${color2RGB[1]}, ${color2RGB[2]}),
						w
					);
			`
		}, {
			size: upres.size,
			filter: filterType,
			tag: 'colormapped'
		});

	let activeShader = colormapped;
	if (shader == 'original') {
		activeShader = state[0];
	} else if (shader == 'cropped') {
		activeShader = crop[0];
	} else if (shader == 'upscaled') {
		activeShader = upres[0];
	} else if (shader == 'colormapped') {
		activeShader = colormapped;
	}

	glsl({ 
		tex: activeShader,
		Aspect: 'cover',
		FP: `
			tex(UV)
		`
	});
}

// Initialize shader
let randomSeed;
let state;
function reset() {
	randomSeed = Math.random()*123243;

	state = glsl({
		seed: randomSeed,
		// Fragment Processor (actual GLSL code)
		FP: `
			// 1.0 is red channel set to 1
			// exp(-400.0*dot(XY, XY)) computes an exponential falloff based on the distance from a center point
			// hash(I.xyx + int(seed)).x is generating a random value based on the input I (likely pixel coordinates) and a seed value

			1.0,
			exp(-400.0*dot(XY,XY))*hash(I.xyx+int(seed)).x,
			0,
			0
		`
	}, {
		size: [originalDimensions, originalDimensions],
		format: 'rgba16f', // RGBA 16bit floating point format
		filter: filterType, // Linear filtering averages neighboring pixels for smooth result (used for scaling image), nearest filtering is pixelated
		story: 2,
		tag: 'state' // For reference later on
	});
	state[0].filter = filterType;
	state[1].filter = filterType;

	// Set the condition to start the loop from the specified iteration
	for (let i=0; i < skipIterations; i++) {
		runShader();
	}
}
reset();

// Main loop
glsl.loop(runShader);