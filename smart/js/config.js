export const MODES = {
    SOLAR_SYSTEM: 0,
    STAR_CLOUD: 1,
    GALAXY: 2,
    EMPTY: 3,
    MULTIPLE_GALAXIES: 4,
    RANDOM: 5, 
    REALGALAXY: 6
};

export const MAX_STARS = 16384; 
export const TEX_SIZE = Math.ceil(Math.sqrt(MAX_STARS));

// Все глобальные динамические параметры симуляции переносим в единый стейт
export const state = {
    currentMode: MODES.STAR_CLOUD, // Начальный режим по умолчанию
    currentStarCount: 0,
    isPaused: false,
    showGrid: false,
    
    // Физика (будет перезаписываться функцией ниже)
    G: 0,
    SOFTENING: 5,
    PHYSICS_DT: 0.5,
    NEW_MASS: 10.0,
    GALAXY_COUNT: 3 // Перенесли сюда, чтобы можно было менять
};

// Функция, которая настраивает стейт под выбранный режим (твоя логика switch)
export function updatePhysicalConstants(mode) {
    state.currentMode = mode;
    state.SOFTENING = (mode === MODES.SOLAR_SYSTEM) ? 0.1 : 5.0;
    state.PHYSICS_DT = (mode === MODES.SOLAR_SYSTEM) ? 0.05 : 0.5;
    state.NEW_MASS = (mode === MODES.SOLAR_SYSTEM) ? 100.0 : 10000000.0;
    
    // 1. Применяем твою логику switch для звезд и G
    switch (mode) {
        case MODES.SOLAR_SYSTEM:
            state.currentStarCount = 9;
            state.G = 1000.0;
            break;
        case MODES.STAR_CLOUD:
            state.currentStarCount = 10000;
            state.G = 0.5;
            break;
        case MODES.GALAXY:
            state.currentStarCount = 14000;
            state.G = 0.1;
            break;
        case MODES.EMPTY:
            state.currentStarCount = 0;
            state.G = 10.0;
            break;
        case MODES.MULTIPLE_GALAXIES:
            state.currentStarCount = 12000;
            state.G = 0.1;
            break;
        case MODES.RANDOM:
            state.currentStarCount = 14000;
            state.G = 0.5;
            break;
        case MODES.REALGALAXY:
            state.currentStarCount = 14000;
            state.G = 5;
            state.SOFTENING = 30

    }

    // 2. Применяем твои правила зависимостей
}

// Инициализируем дефолтное состояние при первом старте приложения
updatePhysicalConstants(state.currentMode);

// Статичные константы, которые не требуют изменений во времени
export const MAX_RADIUS_SCALE = 0.5 * 10;
export const INITIAL_VELOCITY_SCALE = 0.2;
export const RANDOM_RADIUS = true;
export const MIN_MASS = 0.01;
export const MAX_MASS = 30.0;
export const REAL_STEP = 1000 / 60;