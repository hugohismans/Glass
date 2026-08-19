import { describe, expect, it } from 'vitest';
import { FIXED_DT, R, RIM, VOLUME_START_ML } from './constants';
import { agitation, createLiquid, heightAt, level, slopeAt, step } from './liquid';
import type { LiquidInput, LiquidState } from './liquid';

const CALME: LiquidInput = { tilt: 0, shake: 0 };

function run(state: LiquidState, input: LiquidInput, seconds: number): void {
  const n = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < n; i++) step(state, input, FIXED_DT);
}

describe('repos', () => {
  it('ne perd rien quand le verre reste à plat', () => {
    const s = createLiquid();
    run(s, CALME, 20);
    expect(s.volumeMl).toBe(VOLUME_START_ML);
    expect(s.lostMl).toBe(0);
    expect(s.drops).toHaveLength(0);
  });

  it('garde la surface plane au repos', () => {
    const s = createLiquid();
    run(s, CALME, 5);
    expect(heightAt(s, -R)).toBeCloseTo(heightAt(s, R), 6);
    expect(slopeAt(s, 0)).toBeCloseTo(0, 6);
    expect(agitation(s)).toBeCloseTo(0, 3);
  });
});

describe('ressort', () => {
  it('dépasse la consigne — le système est sous-amorti', () => {
    const s = createLiquid();
    const cible = 0.25;
    let maxAngle = 0;
    for (let i = 0; i < 240; i++) {
      step(s, { tilt: cible, shake: 0 }, FIXED_DT);
      maxAngle = Math.max(maxAngle, s.surfaceAngle);
    }
    expect(maxAngle).toBeGreaterThan(cible * 1.08);
  });

  it('revient à la consigne après quelques oscillations', () => {
    const s = createLiquid();
    run(s, { tilt: 0.2, shake: 0 }, 6);
    expect(s.surfaceAngle).toBeCloseTo(0.2, 2);
    expect(Math.abs(s.surfaceVel)).toBeLessThan(1e-3);
  });

  it('reste en retard sur le capteur — le retard est tout le sujet', () => {
    const s = createLiquid();
    step(s, { tilt: 0.4, shake: 0 }, FIXED_DT);
    expect(Math.abs(s.surfaceAngle)).toBeLessThan(0.4);
  });

  it('reste stable sous un capteur en créneau pendant une minute', () => {
    const s = createLiquid();
    for (let i = 0; i < 60 / FIXED_DT; i++) {
      const t = i * FIXED_DT;
      step(s, { tilt: Math.sign(Math.sin(t * 9)) * 0.8, shake: 0.6 }, FIXED_DT);
    }
    expect(Number.isFinite(s.surfaceAngle)).toBe(true);
    expect(Number.isFinite(s.volumeMl)).toBe(true);
    expect(Math.abs(s.surfaceAngle)).toBeLessThanOrEqual(1.06);
    expect(s.volumeMl).toBeGreaterThanOrEqual(0);
  });
});

describe('débordement', () => {
  it('ne rend jamais de liquide', () => {
    const s = createLiquid();
    let precedent = s.volumeMl;
    for (let i = 0; i < 3000; i++) {
      step(s, { tilt: Math.sin(i * 0.05) * 0.7, shake: 0.4 }, FIXED_DT);
      expect(s.volumeMl).toBeLessThanOrEqual(precedent + 1e-9);
      precedent = s.volumeMl;
    }
    expect(s.volumeMl).toBeLessThan(VOLUME_START_ML);
  });

  it('ne favorise aucun des deux côtés', () => {
    const gauche = createLiquid();
    const droite = createLiquid();
    run(gauche, { tilt: -0.35, shake: 0 }, 4);
    run(droite, { tilt: 0.35, shake: 0 }, 4);
    expect(gauche.lostMl).toBeGreaterThan(0);
    const ecart = Math.abs(gauche.lostMl - droite.lostMl) / droite.lostMl;
    expect(ecart).toBeLessThan(0.05);
  });

  it('punit davantage le geste brusque que la dérive lente', () => {
    const lent = createLiquid();
    const brusque = createLiquid();
    const duree = 3;
    const n = Math.round(duree / FIXED_DT);
    for (let i = 0; i < n; i++) {
      step(lent, { tilt: (i / n) * 0.3, shake: 0 }, FIXED_DT);
      step(brusque, { tilt: i < n / 2 ? 0.3 : 0, shake: 0 }, FIXED_DT);
    }
    expect(brusque.lostMl).toBeGreaterThan(lent.lostMl);
  });

  it('émet des gouttes qui finissent en flaque sur la table', () => {
    const s = createLiquid();
    run(s, { tilt: 0.6, shake: 0.2 }, 1);
    expect(s.lostMl).toBeGreaterThan(0);
    run(s, CALME, 2);
    expect(s.splats.length).toBeGreaterThan(0);
    for (const d of s.drops) expect(d.y).toBeGreaterThan(0);
  });

  it('vide le verre sans jamais passer sous zéro', () => {
    const s = createLiquid();
    run(s, { tilt: 1.0, shake: 1 }, 40);
    expect(s.volumeMl).toBeGreaterThanOrEqual(0);
    expect(level(s)).toBeLessThanOrEqual(RIM + 1e-9);
  });
});

describe('géométrie', () => {
  it('incline la surface exactement de surfaceAngle', () => {
    const s = createLiquid();
    run(s, { tilt: 0.15, shake: 0 }, 6);
    const pente = (heightAt(s, R) - heightAt(s, -R)) / (2 * R);
    expect(pente).toBeCloseTo(Math.tan(s.surfaceAngle), 4);
  });

  it('donne une pente analytique exacte — la caustique en dépend', () => {
    const s = createLiquid();
    run(s, { tilt: 0.2, shake: 0.8 }, 1.5);
    const x = 0.37;
    const eps = 1e-5;
    const numerique = (heightAt(s, x + eps) - heightAt(s, x - eps)) / (2 * eps);
    expect(slopeAt(s, x)).toBeCloseTo(numerique, 4);
  });
});
