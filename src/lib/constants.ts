/* ------------------------------------------------------------------ *
 * Toutes les constantes de « feel » vivent ici, et nulle part ailleurs.
 * On les règle sur un vrai téléphone, à la fin, en itérant.
 * Unités : longueurs en demi-largeurs de verre (R = 1), angles en rad,
 * temps en secondes. Aucun pixel dans ce fichier.
 * ------------------------------------------------------------------ */

/** Demi-largeur intérieure du verre. Toute la géométrie en découle. */
export const R = 1;

/** Hauteur du bord (la lèvre), mesurée depuis le fond intérieur. */
export const RIM = 2.4;

/** Contenance du verre quand le liquide affleure exactement le bord. */
export const VOLUME_MAX_ML = 380;

/** Remplissage de départ. À ras bord : il reste 20 ml de marge. */
export const VOLUME_START_ML = 360;

/** Conversion niveau ↔ millilitres (parois droites : la relation est linéaire). */
export const ML_PER_UNIT = VOLUME_MAX_ML / RIM;

/* -- 1. Lecture du capteur -------------------------------------------- */

/** Constante de temps du passe-bas sur l'inclinaison. Le gyro est bruité. */
export const TILT_TAU = 0.06;

/** Au-delà, on considère que le joueur a renoncé : on ne simule plus de pente. */
export const MAX_TILT = 1.05; // 60°

/* -- 2. Le ressort de la surface -------------------------------------- */
/*
 * accel = -K·(surfaceAngle - tilt) - C·velocity
 * ω  = √K  ≈ 6,5 rad/s  → ≈ 1 Hz, la fréquence d'un verre tenu à la main
 * ζ  = C / (2√K) ≈ 0,40 → sous-amorti : dépasse, revient, ~3 oscillations
 * C'est ici que se joue la totalité du ressenti. Ne pas toucher à l'aveugle.
 */
export const SPRING_K = 42;
export const SPRING_C = 5.2;

/* -- 3. Les deux harmoniques ------------------------------------------ *
 * Le mode fondamental de ballottement est déjà porté par le ressort
 * ci-dessus. On ajoute donc les modes 2 (symétrique, les deux parois
 * montent ensemble) et 3 (antisymétrique). Les deux ont un ventre aux
 * parois — c'est là que ça déborde, donc c'est là que ça doit bouger.
 * Le rapport des pulsations n'est pas entier : les ondes battent et la
 * surface ne se répète jamais.
 */
export const WAVE_MODES = [2, 3] as const;
export const WAVE_OMEGA: readonly [number, number] = [9.2, 11.3];
export const WAVE_DAMP: readonly [number, number] = [1.05, 1.5];

/** Énergie injectée par les à-coups du ressort (|accélération angulaire|). */
export const SLOSH_GAIN: readonly [number, number] = [0.014, 0.009];

/** Énergie injectée par les secousses lues au devicemotion. */
export const SHAKE_GAIN: readonly [number, number] = [0.05, 0.032];

/** Plafond d'amplitude, sinon la surface se replie sur elle-même. */
export const WAVE_AMP_MAX = 0.42;

/* -- 4. Débordement ---------------------------------------------------- */
/*
 * dV/dt = SPILL_RATE · dépassement^SPILL_EXP
 * L'exposant > 1 rend un gros dépassement disproportionnellement plus cher
 * qu'un petit : c'est le geste brusque qui coûte, pas la dérive lente.
 */
export const SPILL_RATE = 7.2;
export const SPILL_EXP = 1.5;

/** Dépassement à partir duquel on considère qu'« ça déborde » (UI, vibration). */
export const SPILL_THRESHOLD = 0.004;

/* -- 5. Gouttes et flaque ---------------------------------------------- */

/** g ramené à l'échelle du verre (une demi-largeur ≈ 3,5 cm). */
export const GRAVITY = 280;

export const DROP_MAX = 220;
export const SPLAT_MAX = 150;

/** Millilitres perdus pour une goutte émise. */
export const ML_PER_DROP = 0.9;

/* -- 6. Intégration ---------------------------------------------------- */

/** Pas de simulation fixe. Le rendu peut ramer, le ressort non. */
export const FIXED_DT = 1 / 120;

/** Garde-fou : au-delà, on laisse filer le temps plutôt que de spiraler. */
export const MAX_SUBSTEPS = 6;
