// js/init-data.js
import { 
    SIM_MODE, MODES, TEX_SIZE, G, state, 
    RANDOM_RADIUS, MIN_MASS, MAX_MASS, 
    MAX_RARIUS_SCALE, INITIAL_VELOCITY_SCALE 
} from './config.js';

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
            { name: "Sun",     distance: 0 * D0,    mass: sunMass,  normColor: 0.0 },
            { name: "Mercury", distance: 39 * D0,   mass: 0.055 * M0,   normColor: 0.1 },
            { name: "Venus",   distance: 72 * D0,   mass: 0.815 * M0,   normColor: 0.3 },
            { name: "Earth",   distance: 100 * D0,  mass: 1.000 * M0,   normColor: 0.5 },
            { name: "Mars",    distance: 152 * D0,  mass: 0.107 * M0,   normColor: 0.9 },
            { name: "Jupiter", distance: 520 * D0,  mass: 317.8 * M0,   normColor: 0.2 },
            { name: "Saturn",  distance: 958 * D0,  mass: 95.2 * M0,    normColor: 0.15 },
            { name: "Uranus",  distance: 1922 * D0, mass: 14.5 * M0,    normColor: 0.6 },
            { name: "Neptune", distance: 3005 * D0, mass: 17.1 * M0,    normColor: 0.7 }
        ];

        planets.forEach((planet, i) => {
            const idx = i * 4;
            // Спавним Солнце строго в (0, 0), остальные планеты смещаем по оси X относительно нуля
            posData[idx]     = 0.0 + planet.distance;
            posData[idx + 1] = 0.0;
            posData[idx + 2] = planet.mass;
            posData[idx + 3] = planet.normColor;

            let speed = 0;
            if (planet.distance > 0) {
                speed = Math.sqrt((G * sunMass) / planet.distance);
            }

            velData[idx]     = 0;
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
            
            const minRadius = 300.0; 
            const maxRadius = baseRadiusRef * 3.5;
            const radius = minRadius + Math.pow(Math.random(), 1.5) * (maxRadius - minRadius);
            
            const mass = MIN_MASS + Math.random() * (MAX_MASS - MIN_MASS);
            const idx = i * 4;

            posData[idx]     = Math.cos(angle) * radius;
            posData[idx + 1] = Math.sin(angle) * radius;
            posData[idx + 2] = mass;
            posData[idx + 3] = (radius - minRadius) / (maxRadius - minRadius);

            const orbitalSpeed = Math.sqrt((G * coreMass) / radius);

            velData[idx]     = -Math.sin(angle) * orbitalSpeed;
            velData[idx + 1] =  Math.cos(angle) * orbitalSpeed;
        }

    // --- РЕЖИМ 3: СТАНДАРТНОЕ ЗВЕЗДНОЕ ОБЛАКО (БЕЗ ЯДРА) ---
    } else {
        document.getElementById('modeInfo').textContent = `Режим: Звездное облако (${state.currentStarCount} тел)`;
        for (let i = 0; i < state.currentStarCount; i++) {
            const angle = (RANDOM_RADIUS ? Math.random() : (i / (state.currentStarCount + 1))) * Math.PI * 2;
            const radius = (RANDOM_RADIUS ? Math.random() : 1) * (baseRadiusRef * 0.5 * MAX_RARIUS_SCALE);
            const mass = MIN_MASS + Math.random() * (MAX_MASS - MIN_MASS);

            const idx = i * 4;
            posData[idx]     = Math.cos(angle) * radius;
            posData[idx + 1] = Math.sin(angle) * radius;
            posData[idx + 2] = mass;
            posData[idx + 3] = (mass - MIN_MASS) / (MAX_MASS - MIN_MASS);

            // Тангенциальная скорость для закручивания облака вокруг центра (0, 0)
            velData[idx]     = -Math.sin(angle) * (Math.sqrt(radius) * INITIAL_VELOCITY_SCALE);
            velData[idx + 1] =  Math.cos(angle) * (Math.sqrt(radius) * INITIAL_VELOCITY_SCALE);
        }
    }

    return { posData, velData };
}