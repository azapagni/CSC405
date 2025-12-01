function vec3(x, y, z) {
    return [x, y, z];
}

function subtract(u, v) {
    return [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
}

function normalize(v) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
}

function cross(u, v) {
    return [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
    ];
}

function flatten(arr) {
    return new Float32Array([].concat(...arr));
}

function lookAt(eye, at, up) {
    const n = normalize(subtract(eye, at));
    const u = normalize(cross(up, n));
    const v = normalize(cross(n, u));
   
    return [
        u[0], v[0], n[0], 0,
        u[1], v[1], n[1], 0,
        u[2], v[2], n[2], 0,
        -u[0] * eye[0] - u[1] * eye[1] - u[2] * eye[2],
        -v[0] * eye[0] - v[1] * eye[1] - v[2] * eye[2],
        -n[0] * eye[0] - n[1] * eye[1] - n[2] * eye[2],
        1
    ];
}

function ortho(left, right, bottom, top, near, far) {
    return [
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, -2 / (far - near), 0,
        -(right + left) / (right - left),
        -(top + bottom) / (top - bottom),
        -(far + near) / (far - near),
        1
    ];
}

// Setup WebGL
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    alert('WebGL 2 not supported');
}

// Shaders
const vertexShaderSource = `#version 300 es
    in vec4 aPosition;
    in vec4 aColor;
    out vec4 vColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
            
    void main() {
        vColor = aColor;
        gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    }
`;

const fragmentShaderSource = `#version 300 es
    precision mediump float;
    in vec4 vColor;
    out vec4 fColor;
            
    void main() {
        fColor = vColor;
    }
`;

// Compile shader
function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
    }
    return shader;
}

// Create program
const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
        
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program error:', gl.getProgramInfoLog(program));
}
        
gl.useProgram(program);

// Cube data
const positions = [
    // Front face
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
    // Back face
    -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,
    // Top face
    -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
    // Bottom face
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
    // Right face
    0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,
    0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,
    // Left face
    -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5
];

const colors = [];
const faceColors = [
    [1, 0, 0, 1], // Red
    [0, 1, 0, 1], // Green
    [0, 0, 1, 1], // Blue
    [1, 1, 0, 1], // Yellow
    [1, 0, 1, 1], // Magenta
    [0, 1, 1, 1]  // Cyan
];
        
for (let face of faceColors) {
    for (let i = 0; i < 6; i++) {
        colors.push(...face);
    }
}

const numPositions = positions.length / 3;

// Buffers
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

// Get locations
const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
const aColorLoc = gl.getAttribLocation(program, 'aColor');
const modelViewMatrixLoc = gl.getUniformLocation(program, 'uModelViewMatrix');
const projectionMatrixLoc = gl.getUniformLocation(program, 'uProjectionMatrix');

// Setup attributes
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPositionLoc);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aColorLoc);

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.95, 0.95, 0.95, 1.0);

// Fixed values
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// Variables
let radius = 3.0;
let theta = 0.79;
let phi = 0.79;
let near = -1.0;
let far = 1.0;
let left = -1.0;
let right = 1.0;
let bottom = -1.0;
let ytop = 1.0;

// Event handlers
document.getElementById('radiusSlider').oninput = function(e) {
    radius = parseFloat(e.target.value);
    document.getElementById('radiusValue').textContent = radius.toFixed(1);
};

document.getElementById('thetaSlider').oninput = function(e) {
    theta = parseFloat(e.target.value);
    document.getElementById('thetaValue').textContent = theta.toFixed(2);
};

document.getElementById('phiSlider').oninput = function(e) {
    phi = parseFloat(e.target.value);
    document.getElementById('phiValue').textContent = phi.toFixed(2);
};

document.getElementById('depthSlider').oninput = function(e) {
    const depth = parseFloat(e.target.value);
    far = depth / 2;
    near = -depth / 2;
    document.getElementById('depthValue').textContent = depth.toFixed(1);
};

// Render loop
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
    const eye = vec3(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
    );
            
    const modelViewMatrix = lookAt(eye, at, up);
    const projectionMatrix = ortho(left, right, bottom, ytop, near, far);
            
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
            
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
            
    requestAnimationFrame(render);
}

render();