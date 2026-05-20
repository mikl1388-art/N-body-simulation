// js/init-data.js
import {
    SIM_MODE, MODES, TEX_SIZE, G, state,
    RANDOM_RADIUS, MIN_MASS, MAX_MASS,
    MAX_RARIUS_SCALE, INITIAL_VELOCITY_SCALE, GALAXY_COUNT
} from './config.js';

let minGalaxyDist = 300.0;

export function initializeData(screenWidth, screenHeight) {
    const posData = new Float32Array(TEX_SIZE * TEX_SIZE * 4);
    const velData = new Float32Array(TEX_SIZE * TEX_SIZE * 4);

    // Базовый размер для расчета масштабирования облака/галактики на основе экрана
    const baseRadiusRef = Math.min(screenWidth, screenHeight);

    // --- РЕЖИМ 1: СОЛНЕЧНАЯ СИСТЕМА ---
    if (SIM_MODE === MODES.SOLAR_SYSTEM) {
        document.getElementById('modeInfo').textContent = "Режим: Солнечная Система (8 планет)";

        const M0 = 1;
        const D0 = 15;
        const sunMass = 333000 * M0;
        const planets = [
            { name: "Sun", distance: 0 * D0, mass: sunMass, normColor: 0.0 },
            { name: "Mercury", distance: 39 * D0, mass: 0.055 * M0, normColor: 0.1 },
            { name: "Venus", distance: 72 * D0, mass: 0.815 * M0, normColor: 0.3 },
            { name: "Earth", distance: 100 * D0, mass: 1.000 * M0, normColor: 0.5 },
            { name: "Mars", distance: 152 * D0, mass: 0.107 * M0, normColor: 0.9 },
            { name: "Jupiter", distance: 520 * D0, mass: 317.8 * M0, normColor: 0.2 },
            { name: "Saturn", distance: 958 * D0, mass: 95.2 * M0, normColor: 0.15 },
            { name: "Uranus", distance: 1922 * D0, mass: 14.5 * M0, normColor: 0.6 },
            { name: "Neptune", distance: 3005 * D0, mass: 17.1 * M0, normColor: 0.7 }
        ];

        planets.forEach((planet, i) => {
            const idx = i * 4;
            // Спавним Солнце строго в (0, 0), остальные планеты смещаем по оси X относительно нуля
            posData[idx] = 0.0 + planet.distance;
            posData[idx + 1] = 0.0;
            posData[idx + 2] = planet.mass;
            posData[idx + 3] = planet.normColor;

            let speed = 0;
            if (planet.distance > 0) {
                speed = Math.sqrt((G * sunMass) / planet.distance);
            }

            velData[idx] = 0;
            velData[idx + 1] = speed;
        });

        // --- РЕЖИМ 2: СВЕРХМАССИВНОЕ ЯДРО (ГАЛАКТИКА) ---
    } else if (SIM_MODE === MODES.GALAXY) {
        document.getElementById('modeInfo').textContent = `Режим: Галактика (${state.currentStarCount} тел)`;

        // 1. Создаем центральное сверхмассивное тело строго в точке (0, 0)
        const coreMass = 5000000.0;
        posData[0] = 0.0;
        posData[1] = 0.0;
        posData[2] = coreMass;
        posData[3] = 0.0;

        velData[0] = 0.0;
        velData[1] = 0.0;

        // 2. Распределяем остальные звезды вокруг нуля
        for (let i = 1; i < state.currentStarCount; i++) {
            const angle = Math.random() * Math.PI * 2;

            const minRadius = minGalaxyDist;
            const maxRadius = baseRadiusRef * 3.5;
            const radius = minRadius + Math.pow(Math.random(), 1.5) * (maxRadius - minRadius);

            const mass = MIN_MASS + Math.random() * (MAX_MASS - MIN_MASS);
            const idx = i * 4;

            posData[idx] = Math.cos(angle) * radius;
            posData[idx + 1] = Math.sin(angle) * radius;
            posData[idx + 2] = mass;
            posData[idx + 3] = (radius - minRadius) / (maxRadius - minRadius);

            const orbitalSpeed = Math.sqrt((G * coreMass) / radius);

            velData[idx] = -Math.sin(angle) * orbitalSpeed;
            velData[idx + 1] = Math.cos(angle) * orbitalSpeed;
        }
    } else if (SIM_MODE === MODES.MULTIPLE_GALAXIES) {
        document.getElementById('modeInfo').textContent = `Режим: Кластер галактик (${state.currentStarCount} тел)`;

        const starsPerGalaxy = Math.floor(state.currentStarCount / GALAXY_COUNT);
        const coreMass = 3000000.0; // Масса черной дыры в центре каждой галактики

        // Радиус спавна самих галактик вокруг центра мира (0,0)
        const clusterRadius = baseRadiusRef * 10.0;
        // Максимальная скорость движения самих галактик
        const maxGalaxySpeed = 15.0;

        for (let g = 0; g < GALAXY_COUNT; g++) {
            // 1. Задаем случайную начальную позицию и вектор движения для всей галактики
            const gAngle = Math.random() * Math.PI * 2;
            const gDist = Math.random() * clusterRadius;

            const galaxyX = Math.cos(gAngle) * gDist;
            const galaxyY = Math.sin(gAngle) * gDist;

            // Случайное направление движения для этой галактики
            const moveAngle = Math.random() * Math.PI * 2;
            const moveSpeed = (0.3 + Math.random() * 0.7) * maxGalaxySpeed;
            const galaxyVx = Math.cos(moveAngle) * moveSpeed;
            const galaxyVy = Math.sin(moveAngle) * moveSpeed;

            // Индекс для черной дыры этой галактики
            const coreIdx = g * starsPerGalaxy * 4;

            // Спавним локальное ядро
            posData[coreIdx] = galaxyX;
            posData[coreIdx + 1] = galaxyY;
            posData[coreIdx + 2] = coreMass;
            posData[coreIdx + 3] = 0.0; // Белое ядро

            velData[coreIdx] = galaxyVx;
            velData[coreIdx + 1] = galaxyVy;

            // 2. Заполняем звезды этой галактики
            // Вычисляем до какого индекса крутить цикл (последней галактике отдаем остаток звезд)
            const endIdx = (g === GALAXY_COUNT - 1) ? state.currentStarCount : (g + 1) * starsPerGalaxy;

            for (let i = g * starsPerGalaxy + 1; i < endIdx; i++) {
                const idx = i * 4;

                // Внутренняя структура галактики (вокруг её локального нуля)
                const starAngle = Math.random() * Math.PI * 2;
                const minRadius = minGalaxyDist;
                const maxRadius = baseRadiusRef * 1.5; // Делаем их чуть компактнее, чтобы не сливались сразу
                const radius = minRadius + Math.pow(Math.random(), 1.5) * (maxRadius - minRadius);
                const mass = MIN_MASS + Math.random() * (MAX_MASS - MIN_MASS);

                // Глобальная позиция = позиция галактики + локальное смещение звезды
                posData[idx] = galaxyX + Math.cos(starAngle) * radius;
                posData[idx + 1] = galaxyY + Math.sin(starAngle) * radius;
                posData[idx + 2] = mass;
                posData[idx + 3] = (radius - minRadius) / (maxRadius - minRadius);

                // Локальная орбитальная скорость внутри диска
                const orbitalSpeed = Math.sqrt((G * coreMass) / radius);
                const localVx = -Math.sin(starAngle) * orbitalSpeed;
                const localVy = Math.cos(starAngle) * orbitalSpeed;

                // Глобальная скорость = скорость движения галактики + орбитальная скорость звезды
                velData[idx] = galaxyVx + localVx;
                velData[idx + 1] = galaxyVy + localVy;
            }
        }
    } else if (SIM_MODE === MODES.RANDOM) {
        document.getElementById('modeInfo').textContent = `Режим: Случайное заполнение (${state.currentStarCount} тел)`;
        let massSum = 0;
        let totalV = 0;   // Сюда будем складывать обычные скорости (модули)
        let totalV2 = 0;  // Сюда будем складывать квадраты скоростей

        const velocityMultiplier = INITIAL_VELOCITY_SCALE * 50;
        const clusterDiameter = baseRadiusRef * MAX_RARIUS_SCALE * 10; // Диаметр вашего скопления

        for (let i = 0; i < state.currentStarCount; i++) {
            const mass = MIN_MASS + Math.random() * (MAX_MASS - MIN_MASS);
            massSum += mass;

            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * clusterDiameter / 2;

            const idx = i * 4;
            posData[idx] = Math.cos(angle) * radius;
            posData[idx + 1] = Math.sin(angle) * radius;
            posData[idx + 2] = mass;
            posData[idx + 3] = (mass - MIN_MASS) / (MAX_MASS - MIN_MASS);

            // Генерация случайного направления вектора
            let vx = Math.random() - 0.5;
            let vy = Math.random() - 0.5;
            let v_raw = Math.sqrt(vx ** 2 + vy ** 2);

            // Нормализуем вектор (делаем длину равной 1)
            vx = vx / v_raw;
            vy = vy / v_raw;

            // ВАЖНО: Масштабируем случайную величину v_raw, чтобы получить реальную скорость звезды
            // (Поскольку vx и vy нормализованы, реальный модуль скорости равен этой величине)
            let current_speed = v_raw * velocityMultiplier;

            // Накапливаем данные для статистики
            totalV += current_speed;             // Сумма скоростей для Средней Арифметической
            totalV2 += (current_speed ** 2);     // Сумма квадратов для Среднеквадратичной

            // Записываем компоненты скорости в массив
            velData[idx] = vx * current_speed;
            velData[idx + 1] = vy * current_speed;
        }

        // Количество тел
        const N = state.currentStarCount;

        // 1. Считаем Среднюю Арифметическую Скорость (Va)
        let V_average = totalV / N;

        // 2. Считаем Среднеквадратичную Скорость (V_rms)
        let V_rms = Math.sqrt(totalV2 / N);

        // 3. Считаем Теоретическую Скорость Убегания (V_escape) по формуле, которую мы обсуждали
        let V_escape = Math.sqrt((16 * G * massSum) / clusterDiameter);

        console.log(`--- СТАТИСТИКА СКОПЛЕНИЯ ---`);
        console.log(`Средняя арифметическая скорость (Va): ${V_average}`);
        console.log(`Среднеквадратичная скорость (V_rms): ${V_rms}`);
        console.log(`Вторая космическая скорость скопления (V_escape): ${V_escape}`);
    }
    else {
        document.getElementById('modeInfo').textContent = `Режим: Звездное облако (${state.currentStarCount} тел)`;
        for (let i = 0; i < state.currentStarCount; i++) {
            const angle = (RANDOM_RADIUS ? Math.random() : (i / (state.currentStarCount + 1))) * Math.PI * 2;
            const radius = (RANDOM_RADIUS ? Math.random() : 1) * (baseRadiusRef * 0.5 * MAX_RARIUS_SCALE);
            const mass = MIN_MASS + Math.random() * (MAX_MASS - MIN_MASS);

            const idx = i * 4;
            posData[idx] = Math.cos(angle) * radius;
            posData[idx + 1] = Math.sin(angle) * radius;
            posData[idx + 2] = mass;
            posData[idx + 3] = (mass - MIN_MASS) / (MAX_MASS - MIN_MASS);

            // Тангенциальная скорость для закручивания облака вокруг центра (0, 0)
            velData[idx] = -Math.sin(angle) * (Math.sqrt(radius) * INITIAL_VELOCITY_SCALE);
            velData[idx + 1] = Math.cos(angle) * (Math.sqrt(radius) * INITIAL_VELOCITY_SCALE);
        }
    }

    return { posData, velData };
}