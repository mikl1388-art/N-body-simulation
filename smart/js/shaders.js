import { SIM_MODE, MODES } from './config.js';

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

export const gridVertexShader = `#version 300 es
void main() {
    // Генерируем full-screen quad из gl_VertexID
    vec2 uv = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}`;

export const gridFragmentShader = `#version 300 es
precision highp float;

uniform vec2 uCameraPan;
uniform float uCameraScale;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
    // 1. Переводим текущую пиксельную координату экрана в мировые координаты симуляции
    vec2 screenPos = gl_FragCoord.xy;
    
    // В WebGL gl_FragCoord.y идет снизу вверх, а в камере сверху вниз, инвертируем
    float screenYInverted = uResolution.y - screenPos.y;
    
    vec2 worldPos = (vec2(screenPos.x, screenYInverted) - uCameraPan) / uCameraScale;

    // 2. Выбираем шаг сетки в зависимости от масштаба (чтобы сетка не была слишком плотной)
    float densityBias = 2.4; // Должно строго совпадать с константой в скрипте 
    
    // Вычисляем логарифм по основанию 10 от масштаба камеры
    float log10Scale = log(uCameraScale) / log(10.0);
    
    // Находим ближайшую степень десятки для шага сетки
    float power = floor(-log10Scale + densityBias);
    float baseStep = pow(10.0, power);

    // 3. Вычисляем расстояние до ближайшей линии сетки (в мировых координатах)
    vec2 grid = abs(mod(worldPos + baseStep * 0.5, baseStep) - baseStep * 0.5);
    
    // Переводим толщину линии (например, 1 пиксель) обратно в мировые единицы
    vec2 thickness = vec2(1.0 / uCameraScale);

    // 4. Рисуем сетку
    float lineAlpha = 0.0;
    if (grid.x < thickness.x || grid.y < thickness.y) {
        lineAlpha = 0.12; // Прозрачность линий сетки
    }

    // Подсветим оси координат (X=0 и Y=0) чуть ярче
    if (abs(worldPos.x) < thickness.x * 1.5 || abs(worldPos.y) < thickness.y * 1.5) {
        lineAlpha = 0.35;
    }

    if (lineAlpha == 0.0) discard; // Пропускаем пустые пиксели

    fragColor = vec4(0.0, 0.66, 1.0, lineAlpha); // Красивый космический голубой цвет
}`;

export function createGradientCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    switch (SIM_MODE) {
        case MODES.SOLAR_SYSTEM:
            gradient.addColorStop(0.0, '#ffcc00');
            gradient.addColorStop(0.2, '#ffffff');
            gradient.addColorStop(0.5, '#00aaff');
            gradient.addColorStop(0.8, '#4444ff');
            gradient.addColorStop(1.0, '#ff4400');
            break;
        case MODES.GALAXY:
            // Градиент для галактики: белое ядро -> голубые звезды -> фиолетовая периферия
            gradient.addColorStop(0.0, '#ffffff');
            gradient.addColorStop(0.1, '#e0f7ff');
            gradient.addColorStop(0.4, '#00aaff');
            gradient.addColorStop(0.7, '#7b00ff');
            gradient.addColorStop(1.0, '#220044');
            break;
        default:
            gradient.addColorStop(0.0, '#ff4400');
            gradient.addColorStop(0.2, '#ffcc00');
            gradient.addColorStop(0.5, '#ffffff');
            gradient.addColorStop(0.8, '#88ccff');
            gradient.addColorStop(1.0, '#0044ff');
            break;
    }
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 1);
    return canvas;
}