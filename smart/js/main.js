import { 
    MAX_STARS, TEX_SIZE, G, SOFTENING, PHYSICS_DT, 
    NEW_MASS, INITIAL_VELOCITY_SCALE, REAL_STEP, state 
} from './config.js';

import { 
    quadVertexShader, updateVelFragmentShader, updatePosFragmentShader, 
    renderVertexShader, renderFragmentShader, createGradientCanvas,
    gridVertexShader, gridFragmentShader
} from './shaders.js';

import { initializeData } from './init-data.js';

const vxInput = document.getElementById('vxInput');
const vyInput = document.getElementById('vyInput');
const vxVal = document.getElementById('vxVal');
const vyVal = document.getElementById('vyVal');

const spawnBtn = document.getElementById('spawnBtn');
const massInput = document.getElementById('massInput');

vxInput.addEventListener('input', (e) => vxVal.textContent = e.target.value);
vyInput.addEventListener('input', (e) => vyVal.textContent = e.target.value);

// --- Инициализация WebGL2 ---
const canvas = document.getElementById('simulationCanvas');
const gl = canvas.getContext('webgl2');
gl.getExtension('EXT_color_buffer_float');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

// --- Вспомогательные функции компиляции ---
function compileShader(source, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
}
function createProg(vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(vs, gl.VERTEX_SHADER));
    gl.attachShader(p, compileShader(fs, gl.FRAGMENT_SHADER));
    gl.linkProgram(p); return p;
}

const velProg = createProg(quadVertexShader, updateVelFragmentShader);
const posProg = createProg(quadVertexShader, updatePosFragmentShader);
const renderProg = createProg(renderVertexShader, renderFragmentShader);
const gridProg = createProg(gridVertexShader, gridFragmentShader);

// --- Подготовка Данных ---
const { posData, velData } = initializeData(canvas.width, canvas.height);

// --- Создание Текстур ---
function createTex(data) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TEX_SIZE, TEX_SIZE, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
}

let posTex = [createTex(posData), createTex(null)];
let velTex = [createTex(velData), createTex(null)];
let currIdx = 0;

const gradientTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, gradientTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, createGradientCanvas());
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

const fb = gl.createFramebuffer();

// --- Управление Камерой ---
let cameraX = canvas.width * 0.5;
let cameraY = canvas.height * 0.5;
let cameraScale = 0.1;
let isDragging = false, startX, startY, startCamX, startCamY;

canvas.addEventListener('mousedown', (e) => {
    isDragging = true; startX = e.clientX; startY = e.clientY;
    startCamX = cameraX; startCamY = cameraY;
});
window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    cameraX = startCamX + (e.clientX - startX);
    cameraY = startCamY + (e.clientY - startY);
});
window.addEventListener('mouseup', () => isDragging = false);

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newScale = e.deltaY < 0 ? cameraScale * zoomFactor : cameraScale / zoomFactor;

    const mouseX = e.offsetX; const mouseY = e.offsetY;
    const worldX = (mouseX - cameraX) / cameraScale;
    const worldY = (mouseY - cameraY) / cameraScale;

    cameraScale = newScale;
    cameraX = mouseX - worldX * cameraScale;
    cameraY = mouseY - worldY * cameraScale;
    updateGridStepText();
});

// --- Добавление Звезд ---
function addNewStar(worldX, worldY, vx, vy, mass) {
    if (state.currentStarCount >= MAX_STARS) {
        alert("Лимит текстуры исчерпан!");
        return;
    }

    const index = state.currentStarCount;
    const px = index % TEX_SIZE;
    const py = Math.floor(index / TEX_SIZE);
    const normMass = 0.5; 
    
    const singlePos = new Float32Array([worldX, worldY, mass, normMass]);
    const singleVel = new Float32Array([vx, vy, 0.0, 0.0]);

    for (let i = 0; i < 2; i++) {
        gl.bindTexture(gl.TEXTURE_2D, posTex[i]);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, px, py, 1, 1, gl.RGBA, gl.FLOAT, singlePos);
        gl.bindTexture(gl.TEXTURE_2D, velTex[i]);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, px, py, 1, 1, gl.RGBA, gl.FLOAT, singleVel);
    }

    state.currentStarCount++;
}

canvas.addEventListener('dblclick', (e) => {
    const mouseX = e.clientX; const mouseY = e.clientY;
    const worldX = (mouseX - cameraX) / cameraScale;
    const worldY = (mouseY - cameraY) / cameraScale;

    addNewStar(
        worldX, worldY, 
        (Math.random() - 0.5) * INITIAL_VELOCITY_SCALE * 250, 
        (Math.random() - 0.5) * INITIAL_VELOCITY_SCALE * 250, 
        NEW_MASS
    );
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        state.isPaused = !state.isPaused;

        // Элементы интерфейса
        const pauseEl = document.getElementById('pauseInfo');
        const crosshairEl = document.getElementById('crosshair');
        
        if (state.isPaused) {
            pauseEl.style.display = 'inline';
            crosshairEl.style.display = 'block'; // Показываем прицел на паузе
        } else {
            pauseEl.style.display = 'none';
            crosshairEl.style.display = 'none';  // Скрываем прицел при запуске
        }
    }
    updateGridStepText();
});

spawnBtn.addEventListener('click', () => {
    // 1. Получаем пиксельный центр холста
    const screenCenterX = canvas.width / 2;
    const screenCenterY = canvas.height / 2;

    // 2. Переводим экранные координаты центра в мировые координаты симуляции
    const worldX = (screenCenterX - cameraX) / cameraScale;
    const worldY = (screenCenterY - cameraY) / cameraScale;

    // 3. Считываем значения из полей ввода
    const mass = parseFloat(massInput.value) || 100;
    const vx = parseFloat(vxInput.value);
    const vy = parseFloat(vyInput.value);

    // 4. Вызываем уже готовую функцию добавления звезды на GPU
    addNewStar(worldX, worldY, vx, vy, mass);
    
    // Опционально: пишем в консоль для отладки
    console.log(`Объект создан в мире: X=${worldX.toFixed(1)}, Y=${worldY.toFixed(1)} с макро-скоростью vx=${vx}, vy=${vy}`);
});

function updateGridStepText() {
    if (!cameraScale) return;
    
    const densityBias = 2.4; // Должно строго совпадать с константой в шейдере
    
    // Аналог формулы на JavaScript
    const log10Scale = Math.log10(cameraScale);
    const power = Math.floor(-log10Scale + densityBias);
    const step = Math.pow(10, power);
    
    // Красиво форматируем числа (например, убираем длинные хвосты у дробных шагов при экстремальном зуме)
    document.getElementById('gridStepVal').textContent = step.toLocaleString('ru-RU');
}

// --- Цикл рендеринга ---
let lastTime = performance.now();
let accumulator = 0;

function loop(currentTime) {
    let dt = currentTime - lastTime;
    lastTime = currentTime;
    if (dt > 250) dt = 250; 
    
    // Если симуляция на паузе, мы НЕ накапливаем время для физических шагов
    if (!state.isPaused) {
        accumulator += dt;
    }

    while (accumulator >= REAL_STEP) {
        let nextIdx = 1 - currIdx;

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);

        // 1. Считаем СКОРОСТИ
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, velTex[nextIdx], 0);
        gl.useProgram(velProg);
        gl.uniform1i(gl.getUniformLocation(velProg, "uCurrentStarCount"), state.currentStarCount);
        gl.uniform1f(gl.getUniformLocation(velProg, "uG"), G);
        gl.uniform1f(gl.getUniformLocation(velProg, "uSoftening"), SOFTENING);
        gl.uniform1f(gl.getUniformLocation(velProg, "uDT"), PHYSICS_DT);
        
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, posTex[currIdx]);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, velTex[currIdx]);
        gl.uniform1i(gl.getUniformLocation(velProg, "uPosTex"), 0);
        gl.uniform1i(gl.getUniformLocation(velProg, "uVelTex"), 1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // 2. Считаем ПОЗИЦИИ
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, posTex[nextIdx], 0);
        gl.useProgram(posProg);
        gl.uniform1f(gl.getUniformLocation(posProg, "uDT"), PHYSICS_DT);
        
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, posTex[currIdx]);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, velTex[nextIdx]);
        gl.uniform1i(gl.getUniformLocation(posProg, "uPosTex"), 0);
        gl.uniform1i(gl.getUniformLocation(posProg, "uVelTex"), 1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        currIdx = nextIdx;
        accumulator -= REAL_STEP;
    }

    // 3. РЕНДЕРИНГ НА ЭКРАН (работает ВСЕГДА, даже на паузе)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.002, 0.004, 0.015, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // --- НОВЫЙ БЛОК: ОТРИСОВКА СЕТКИ НА ПАУЗЕ ---
    if (state.isPaused) {
        gl.useProgram(gridProg);
        gl.uniform2f(gl.getUniformLocation(gridProg, "uCameraPan"), cameraX, cameraY);
        gl.uniform1f(gl.getUniformLocation(gridProg, "uCameraScale"), cameraScale);
        gl.uniform2f(gl.getUniformLocation(gridProg, "uResolution"), canvas.width, canvas.height);
        
        // Рисуем один треугольник, развернутый на весь экран (fullscreen quad)
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    gl.useProgram(renderProg);
    gl.uniform1i(gl.getUniformLocation(renderProg, "uTexWidth"), TEX_SIZE);
    gl.uniform2f(gl.getUniformLocation(renderProg, "uCameraPan"), cameraX, cameraY);
    gl.uniform1f(gl.getUniformLocation(renderProg, "uCameraScale"), cameraScale);
    gl.uniform2f(gl.getUniformLocation(renderProg, "uResolution"), canvas.width, canvas.height);

    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, posTex[currIdx]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, gradientTex);
    gl.uniform1i(gl.getUniformLocation(renderProg, "uPosTex"), 0);
    gl.uniform1i(gl.getUniformLocation(renderProg, "uGradientTex"), 1);

    gl.drawArrays(gl.POINTS, 0, state.currentStarCount);

    gl.disable(gl.BLEND);

    requestAnimationFrame(loop);
}

requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
});