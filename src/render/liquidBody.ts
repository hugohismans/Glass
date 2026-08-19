import { R, RIM, VOLUME_MAX_ML } from '../lib/constants';
import { agitation, heightAt } from '../lib/liquid';
import type { LiquidState } from '../lib/liquid';
import { bordArriere, bordAvant, ECHANTILLONS } from './glass';
import { couleur, melange, verre } from './palette';
import { sx } from './layout';
import type { Layout } from './layout';

/** Le corps du liquide, borné en haut par le bord avant de la surface. */
export function cheminLiquide(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  s: LiquidState,
): void {
  ctx.beginPath();
  ctx.moveTo(sx(l, -R), l.tableY + l.ry * 0.9);
  for (let i = 0; i <= ECHANTILLONS; i++) {
    const x = -R + (2 * R * i) / ECHANTILLONS;
    ctx.lineTo(sx(l, x), bordAvant(l, s, x));
  }
  ctx.lineTo(sx(l, R), l.tableY + l.ry * 0.9);
  ctx.closePath();
}

/** L'air au-dessus : borné en bas par le bord arrière de la surface. */
export function cheminAir(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  s: LiquidState,
): void {
  const haut = l.rimY - l.ry * 2;
  ctx.beginPath();
  ctx.moveTo(sx(l, -R), haut);
  for (let i = 0; i <= ECHANTILLONS; i++) {
    const x = -R + (2 * R * i) / ECHANTILLONS;
    ctx.lineTo(sx(l, x), bordArriere(l, s, x));
  }
  ctx.lineTo(sx(l, R), haut);
  ctx.closePath();
}

/** Le disque de surface : l'ellipse vue de trois quarts, entre les deux bords. */
function cheminSurface(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  s: LiquidState,
): void {
  ctx.beginPath();
  for (let i = 0; i <= ECHANTILLONS; i++) {
    const x = -R + (2 * R * i) / ECHANTILLONS;
    const y = bordArriere(l, s, x);
    if (i === 0) ctx.moveTo(sx(l, x), y);
    else ctx.lineTo(sx(l, x), y);
  }
  for (let i = ECHANTILLONS; i >= 0; i--) {
    const x = -R + (2 * R * i) / ECHANTILLONS;
    ctx.lineTo(sx(l, x), bordAvant(l, s, x));
  }
  ctx.closePath();
}

export function dessinerLiquide(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  s: LiquidState,
): void {
  if (s.volumeMl <= 0.5) return;

  const gauche = sx(l, -R);
  const droite = sx(l, R);
  const largeur = l.unit * 2;
  const hautBoite = l.rimY - l.ry * 2;
  const hauteurBoite = RIM * l.unit + l.ry * 3;

  ctx.save();
  cheminLiquide(ctx, l, s);
  ctx.clip();

  /*
   * 1. La masse. Une liqueur n'est pas une peinture : elle est sombre dans
   *    l'épaisseur, claire là où la lumière entre (juste sous la surface) et
   *    là où elle ressort (le fond, d'où part la caustique).
   */
  const corps = ctx.createLinearGradient(0, l.rimY, 0, l.tableY);
  corps.addColorStop(0, melange('liqueur', 'caustique', 0.3, 0.88));
  corps.addColorStop(0.16, couleur('liqueur', 0.86));
  corps.addColorStop(0.55, melange('liqueur', 'puits', 0.42, 0.88));
  corps.addColorStop(0.9, melange('liqueur', 'puits', 0.58, 0.88));
  corps.addColorStop(1, melange('liqueur', 'puits', 0.2, 0.86));
  ctx.fillStyle = corps;
  ctx.fillRect(gauche - 2, hautBoite, largeur + 4, hauteurBoite);

  /* 2. La lampe est à gauche : ce côté est traversé, l'autre est dans l'ombre. */
  const traverse = ctx.createLinearGradient(gauche, 0, droite, 0);
  traverse.addColorStop(0, couleur('caustique', 0.16));
  traverse.addColorStop(0.22, couleur('caustique', 0.05));
  traverse.addColorStop(0.62, couleur('puits', 0.08));
  traverse.addColorStop(1, couleur('puits', 0.34));
  ctx.fillStyle = traverse;
  ctx.fillRect(gauche - 2, hautBoite, largeur + 4, hauteurBoite);

  /*
   * 3. Le faisceau. Il entre par la surface côté lampe et descend en biais
   *    jusqu'au fond — c'est littéralement le trajet qui fabrique la tache
   *    sur la table. Sans lui, la caustique semblerait posée là par hasard.
   */
  const entree = sx(l, -0.45);
  const yEntree = bordAvant(l, s, -0.45);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(entree, yEntree);
  ctx.rotate(0.34 + s.surfaceAngle * 0.5);
  const faisceau = ctx.createLinearGradient(-l.unit * 0.45, 0, l.unit * 0.45, 0);
  faisceau.addColorStop(0, couleur('caustique', 0));
  faisceau.addColorStop(0.5, couleur('caustique', 0.1));
  faisceau.addColorStop(1, couleur('caustique', 0));
  ctx.fillStyle = faisceau;
  ctx.fillRect(-l.unit * 0.45, 0, l.unit * 0.9, RIM * l.unit);
  ctx.restore();

  /* 4. Les parois assombrissent le liquide : plus d'épaisseur à traverser. */
  const bords = ctx.createLinearGradient(gauche, 0, droite, 0);
  bords.addColorStop(0, couleur('puits', 0.4));
  bords.addColorStop(0.1, couleur('puits', 0));
  bords.addColorStop(0.9, couleur('puits', 0));
  bords.addColorStop(1, couleur('puits', 0.42));
  ctx.fillStyle = bords;
  ctx.fillRect(gauche - 2, hautBoite, largeur + 4, hauteurBoite);
  ctx.restore();

  /* 5. Le disque de surface : le liquide vu de dessus, la zone la plus claire. */
  ctx.save();
  cheminSurface(ctx, l, s);
  ctx.clip();
  const yMoyen = l.tableY - heightAt(s, 0) * l.unit;
  const dessus = ctx.createLinearGradient(0, yMoyen - l.ry, 0, yMoyen + l.ry);
  dessus.addColorStop(0, melange('liqueur', 'caustique', 0.62, 0.96));
  dessus.addColorStop(0.55, melange('liqueur', 'caustique', 0.18, 0.96));
  dessus.addColorStop(1, couleur('liqueur', 0.92));
  ctx.fillStyle = dessus;
  ctx.fillRect(gauche - 2, yMoyen - l.ry * 4, largeur + 4, l.ry * 8);
  ctx.restore();

  /* 6. Le fil de lumière sur l'arête arrière — il suit chaque ride. */
  const vivacite = agitation(s);
  ctx.save();
  ctx.strokeStyle = couleur('caustique', 0.3 + vivacite * 0.45);
  ctx.lineWidth = Math.max(1, l.unit * 0.014);
  ctx.beginPath();
  for (let i = 0; i <= ECHANTILLONS; i++) {
    const x = -R + (2 * R * i) / ECHANTILLONS;
    const y = bordArriere(l, s, x);
    if (i === 0) ctx.moveTo(sx(l, x), y);
    else ctx.lineTo(sx(l, x), y);
  }
  ctx.stroke();
  ctx.restore();

  /* 7. Le ménisque : le liquide remonte le long des parois. */
  dessinerMenisque(ctx, l, s, -1);
  dessinerMenisque(ctx, l, s, 1);
}

/** Une tache douce au contact de la paroi — surtout pas un rectangle. */
function dessinerMenisque(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  s: LiquidState,
  cote: -1 | 1,
): void {
  const x = sx(l, cote * R);
  const y = l.tableY - heightAt(s, cote * R) * l.unit;
  if (y < l.rimY - l.ry || y > l.tableY) return;

  const rx = l.unit * 0.2;
  const ry = l.unit * 0.055;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, couleur('caustique', 0.42));
  g.addColorStop(0.5, couleur('caustique', 0.16));
  g.addColorStop(1, couleur('caustique', 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Le verre vide n'est pas une absence : il reste une pellicule au fond. */
export function dessinerFondDeVerre(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  s: LiquidState,
): void {
  if (s.volumeMl > VOLUME_MAX_ML * 0.02) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = verre(0.04);
  ctx.beginPath();
  ctx.ellipse(l.cx, l.tableY, l.unit * 0.9, l.ry * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
