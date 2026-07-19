"use client";

import { useEffect, useRef } from "react";

type NeuralNoiseColor = readonly [number, number, number];

interface NeuralNoiseProps {
  color?: NeuralNoiseColor;
  opacity?: number;
  speed?: number;
  className?: string;
}

interface PointerState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

interface ShaderUniforms {
  time: WebGLUniformLocation;
  ratio: WebGLUniformLocation;
  pointerPosition: WebGLUniformLocation;
  color: WebGLUniformLocation;
  opacity: WebGLUniformLocation;
  speed: WebGLUniformLocation;
}

const DEFAULT_COLOR: NeuralNoiseColor = [0.506, 0.549, 0.973];

const VERTEX_SHADER_SOURCE = `
  precision mediump float;
  varying vec2 vUv;
  attribute vec2 a_position;

  void main() {
    vUv = 0.5 * (a_position + 1.0);
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  varying vec2 vUv;
  uniform float u_time;
  uniform float u_ratio;
  uniform vec2 u_pointer_position;
  uniform vec3 u_color;
  uniform float u_opacity;
  uniform float u_speed;

  vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
  }

  float neuro_shape(vec2 uv, float t, float p) {
    vec2 sine_acc = vec2(0.0);
    vec2 res = vec2(0.0);
    float scale = 8.0;

    for (int j = 0; j < 15; j++) {
      uv = rotate(uv, 1.0);
      sine_acc = rotate(sine_acc, 1.0);
      vec2 layer = uv * scale + float(j) + sine_acc - t;
      sine_acc += sin(layer) + 2.4 * p;
      res += (0.5 + 0.5 * cos(layer)) / scale;
      scale *= 1.2;
    }

    return res.x + res.y;
  }

  void main() {
    vec2 uv = 0.5 * vUv;
    uv.x *= u_ratio;
    vec2 pointer = vUv - u_pointer_position;
    pointer.x *= u_ratio;
    float p = clamp(length(pointer), 0.0, 1.0);
    p = 0.5 * pow(1.0 - p, 2.0);
    float t = u_speed * u_time;
    float noise = neuro_shape(uv, t, p);
    noise = 1.2 * pow(noise, 3.0);
    noise += pow(noise, 10.0);
    noise = max(0.0, noise - 0.5);
    noise *= 1.0 - length(vUv - 0.5);
    vec3 color = u_color * noise;
    gl_FragColor = vec4(color, noise * u_opacity);
  }
`;

function createShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("NeuralNoise shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("NeuralNoise program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function getUniform(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation | null {
  return gl.getUniformLocation(program, name);
}

export function NeuralNoise({
  color = DEFAULT_COLOR,
  opacity = 0.72,
  speed = 0.001,
  className = "",
}: NeuralNoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      console.error("NeuralNoise requires WebGL support.");
      return;
    }

    const vertexShader = createShader(gl, VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER);
    const fragmentShader = createShader(
      gl,
      FRAGMENT_SHADER_SOURCE,
      gl.FRAGMENT_SHADER,
    );
    if (!vertexShader || !fragmentShader) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return;
    }

    const time = getUniform(gl, program, "u_time");
    const ratio = getUniform(gl, program, "u_ratio");
    const pointerPosition = getUniform(gl, program, "u_pointer_position");
    const colorUniform = getUniform(gl, program, "u_color");
    const opacityUniform = getUniform(gl, program, "u_opacity");
    const speedUniform = getUniform(gl, program, "u_speed");

    if (
      !time ||
      !ratio ||
      !pointerPosition ||
      !colorUniform ||
      !opacityUniform ||
      !speedUniform
    ) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return;
    }

    const uniforms: ShaderUniforms = {
      time,
      ratio,
      pointerPosition,
      color: colorUniform,
      opacity: opacityUniform,
      speed: speedUniform,
    };
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3f(uniforms.color, color[0], color[1], color[2]);
    gl.uniform1f(uniforms.opacity, Math.min(Math.max(opacity, 0), 1));
    gl.uniform1f(uniforms.speed, speed);

    const pointer: PointerState = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
    };
    let animationFrame = 0;

    const resizeCanvas = () => {
      const devicePixelRatio = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.round(window.innerWidth * devicePixelRatio);
      canvas.height = Math.round(window.innerHeight * devicePixelRatio);
      gl.uniform1f(uniforms.ratio, canvas.width / canvas.height);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const updatePointer = (x: number, y: number) => {
      pointer.targetX = x;
      pointer.targetY = y;
    };
    const handlePointerMove = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const render = (currentTime: number) => {
      pointer.x += (pointer.targetX - pointer.x) * 0.2;
      pointer.y += (pointer.targetY - pointer.y) * 0.2;
      gl.uniform1f(uniforms.time, currentTime);
      gl.uniform2f(
        uniforms.pointerPosition,
        pointer.x / window.innerWidth,
        1 - pointer.y / window.innerHeight,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrame = window.requestAnimationFrame(render);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      gl.deleteBuffer(vertexBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [color, opacity, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
