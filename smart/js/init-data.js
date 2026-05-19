import { 
    SOLAR_SYSTEM, TEX_SIZE, G, state, 
    RANDOM_RADIUS, MIN_MASS, MAX_MASS, 
    MAX_RARIUS_SCALE, INITIAL_VELOCITY_SCALE 
} from './config.js';

export function initializeData(screenWidth, screenHeight) {
    const posData = new Float32Array(TEX_SIZE * TEX_SIZE * 4);
    const velData = new Float32Array(TEX_SIZE * TEX_SIZE * 4);

    const screenCenterX = screenWidth / 2;
    const screenCenterY = screenHeight / 2;

    if (SOLAR_SYSTEM) {
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
            const x = screenCenterX + planet.distance;
            const y = screenCenterY;
            
            posData[idx]     = x;
            posData[idx + 1] = y;
            posData[idx + 2] = planet.mass;
            posData[idx + 3] = planet.normColor;

            let speed = 0;
            if (planet.distance > 0) {
                speed = Math.sqrt((G * sunMass) / planet.distance);
            }

            velData[idx]     = 0;
            velData[idx + 1] = speed; 
        });

    } else {
        document.getElementById('modeInfo').textContent = `Режим: Звездное облако (${state.currentStarCount} тел)`;
        for (let i = 0; i < state.currentStarCount; i++) {
            const angle = (RANDOM_RADIUS ? Math.random() : (i / (state.currentStarCount + 1))) * Math.PI * 2;
            const radius = (RANDOM_RADIUS ? Math.random() : 1) * (Math.min(screenCenterX, screenCenterY) * MAX_RARIUS_SCALE);
            const mass = MIN_MASS + Math.random() * (MAX_MASS - MIN_MASS);

            const idx = i * 4;
            posData[idx]     = screenCenterX + Math.cos(angle) * radius;
            posData[idx + 1] = screenCenterY + Math.sin(angle) * radius;
            posData[idx + 2] = mass;
            posData[idx + 3] = (mass - MIN_MASS) / (MAX_MASS - MIN_MASS);

            velData[idx]     = -Math.sin(angle) * (Math.sqrt(radius) * INITIAL_VELOCITY_SCALE);
            velData[idx + 1] =  Math.cos(angle) * (Math.sqrt(radius) * INITIAL_VELOCITY_SCALE);
        }
    }

    return { posData, velData };
}