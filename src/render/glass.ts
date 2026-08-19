import { R, RIM } from '../lib/constants';
import { heightAt } from '../lib/liquid';
import type { LiquidState } from '../lib/liquid';
import { mulberry32 } from './noise';
import { couleur, verre } from './palette';
import { sx, sy } from './layout';
import type { Layout } from './layout';

export interface Buee {
  u: number;
  v: number;
  r: number;
  a: number;
}

/** Échantillonnage de la surface. 40 points suffisent pour deux harmoniques. */
export const ECHANTILLONS = 40;

/** Demi-hauteur de l'ellipse à l'abscisse x — 0 aux parois, maximum au centre. */
export function bombement(l: Layout, x: number): number {
  const t = Math.max(0, 1 - (x / R) * (x / R));
  return l.ry * Math.sqrt(t);
}

/** Bord de la surface le plus proche du regard. */
export function bordAvant(l: Layout, s: LiquidState, x: number): number {
  return sy(l, heightAt(s, x)) + bombement(l, x);
}

/** Bord de la surface le plus éloigné. */
export function bordArriere(l: Layout, s: LiquidState, x: number): number {
  return sy(l, heightAt(s, x)) - bombement(l, x);
}

/** L'intérieur du verre : tout ce qu'on dessine y est enfermé. */
export function cheminInterieur(ctx: CanvasRenderingContext2D, l: Layout): void {
  ctx.beginPath();
  ctx.moveTo(sx(l, -R), l.rimY - l.ry);
  ctx.lineTo(sx(l, -R), l.tableY);
  ctx.ellipse(l.cx, l.tableY, l.unit, l.ry, 0, Math.PI, 0, true);
  ctx.lineTo(sx(l, R), l.rimY - l.ry);
  ctx.ellipse(l.cx, l.rimY, l.unit, l.ry, 0, 0, Math.PI, true);
  ctx.closePath();
}

/**
 * Ce qui se trouve DERRIÈRE le verre, et que la partie immergée décale.
 * Deux éléments seulement, mais placés exprès pour traverser le liquide :
 * l'arête de la table et le fond du verre. Sans eux, la réfraction ne se
 * verrait nulle part.
 */
export function dessinerFond(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  decalage: number,
): void {
  ctx.save();
  ctx.translate(decalage, 0);

  ctx.strokeStyle = verre(0.1);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx(l, -R) - l.unit * 0.4, l.tableY + 0.5);
  ctx.lineTo(sx(l, R) + l.unit * 0.4, l.tableY + 0.5);
  ctx.stroke();

  /* Le fond du verre, vu de dessus : la moitié arrière de l'ellipse. */
  ctx.strokeStyle = verre(0.16);
  ctx.lineWidth = Math.max(1, l.paroi * 0.7);
  ctx.beginPath();
  ctx.ellipse(l.cx, l.tableY, l.unit * 0.94, l.ry * 0.9, 0, Math.PI, 0);
  ctx.stroke();

  ctx.restore();
}

/** Les parois, la lèvre, le lisere, le pied. Dessinés par-dessus le liquide. */
export function dessinerVerre(ctx: CanvasRenderingContext2D, l: Layout): void {
  const gauche = sx(l, -R);
  const droite = sx(l, R);

  /* 1. Les deux parois. Traits fins, plus denses près de la table. */
  const paroiGrad = ctx.createLinearGradient(0, l.rimY, 0, l.tableY);
  paroiGrad.addColorStop(0, verre(0.2));
  paroiGrad.addColorStop(0.55, verre(0.09));
  paroiGrad.addColorStop(1, verre(0.2));
  ctx.strokeStyle = paroiGrad;
  ctx.lineWidth = l.paroi;
  ctx.beginPath();
  ctx.moveTo(gauche, l.rimY);
  ctx.lineTo(gauche, l.tableY);
  ctx.moveTo(droite, l.rimY);
  ctx.lineTo(droite, l.tableY);
  ctx.stroke();

  /* 2. L'épaisseur du verre : un second trait, plus faible, en retrait. */
  const ep = l.paroi * 1.8;
  ctx.strokeStyle = verre(0.05);
  ctx.lineWidth = l.paroi * 0.8;
  ctx.beginPath();
  ctx.moveTo(gauche - ep, l.rimY);
  ctx.lineTo(gauche - ep, l.tableY);
  ctx.moveTo(droite + ep, l.rimY);
  ctx.lineTo(droite + ep, l.tableY);
  ctx.stroke();

  /*
   * 3. Le lisere. La lampe est en haut à gauche : c'est la paroi DROITE,
   * celle qui lui tourne le dos, qui prend la lumière rasante.
   */
  const lisere = ctx.createLinearGradient(0, l.rimY, 0, l.tableY);
  lisere.addColorStop(0, couleur('caustique', 0.55));
  lisere.addColorStop(0.35, couleur('caustique', 0.16));
  lisere.addColorStop(1, couleur('caustique', 0.03));
  ctx.strokeStyle = lisere;
  ctx.lineWidth = Math.max(1, l.paroi * 0.55);
  ctx.beginPath();
  ctx.moveTo(droite + l.paroi * 0.6, l.rimY + l.ry * 0.4);
  ctx.lineTo(droite + l.paroi * 0.6, l.tableY - l.ry * 0.3);
  ctx.stroke();

  /* 3 bis. Le reflet de la lampe sur la paroi qui lui fait face. */
  const reflet = ctx.createLinearGradient(gauche, 0, gauche + l.unit * 0.3, 0);
  reflet.addColorStop(0, couleur('caustique', 0));
  reflet.addColorStop(0.45, couleur('caustique', 0.13));
  reflet.addColorStop(1, couleur('caustique', 0));
  ctx.save();
  ctx.fillStyle = reflet;
  ctx.fillRect(gauche + l.unit * 0.05, l.rimY + l.ry * 0.8, l.unit * 0.22, l.unit * 1.5);
  ctx.restore();

  /* 4. La lèvre : une ellipse, moitié arrière sourde, moitié avant vive. */
  ctx.lineWidth = l.paroi;
  ctx.strokeStyle = verre(0.13);
  ctx.beginPath();
  ctx.ellipse(l.cx, l.rimY, l.unit, l.ry, 0, Math.PI, 0);
  ctx.stroke();
  ctx.strokeStyle = verre(0.26);
  ctx.beginPath();
  ctx.ellipse(l.cx, l.rimY, l.unit, l.ry, 0, 0, Math.PI);
  ctx.stroke();

  /* 5. Le pied : du verre massif, donc plus lumineux. */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(l.cx, l.tableY, l.unit + ep, l.ry * 1.15, 0, 0, Math.PI * 2);
  const pied = ctx.createLinearGradient(gauche, 0, droite, 0);
  pied.addColorStop(0, verre(0.05));
  pied.addColorStop(0.5, verre(0.02));
  pied.addColorStop(0.86, couleur('caustique', 0.13));
  pied.addColorStop(1, verre(0.06));
  ctx.fillStyle = pied;
  ctx.fill();
  ctx.strokeStyle = verre(0.14);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  /* 6. La graduation gravée : un seul trait, à la contenance nominale. */
  const gradY = l.rimY + l.ry + l.unit * 0.08;
  ctx.strokeStyle = verre(0.11);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gauche + l.unit * 0.12, gradY);
  ctx.lineTo(gauche + l.unit * 0.44, gradY);
  ctx.stroke();
}

/** La condensation. Régénérée à chaque partie, immobile pendant la partie. */
export function genererBuee(graine: number, combien = 26): Buee[] {
  const rnd = mulberry32(graine);
  const gouttes: Buee[] = [];
  for (let i = 0; i < combien; i++) {
    /*
     * Elles sont sur la paroi la plus proche, donc réparties sur toute la
     * largeur — mais la courbure du verre les tasse vers les bords, comme
     * sur n'importe quel cylindre. D'où la racine carrée.
     */
    const cote = rnd() < 0.5 ? -1 : 1;
    const u = cote * (0.3 + 0.68 * Math.sqrt(rnd()));
    gouttes.push({
      u,
      v: 0.1 + rnd() * 0.84,
      r: 0.009 + rnd() * 0.017,
      a: 0.07 + rnd() * 0.14,
    });
  }
  return gouttes;
}

export function dessinerBuee(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  gouttes: readonly Buee[],
  opacite: number,
): void {
  if (opacite <= 0.01) return;
  ctx.save();
  for (const g of gouttes) {
    const x = sx(l, g.u);
    const y = l.tableY - g.v * RIM * l.unit;
    const r = g.r * l.unit;

    /* Un cœur sombre : une goutte sur le verre replie ce qu'il y a derrière. */
    ctx.globalAlpha = g.a * opacite * 1.1;
    ctx.fillStyle = couleur('puits', 0.5);
    ctx.beginPath();
    ctx.arc(x, y + r * 0.15, r, 0, Math.PI * 2);
    ctx.fill();

    /* Et un éclat minuscule, du côté de la lampe. */
    ctx.globalAlpha = g.a * opacite * 2.6;
    ctx.fillStyle = verre(0.9);
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.34, r * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
