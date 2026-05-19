export const SOLAR_SYSTEM = false; // true = Солнечная система, false = генерация случайных звезд
export const MAX_STARS = 16384; 

// Объект для изменяемых в рантайме состояний
export const state = {
    currentStarCount: SOLAR_SYSTEM ? 9 : 10000,
    isPaused: false
};

export const G = SOLAR_SYSTEM ? 10000.0 : 0.5;           
export const SOFTENING = SOLAR_SYSTEM ? 0.1 : 15;    
export const PHYSICS_DT = SOLAR_SYSTEM ? 0.05 : 0.5;   

export const MAX_RARIUS_SCALE = 0.5 * 10;
export const INITIAL_VELOCITY_SCALE = 1;
export const RANDOM_RADIUS = true;

export const NEW_MASS = SOLAR_SYSTEM ? 100.0 : 10000000.0;
export const MIN_MASS = 1;
export const MAX_MASS = 12;
export const REAL_STEP = 1000 / 60;     

export const TEX_SIZE = Math.ceil(Math.sqrt(MAX_STARS));