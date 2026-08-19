/* ------------------------------------------------------------------ *
 * La physique du liquide. Pure : aucun DOM, aucun canvas, aucun Svelte.
 * Un pas de simulation = `step()`, à appeler à cadence fixe (FIXED_DT).
 * ------------------------------------------------------------------ */

import {
  DROP_MAX,
  GRAVITY,
  MAX_TILT,
  ML_PER_DROP,
  ML_PER_UNIT,
  R,
  RIM,
  SHAKE_GAIN,
  SLOSH_GAIN,
  SPILL_EXP,
  SPILL_RATE,
  SPILL_THRESHOLD,
  SPLAT_MAX,
  SPRING_C,
  SPRING_K,
  TILT_TAU,
  VOLUME_START_ML,
  WAVE_AMP_MAX,
  WAVE_DAMP,
  WAVE_MODES,
  WAVE_OMEGA,
} from './constants';

export interface Wave {
  amp: number;
  phase: number;
}

/** Une goutte en vol. Repère verre : x ∈ [-R,R] aux parois, y = 0 sur la table. */
export interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/** Une trace de liquide sur la table. Ne disparaît jamais. */
export interface Splat {
  x: number;
  r: number;
  a: number;
}

export interface LiquidState {
  /** Inclinaison lue au capteur, filtrée. */
  tilt: number;
  /** Angle réel de la surface — poursuit `tilt` en oscillant. */
  surfaceAngle: number;
  surfaceVel: number;
  waves: [Wave, Wave];
  /** Décroissant. Jamais autre chose. */
  volumeMl: number;
  /** Dépassement maximal du bord au pas courant (0 si rien ne déborde). */
  overflow: number;
  /** Millilitres perdus pendant le pas courant. */
  spilledMl: number;
  /** Total perdu depuis le début de la partie. */
  lostMl: number;
  drops: Drop[];
  splats: Splat[];
  /** Compteur interne pour ne pas émettre une goutte par sous-pas. */
  dropDebt: number;
  seed: number;
}

export interface LiquidInput {
  /** Inclinaison brute (rad), déjà relative à la calibration. */
  tilt: number;
  /** Énergie de secousse, normalisée ~[0,1]. */
  shake: number;
}

export function createLiquid(volumeMl: number = VOLUME_START_ML): LiquidState {
  return {
    tilt: 0,
    surfaceAngle: 0,
    surfaceVel: 0,
    waves: [
      { amp: 0, phase: 0 },
      { amp: 0, phase: Math.PI / 3 },
    ],
    volumeMl,
    overflow: 0,
    spilledMl: 0,
    lostMl: 0,
    drops: [],
    splats: [],
    dropDebt: 0,
    seed: 1,
  };
}

/** Hauteur du repos, mesurée depuis le fond. Parois droites : linéaire. */
export function level(state: LiquidState): number {
  return state.volumeMl / ML_PER_UNIT;
}

/** Forme du mode n sur [-R, R] : ventre à chaque paroi. */
function shape(n: number, x: number): number {
  return Math.cos((n * Math.PI * (x + R)) / (2 * R));
}

function shapeSlope(n: number, x: number): number {
  const k = (n * Math.PI) / (2 * R);
  return -k * Math.sin(k * (x + R));
}

/** Hauteur de la surface à l'abscisse x. */
export function heightAt(state: LiquidState, x: number): number {
  let h = level(state) + Math.tan(state.surfaceAngle) * x;
  h += state.waves[0].amp * Math.cos(state.waves[0].phase) * shape(WAVE_MODES[0], x);
  h += state.waves[1].amp * Math.cos(state.waves[1].phase) * shape(WAVE_MODES[1], x);
  return h;
}

/** Pente dh/dx à l'abscisse x. Sert à la réfraction et à la caustique. */
export function slopeAt(state: LiquidState, x: number): number {
  let s = Math.tan(state.surfaceAngle);
  s += state.waves[0].amp * Math.cos(state.waves[0].phase) * shapeSlope(WAVE_MODES[0], x);
  s += state.waves[1].amp * Math.cos(state.waves[1].phase) * shapeSlope(WAVE_MODES[1], x);
  return s;
}

/** Générateur pseudo-aléatoire déterministe : la simulation reste rejouable. */
function rand(state: LiquidState): number {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Un pas de simulation à cadence fixe.
 * L'ordre compte : capteur → ressort → ondes → débordement → gouttes.
 */
export function step(state: LiquidState, input: LiquidInput, dt: number): void {
  state.spilledMl = 0;

  /* 1. Le capteur, lissé. */
  const target = clamp(input.tilt, -MAX_TILT, MAX_TILT);
  state.tilt += (target - state.tilt) * (1 - Math.exp(-dt / TILT_TAU));

  /* 2. Le ressort amorti : la surface poursuit l'inclinaison sans la rattraper. */
  const accel = -SPRING_K * (state.surfaceAngle - state.tilt) - SPRING_C * state.surfaceVel;
  state.surfaceVel += accel * dt;
  state.surfaceAngle += state.surfaceVel * dt;
  if (state.surfaceAngle > MAX_TILT) {
    state.surfaceAngle = MAX_TILT;
    if (state.surfaceVel > 0) state.surfaceVel = 0;
  } else if (state.surfaceAngle < -MAX_TILT) {
    state.surfaceAngle = -MAX_TILT;
    if (state.surfaceVel < 0) state.surfaceVel = 0;
  }

  /* 3. Les deux harmoniques : nourries par les à-coups et les secousses. */
  const jolt = Math.abs(accel);
  for (let i = 0; i < 2; i++) {
    const w = i === 0 ? state.waves[0] : state.waves[1];
    const gainSlosh = i === 0 ? SLOSH_GAIN[0] : SLOSH_GAIN[1];
    const gainShake = i === 0 ? SHAKE_GAIN[0] : SHAKE_GAIN[1];
    const damp = i === 0 ? WAVE_DAMP[0] : WAVE_DAMP[1];
    const omega = i === 0 ? WAVE_OMEGA[0] : WAVE_OMEGA[1];

    w.amp += (gainSlosh * jolt + gainShake * input.shake) * dt;
    w.amp *= Math.exp(-damp * dt);
    if (w.amp > WAVE_AMP_MAX) w.amp = WAVE_AMP_MAX;
    w.phase = (w.phase + omega * dt) % (Math.PI * 2);
  }

  /* 4. Débordement aux deux parois. Le volume ne fait que descendre. */
  const hLeft = heightAt(state, -R);
  const hRight = heightAt(state, R);
  const overLeft = Math.max(0, hLeft - RIM);
  const overRight = Math.max(0, hRight - RIM);
  state.overflow = Math.max(overLeft, overRight);

  if (state.volumeMl > 0 && state.overflow > SPILL_THRESHOLD) {
    const rate =
      SPILL_RATE * (Math.pow(overLeft, SPILL_EXP) + Math.pow(overRight, SPILL_EXP));
    const lost = Math.min(state.volumeMl, rate * ML_PER_UNIT * dt);
    state.volumeMl -= lost;
    state.spilledMl = lost;
    state.lostMl += lost;

    /* Les gouttes partent de la paroi qui déborde le plus. */
    state.dropDebt += lost / ML_PER_DROP;
    while (state.dropDebt >= 1 && state.drops.length < DROP_MAX) {
      state.dropDebt -= 1;
      const side = overLeft > overRight ? -1 : 1;
      const push = 0.6 + 4 * state.overflow;
      state.drops.push({
        x: side * R,
        y: RIM + rand(state) * 0.04,
        vx: side * (push + rand(state) * 0.5),
        vy: -0.4 + rand(state) * 1.2,
        r: 0.035 + rand(state) * 0.045,
      });
    }
    if (state.dropDebt > 4) state.dropDebt = 4;
  } else {
    state.dropDebt = 0;
  }

  /* 5. Les gouttes tombent, puis restent sur la table. */
  for (let i = state.drops.length - 1; i >= 0; i--) {
    const d = state.drops[i];
    if (!d) continue;
    d.vy -= GRAVITY * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (d.y <= 0) {
      state.drops.splice(i, 1);
      addSplat(state, d.x, d.r);
    }
  }
}

function addSplat(state: LiquidState, x: number, r: number): void {
  /* Une goutte qui retombe au même endroit élargit la flaque au lieu d'en créer une. */
  for (const s of state.splats) {
    if (Math.abs(s.x - x) < r * 2.2) {
      s.r = Math.min(1.4, s.r + r * 0.45);
      s.a = Math.min(0.85, s.a + 0.05);
      return;
    }
  }
  if (state.splats.length >= SPLAT_MAX) return;
  state.splats.push({ x, r: r * 1.6, a: 0.32 });
}

/** Énergie visible de la surface : sert au rendu (vivacité de la caustique). */
export function agitation(state: LiquidState): number {
  return clamp(
    Math.abs(state.surfaceVel) * 0.18 + (state.waves[0].amp + state.waves[1].amp) * 2.2,
    0,
    1,
  );
}
