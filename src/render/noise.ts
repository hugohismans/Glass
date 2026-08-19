/** Générateur déterministe : la condensation d'une partie est reproductible. */
export function mulberry32(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let tuile: CanvasPattern | null = null;

/**
 * Grain fin, en tuile de 128 px, généré une seule fois.
 * Sans lui les dégradés très sombres se cassent en bandes visibles.
 */
export function grain(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (tuile) return tuile;
  const taille = 128;
  const c = document.createElement('canvas');
  c.width = taille;
  c.height = taille;
  const g = c.getContext('2d');
  if (!g) return null;
  const data = g.createImageData(taille, taille);
  const rnd = mulberry32(0x8ea3);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 128 + (rnd() - 0.5) * 255;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  tuile = ctx.createPattern(c, 'repeat');
  return tuile;
}
