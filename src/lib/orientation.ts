/* ------------------------------------------------------------------ *
 * Lecture du capteur.
 *
 * On n'utilise jamais `alpha` : le cap magnétique diverge entre iOS et
 * Android, demande une permission de plus, et ne sert à rien ici. On
 * reconstruit à la place la direction de la pesanteur dans le repère de
 * l'appareil à partir de beta et gamma seuls :
 *
 *     g = ( cosβ·sinγ , -sinβ , -cosβ·cosγ )
 *     roulis = atan2(gx, -gy)
 *
 * C'est continu même quand le téléphone est à la verticale (où gamma
 * saute), et identique sur les deux plateformes. La calibration retranche
 * ensuite le roulis de départ : on ne travaille qu'en relatif.
 * ------------------------------------------------------------------ */

export type Permission = 'accordee' | 'refusee' | 'inutile' | 'indisponible';

interface RequestPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/** Le jeu n'a de sens qu'avec un capteur — pas de repli souris. */
export function estMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const tactile = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const grossier = window.matchMedia('(pointer: coarse)').matches;
  const capteur = typeof window.DeviceOrientationEvent !== 'undefined';
  return tactile && grossier && capteur;
}

/**
 * iOS 13+ : doit être appelé depuis un vrai geste utilisateur, sinon la
 * promesse est rejetée sans que rien ne s'affiche.
 */
export async function demanderPermission(): Promise<Permission> {
  const orientation = window.DeviceOrientationEvent as unknown as RequestPermission | undefined;
  const motion = window.DeviceMotionEvent as unknown as RequestPermission | undefined;

  if (!orientation) return 'indisponible';
  if (typeof orientation.requestPermission !== 'function') return 'inutile';

  try {
    const reponse = await orientation.requestPermission();
    if (reponse !== 'granted') return 'refusee';
    /* Le devicemotion a sa propre porte : sans lui, pas d'énergie de secousse. */
    if (typeof motion?.requestPermission === 'function') {
      await motion.requestPermission().catch(() => 'denied');
    }
    return 'accordee';
  } catch {
    return 'refusee';
  }
}

const enveloppeDecroissance = 3.4;
const secousseEchelle = 9;

export class Capteur {
  /** Roulis brut, relatif à la calibration (rad). */
  tilt = 0;
  /** Énergie de secousse, enveloppe ~[0,1]. */
  shake = 0;
  /** Faux tant qu'aucun événement n'est arrivé : sert à détecter un capteur mort. */
  actif = false;

  private roulis = 0;
  private offset = 0;
  private dernierVecteur: [number, number, number] | null = null;
  private dernierTemps = 0;

  demarrer(): void {
    window.addEventListener('deviceorientation', this.onOrientation, true);
    window.addEventListener('devicemotion', this.onMotion, true);
  }

  arreter(): void {
    window.removeEventListener('deviceorientation', this.onOrientation, true);
    window.removeEventListener('devicemotion', this.onMotion, true);
  }

  /** « Tiens le téléphone comme tu vas le tenir, puis appuie. » */
  calibrer(): void {
    this.offset = this.roulis;
    this.tilt = 0;
    this.shake = 0;
  }

  /** L'enveloppe de secousse retombe même si le capteur se tait. */
  decroitre(dt: number): void {
    this.shake *= Math.exp(-enveloppeDecroissance * dt);
  }

  private readonly onOrientation = (e: DeviceOrientationEvent): void => {
    if (e.beta === null || e.gamma === null) return;
    const beta = (e.beta * Math.PI) / 180;
    const gamma = (e.gamma * Math.PI) / 180;

    const gx = Math.cos(beta) * Math.sin(gamma);
    const gy = -Math.sin(beta);

    this.roulis = Math.atan2(gx, -gy);
    this.tilt = enroule(this.roulis - this.offset);
    this.actif = true;
  };

  private readonly onMotion = (e: DeviceMotionEvent): void => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null || a.y === null || a.z === null) return;

    const now = performance.now();
    const vecteur: [number, number, number] = [a.x, a.y, a.z];

    if (this.dernierVecteur && now > this.dernierTemps) {
      const dx = vecteur[0] - this.dernierVecteur[0];
      const dy = vecteur[1] - this.dernierVecteur[1];
      const dz = vecteur[2] - this.dernierVecteur[2];
      /* Différence : la pesanteur constante disparaît, il ne reste que le geste. */
      const delta = Math.hypot(dx, dy, dz);
      const instant = Math.min(1, delta / secousseEchelle);
      if (instant > this.shake) this.shake = instant;
    }

    this.dernierVecteur = vecteur;
    this.dernierTemps = now;
    this.actif = true;
  };
}

function enroule(a: number): number {
  let r = a;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

/** Verrouillage portrait — silencieux si le navigateur refuse. */
export async function verrouillerPortrait(): Promise<void> {
  const orientation = screen.orientation as ScreenOrientation & {
    lock?: (o: string) => Promise<void>;
  };
  try {
    await orientation.lock?.('portrait');
  } catch {
    /* Safari iOS ne sait pas faire. Ce n'est pas bloquant. */
  }
}
