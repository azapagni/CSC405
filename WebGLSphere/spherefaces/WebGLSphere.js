import React, { useEffect, useRef, useState } from 'react';

const WebGLSphere = () => {
  const canvasRef = useRef(null);
  const [subdivisions, setSubdivisions] = useState(4);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    
    if (!gl) {
      alert('WebGL not supported');
      return;
    }
    
    // Vertex shader
    const vsSource = `
      attribute vec4 aPosition;
      attribute vec3 aNormal;
      uniform mat4 uModelView;
      uniform mat4 uProjection;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = aNormal;
        vPosition = aPosition.xyz;
        gl_Position = uProjection * uModelView * aPosition;
      }
    `;
    
    // Fragment shader
    const fsSource = `
      precision mediump float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vec3 color = vec3(0.3, 0.6, 0.9);
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    // Compile shader
    function compileShader(gl, source, type) {
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
    
    const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    
    // Vector operations
    function mix(a, b, t) {
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        1.0
      ];
    }
    
    function normalize(v) {
      const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      return [v[0] / len, v[1] / len, v[2] / len, 1.0];
    }
    
    // Generate sphere vertices
    let positions = [];
    
    function triangle(a, b, c) {
      positions.push(...a.slice(0, 3));
      positions.push(...b.slice(0, 3));
      positions.push(...c.slice(0, 3));
    }
    
    function divideTriangle(a, b, c, count) {
      if (count > 0) {
        const ab = normalize(mix(a, b, 0.5));
        const ac = normalize(mix(a, c, 0.5));
        const bc = normalize(mix(b, c, 0.5));
        
        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
      } else {
        triangle(a, b, c);
      }
    }
    
    function tetrahedron(a, b, c, d, n) {
      divideTriangle(a, b, c, n);
      divideTriangle(d, c, b, n);
      divideTriangle(a, d, b, n);
      divideTriangle(a, c, d, n);
    }
    
    const va = [0.0, 0.0, -1.0, 1.0];
    const vb = [0.0, 0.942809, 0.333333, 1.0];
    const vc = [-0.816497, -0.471405, 0.333333, 1.0];
    const vd = [0.816497, -0.471405, 0.333333, 1.0];
    
    tetrahedron(va, vb, vc, vd, subdivisions);
    
    // Create buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    // Setup attributes
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const aNormal = gl.getAttribLocation(program, 'aNormal');
    
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    
    // Setup uniforms
    const uModelView = gl.getUniformLocation(program, 'uModelView');
    const uProjection = gl.getUniformLocation(program, 'uProjection');
    
    // Matrix operations
    function perspective(fov, aspect, near, far) {
      const f = 1.0 / Math.tan(fov / 2);
      return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0
      ];
    }
    
    function rotateY(angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1
      ];
    }
    
    function rotateX(angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1
      ];
    }
    
    function translate(tx, ty, tz) {
      return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1
      ];
    }
    
    function multiply(a, b) {
      const result = new Array(16);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          result[i * 4 + j] = 0;
          for (let k = 0; k < 4; k++) {
            result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
          }
        }
      }
      return result;
    }
    
    // Render
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    
    const projection = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
    const trans = translate(0, 0, -3);
    
    let modelView = trans;
    
    gl.uniformMatrix4fv(uProjection, false, projection);
    gl.uniformMatrix4fv(uModelView, false, modelView);
    
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
  }, [subdivisions]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="border-2 border-gray-700 rounded mb-4"
      />
      
      <div className="flex items-center gap-4">
        <label className="text-white">
          Subdivisions: {subdivisions}
        </label>
        <input
          type="range"
          min="0"
          max="6"
          value={subdivisions}
          onChange={(e) => setSubdivisions(parseInt(e.target.value))}
          className="w-48"
        />
      </div>
    </div>
  );
};

export default WebGLSphere;