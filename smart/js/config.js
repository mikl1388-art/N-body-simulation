export const MODES = {
    SOLAR_SYSTEM: 0,
    STAR_CLOUD: 1,
    GALAXY: 2
};

// ВЫБЕРИТЕ РЕЖИМ ТУТ:
export const SIM_MODE = MODES.GALAXY; 

export const MAX_STARS = 16384; 

export const state = {
    currentStarCount: SIM_MODE === MODES.SOLAR_SYSTEM ? 9 : 14000,
    isPaused: false
};

export const G = SIM_MODE === MODES.SOLAR_SYSTEM ? 1000.0 : 0.5;           
export const SOFTENING = SIM_MODE === MODES.SOLAR_SYSTEM ? 0.1 : 15;    
export const PHYSICS_DT = SIM_MODE === MODES.SOLAR_SYSTEM ? 0.05 : 0.5;   

export const MAX_RARIUS_SCALE = 0.5 * 10;
export const INITIAL_VELOCITY_SCALE = 1;
export const RANDOM_RADIUS = true;

export const NEW_MASS = SIM_MODE === MODES.SOLAR_SYSTEM ? 100.0 : 10000000.0;
export const MIN_MASS = 1;
export const MAX_MASS = 12;
export const REAL_STEP = 1000 / 60;     

export const TEX_SIZE = Math.ceil(Math.sqrt(MAX_STARS));