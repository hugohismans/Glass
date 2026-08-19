/** Les couleurs viennent du CSS, jamais d'une constante recopiée ici. */
const NOMS = [
  'puits',
  'ink',
  'penombre',
  'table',
  'halo',
  'liqueur',
  'caustique',
  'marque',
] as const;

export type Nuance = (typeof NOMS)[number];

type Rgb = readonly [number, number, number];

const cache = new Map<Nuance, Rgb>();

function lire(nom: Nuance): Rgb {
  const brut = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${nom}`)
    .trim();
  const hex = brut.replace('#', '');
  if (hex.length !== 6) return [255, 0, 255];
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

export function chargerPalette(): void {
  cache.clear();
  for (const nom of NOMS) cache.set(nom, lire(nom));
}

export function rgb(nom: Nuance): Rgb {
  const v = cache.get(nom);
  if (v) return v;
  const lu = lire(nom);
  cache.set(nom, lu);
  return lu;
}

export function couleur(nom: Nuance, alpha = 1): string {
  const [r, g, b] = rgb(nom);
  return alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
}

/** Mélange deux nuances — sert aux dégradés de lumière, jamais à inventer une teinte. */
export function melange(a: Nuance, b: Nuance, t: number, alpha = 1): string {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const m = (x: number, y: number): number => Math.round(x + (y - x) * t);
  return `rgba(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)},${alpha})`;
}

/** Le blanc du verre : une seule valeur, trois opacités. */
export function verre(alpha: number): string {
  return `rgba(233,244,235,${alpha})`;
}
