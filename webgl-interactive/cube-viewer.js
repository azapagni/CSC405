// ============================================
// HELPER FUNCTIONS
// ============================================
function vec3(x, y, z) {
    return [x, y, z];
}

function vec4(x, y, z, w) {
    return [x, y, z, w];
}

function flatten(arr) {
    if (arr[0].length) {
        return new Float32Array([].concat(...arr));
    }
    return new Float32Array(arr);
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

// ============================================
// WEBGL SETUP
// ============================================
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    alert('WebGL 2 is not supported');
}

// Vertex Shader
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

// Fragment Shader
const fragmentShaderSource = `#version 300 es
    precision mediump float;
    in vec4 vColor;
    out vec4 fColor;
    
    void main() {
        fColor = vColor;
    }
`;

// Compile shaders
function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

// Create program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// ============================================
// CREATE CUBE GEOMETRY
// ============================================
const positions = [
    // Front face (RED)
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,
    
    // Back face (GREEN)
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,
    
    // Top face (BLUE)
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,
    
    // Bottom face (YELLOW)
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,
    
    // Right face (MAGENTA)
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,
    
    // Left face (CYAN)
    -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5
];

const colors = [];
const faceColors = [
    [1.0, 0.0, 0.0, 1.0],  // Red
    [0.0, 1.0, 0.0, 1.0],  // Green
    [0.0, 0.0, 1.0, 1.0],  // Blue
    [1.0, 1.0, 0.0, 1.0],  // Yellow
    [1.0, 0.0, 1.0, 1.0],  // Magenta
    [0.0, 1.0, 1.0, 1.0]   // Cyan
];

for (let face of faceColors) {
    for (let i = 0; i < 6; i++) {
        colors.push(...face);
    }
}

const numPositions = positions.length / 3;

// Create buffers
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

// Get attribute locations
const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
const aColorLoc = gl.getAttribLocation(program, 'aColor');
const modelViewMatrixLoc = gl.getUniformLocation(program, 'uModelViewMatrix');
const projectionMatrixLoc = gl.getUniformLocation(program, 'uProjectionMatrix');

// Setup vertex attributes
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPositionLoc);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aColorLoc);

// ============================================
// INITIALIZATION - Fixed values
// ============================================
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// Variables controlled by sliders
let radius = 3.0;
let theta = 0.79;  // ~45 degrees
let phi = 0.79;    // ~45 degrees
let near = -1.0;
let far = 1.0;
let left = -1.0;
let right = 1.0;
let bottom = -1.0;
let ytop = 1.0;

let eye;
let modelViewMatrix;
let projectionMatrix;

// Enable depth testing
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.18, 1.0);

// ============================================
// EVENT HANDLERS
// ============================================
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

document.getElementById('horizontalSlider').oninput = function(e) {
    const h = parseFloat(e.target.value);
    left = -h;
    right = h;
    document.getElementById('horizontalValue').textContent = h.toFixed(1);
};

document.getElementById('verticalSlider').oninput = function(e) {
    const v = parseFloat(e.target.value);
    bottom = -v;
    ytop = v;
    document.getElementById('verticalValue').textContent = v.toFixed(1);
};

function resetView() {
    radius = 3.0;
    theta = 0.79;
    phi = 0.79;
    near = -1.0;
    far = 1.0;
    left = -1.0;
    right = 1.0;
    bottom = -1.0;
    ytop = 1.0;
    
    document.getElementById('radiusSlider').value = 3;
    document.getElementById('thetaSlider').value = 0.79;
    document.getElementById('phiSlider').value = 0.79;
    document.getElementById('depthSlider').value = 2;
    document.getElementById('horizontalSlider').value = 1;
    document.getElementById('verticalSlider').value = 1;
    
    document.getElementById('radiusValue').textContent = '3.0';
    document.getElementById('thetaValue').textContent = '0.79';
    document.getElementById('phiValue').textContent = '0.79';
    document.getElementById('depthValue').textContent = '2.0';
    document.getElementById('horizontalValue').textContent = '1.0';
    document.getElementById('verticalValue').textContent = '1.0';
}

// ============================================
// RENDER LOOP
// ============================================
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Calculate eye position using spherical coordinates
    eye = vec3(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
    );
    
    // Create view and projection matrices
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    // Send matrices to shaders
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    // Draw the cube
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
    
    requestAnimationFrame(render);
}

// Start rendering
render();