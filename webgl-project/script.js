const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl){
    alert('WebGL not supported');
}

//loading shader source, compile, link
const vertexShaderSource = document.getElementById('vertex-shader').textContent;
const fragmentShaderSource = document.getElementById('fragment-shader').textContent;

//checks
console.log('Vertex shader source:', vertexShaderSource);
console.log('Fragment shader source:', fragmentShaderSource);
console.log('Vertex shader source length:', vertexShaderSource.length);
console.log('Fragment shader source length:', fragmentShaderSource.length);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

gl.shaderSource(vertexShader, vertexShaderSource);
gl.shaderSource(fragmentShader, fragmentShaderSource);

gl.compileShader(vertexShader);
//check
if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
}

gl.compileShader(fragmentShader);
//check
if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
}

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);
//checks
console.log('Program object:', program);
console.log('Is program valid?', gl.isProgram(program));

if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);
//check
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
}

// Sierpinski gasket generation
//corners of triangle
const corners = [
    [0, 0.8],
    [-0.7, -0.7],
    [0.7, -0.7]
];
const numPoints = 10000;
const points = [];
let currentX = 0;
let currentY = 0;

for (let i = 0; i < numPoints; i++) {
    const randomCorner = Math.floor(Math.random() * 3);
    const cornerX = corners[randomCorner][0];
    const cornerY = corners[randomCorner][1];
    
    currentX = (currentX + cornerX) / 2;
    currentY = (currentY + cornerY) / 2;

    points.push(currentX);
    points.push(currentY);
}

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(PerformanceNavigationTiming, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);

//clearing and drawing
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
glclear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.POINTS, 0, numPOints);