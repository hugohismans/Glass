import { RIM } from '../lib/constants';

/** Géométrie de la scène, en pixels CSS. Recalculée au seul redimensionnement. */
export interface Layout {
  w: number;
  h: number;
  dpr: number;
  /** Pixels par unité de simulation (une demi-largeur de verre). */
  unit: number;
  cx: number;
  /** Plan de la table : y = 0 de la simulation. */
  tableY: number;
  /** La lèvre du verre. */
  rimY: number;
  lampX: number;
  lampY: number;
  /** Épaisseur du trait de paroi. */
  paroi: number;
  /**
   * Écrasement de l'ellipse : on voit le verre légèrement de dessus, donc la
   * lèvre, le fond et la surface du liquide sont des ellipses, pas des traits.
   * C'est ce seul chiffre qui rend le verre crédible.
   */
  ry: number;
}

export function calculerLayout(w: number, h: number, dpr: number): Layout {
  /*
   * Le verre occupe une bonne moitié de la largeur : c'est le héros. Le
   * plafond absolu le garde à taille de verre sur un grand écran, où il
   * deviendrait sinon une citerne.
   */
  const unit = Math.min(w * 0.27, (h * 0.6) / RIM, 150);
  const tableY = Math.min(h * 0.78, h - unit * 0.5);
  return {
    w,
    h,
    dpr,
    unit,
    cx: w * 0.5,
    tableY,
    rimY: tableY - RIM * unit,
    lampX: w * 0.16,
    lampY: h * 0.06,
    paroi: Math.max(1.25, unit * 0.026),
    ry: unit * 0.15,
  };
}

/** Repère simulation → écran. */
export function sx(l: Layout, x: number): number {
  return l.cx + x * l.unit;
}

export function sy(l: Layout, y: number): number {
  return l.tableY - y * l.unit;
}
