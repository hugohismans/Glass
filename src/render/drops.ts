import type { LiquidState } from '../lib/liquid';
import { couleur, melange } from './palette';
import { sx, sy } from './layout';
import type { Layout } from './layout';

/** Ce que les gouttes laissent sur la table. Ne s'efface jamais. */
export function dessinerFlaque(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  s: LiquidState,
): void {
  ctx.save();
  for (const flaque of s.splats) {
    const x = sx(l, flaque.x);
    const r = flaque.r * l.unit;
    const g = ctx.createRadialGradient(x, l.tableY + l.ry * 0.4, 0, x, l.tableY + l.ry * 0.4, r);
    g.addColorStop(0, melange('liqueur', 'puits', 0.35, flaque.a));
    g.addColorStop(0.72, melange('liqueur', 'puits', 0.55, flaque.a * 0.7));
    g.addColorStop(1, couleur('liqueur', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, l.tableY + l.ry * 0.4, r, r * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Les gouttes en vol, qui prennent la lumière au passage. */
export function dessinerGouttes(
  ctx: CanvasRenderingContext2D,
  l: Layout,
  s: LiquidState,
): void {
  ctx.save();
  ctx.fillStyle = couleur('liqueur', 0.92);
  for (const d of s.drops) {
    const x = sx(l, d.x);
    const y = sy(l, d.y);
    const r = d.r * l.unit;
    /* Étirée par sa vitesse : une goutte rapide n'est pas ronde. */
    const etirement = 1 + Math.min(2.2, Math.abs(d.vy) * 0.05);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * etirement, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = couleur('caustique', 0.5);
  for (const d of s.drops) {
    const r = d.r * l.unit;
    ctx.beginPath();
    ctx.arc(sx(l, d.x) - r * 0.3, sy(l, d.y) - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
