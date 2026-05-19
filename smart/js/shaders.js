import { SOLAR_SYSTEM } from './config.js';

export const quadVertexShader = `#version 300 es
void main() {
    vec2 uv = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}`;

export const updateVelFragmentShader = `#version 300 es
precision highp float;
uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform int uCurrentStarCount;
uniform float uG;
uniform float uSoftening;
uniform float uDT;
out vec4 fragColor;

void main() {
    ivec2 texSize = textureSize(uPosTex, 0);
    ivec2 coord = ivec2(gl_FragCoord.xy);
    int myIndex = coord.y * texSize.x + coord.x;

    vec4 myPosMass = texelFetch(uPosTex, coord, 0);
    vec4 myVel = texelFetch(uVelTex, coord, 0);

    if (myIndex >= uCurrentStarCount) {
        fragColor = myVel; return;
    }

    vec2 p1 = myPosMass.xy;
    vec2 vel = myVel.xy;
    vec2 forceAcc = vec2(0.0);

    for (int i = 0; i < uCurrentStarCount; i++) {
        if (i == myIndex) continue;
        ivec2 otherCoord = ivec2(i % texSize.x, i / texSize.x);
        vec4 otherPosMass = texelFetch(uPosTex, otherCoord, 0);
        
        vec2 p2 = otherPosMass.xy;
        float m2 = otherPosMass.z;

        vec2 d = p2 - p1;
        float distSq = d.x * d.x + d.y * d.y + uSoftening;
        float dist = sqrt(distSq);
        
        float f = (uG * m2) / (distSq * dist);
        forceAcc += f * d;
    }

    vel += forceAcc * uDT;
    fragColor = vec4(vel, 0.0, 0.0);
}`;

export const updatePosFragmentShader = `#version 300 es
precision highp float;
uniform sampler2D uPosTex;
uniform sampler2D uVelTex;
uniform float uDT;
out vec4 fragColor;

void main() {
    ivec2 coord = ivec2(gl_FragCoord.xy);
    vec4 posMass = texelFetch(uPosTex, coord, 0);
    vec4 vel = texelFetch(uVelTex, coord, 0);

    vec2 pos = posMass.xy + vel.xy * uDT;
    fragColor = vec4(pos, posMass.z, posMass.w);
}`;

export const renderVertexShader = `#version 300 es
precision highp float;
uniform sampler2D uPosTex;
uniform int uTexWidth;
uniform vec2 uCameraPan;
uniform float uCameraScale;
uniform vec2 uResolution;
out float vNormMass;

void main() {
    int idx = gl_VertexID;
    ivec2 coord = ivec2(idx % uTexWidth, idx / uTexWidth);
    vec4 posMass = texelFetch(uPosTex, coord, 0);

    vec2 worldPos = posMass.xy;
    vNormMass = posMass.w;

    vec2 screenPos = (worldPos * uCameraScale) + uCameraPan;
    vec2 clipPos = (screenPos / uResolution) * 2.0 - 1.0;
    clipPos.y = -clipPos.y;

    gl_Position = vec4(clipPos, 0.0, 1.0);
    
    float massScale = clamp(pow(posMass.z, 0.3), 1.0, 30.0);
    gl_PointSize = clamp(3.0 * sqrt(uCameraScale) * massScale, 2.0, 60.0);
}`;

export const renderFragmentShader = `#version 300 es
precision highp float;
in float vNormMass;
uniform sampler2D uGradientTex;
out vec4 fragColor;

void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    fragColor = texture(uGradientTex, vec2(vNormMass, 0.5));
}`;


export function createGradientCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    if (SOLAR_SYSTEM) {
        gradient.addColorStop(0.0, '#ffcc00');
        gradient.addColorStop(0.2, '#ffffff');
        gradient.addColorStop(0.5, '#00aaff');
        gradient.addColorStop(0.8, '#4444ff');
        gradient.addColorStop(1.0, '#ff4400');
    } else {
        gradient.addColorStop(0.0, '#ff4400');
        gradient.addColorStop(0.2, '#ffcc00');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(0.8, '#88ccff');
        gradient.addColorStop(1.0, '#0044ff');
    }
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 1);
    return canvas;
}