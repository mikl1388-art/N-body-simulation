export const MODES = {
    SOLAR_SYSTEM: 0,
    STAR_CLOUD: 1,
    GALAXY: 2,
    EMPTY: 3,
    MULTIPLE_GALAXIES: 4,
    RANDOM:5
};

// ВЫБЕРИТЕ РЕЖИМ ТУТ:
export const SIM_MODE = MODES.RANDOM; 

export const MAX_STARS = 16384; 

let init_stars = 0;
let g = 0;

switch (SIM_MODE) {
    case MODES.SOLAR_SYSTEM:
        init_stars = 9;
        g = 1000.0;
        break;
    case MODES.STAR_CLOUD:
        init_stars = 10000;
        g = 0.5;
        break;
    case MODES.GALAXY:
        init_stars = 14000;
        g = 0.1;
        break;
    case MODES.EMPTY:
        init_stars = 0;
        g = 10.0;
        break;
    case MODES.MULTIPLE_GALAXIES:
        init_stars = 12000;
        g = 0.1;
        break;
    case MODES.RANDOM:
        init_stars = 14000;
        g = 0.5
}

export const state = {
    currentStarCount: init_stars,
    isPaused: false,
    showGrid: false
};

export const GALAXY_COUNT = 3;

export const G = g;
export const SOFTENING = SIM_MODE === MODES.SOLAR_SYSTEM ? 0.1 : 5;    
export const PHYSICS_DT = SIM_MODE === MODES.SOLAR_SYSTEM ? 0.05 : 0.5;   

export const MAX_RARIUS_SCALE = 0.5 * 10;
export const INITIAL_VELOCITY_SCALE = 0.2;
export const RANDOM_RADIUS = true;

export const NEW_MASS = SIM_MODE === MODES.SOLAR_SYSTEM ? 100.0 : 10000000.0;
export const MIN_MASS = 0.01;
export const MAX_MASS = 30.0;
export const REAL_STEP = 1000 / 60;     

export const TEX_SIZE = Math.ceil(Math.sqrt(MAX_STARS));