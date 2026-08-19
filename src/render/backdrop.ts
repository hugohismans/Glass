import { couleur, melange, verre } from './palette';
import { grain } from './noise';
import type { Layout } from './layout';

/**
 * La nature morte fixe : la lampe, le mur, la table, le grain.
 * Dessinée hors écran une seule fois par redimensionnement, puis posée d'un
 * seul `drawImage` avec une parallaxe minuscule — la pièce ne bouge pas,
 * c'est le téléphone qui s'incline.
 */
export class Backdrop {
  private readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D | null;
  /** Marge de débord, pour que la parallaxe ne découvre pas de vide. */
  marge = 0;

  constructor() {
    this.ctx = this.canvas.getContext('2d');
  }

  construire(l: Layout, demiVerre: number): void {
    const ctx = this.ctx;
    if (!ctx) return;

    this.marge = Math.round(Math.max(l.w, l.h) * 0.08);
    const w = l.w + this.marge * 2;
    const h = l.h + this.marge * 2;
    this.canvas.width = Math.round(w * l.dpr);
    this.canvas.height = Math.round(h * l.dpr);

    ctx.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.translate(this.marge, this.marge);

    /* 1. Le fond, le plus loin de la lampe. */
    ctx.fillStyle = couleur('ink');
    ctx.fillRect(-this.marge, -this.marge, w, h);

    /* 2. La lampe : un seul foyer chaud en haut à gauche, deux paliers. */
    const rayon = Math.max(l.w, l.h) * 1.05;
    const halo = ctx.createRadialGradient(
      l.lampX,
      l.lampY,
      rayon * 0.02,
      l.lampX,
      l.lampY,
      rayon,
    );
    halo.addColorStop(0, couleur('halo', 0.95));
    halo.addColorStop(0.18, melange('halo', 'penombre', 0.55, 0.72));
    halo.addColorStop(0.46, couleur('penombre', 0.55));
    halo.addColorStop(1, couleur('ink', 0));
    ctx.fillStyle = halo;
    ctx.fillRect(-this.marge, -this.marge, w, h);

    /* 3. La table. Plus claire que le mur, et elle s'assombrit vers le bas. */
    const plan = ctx.createLinearGradient(0, l.tableY, 0, l.h);
    plan.addColorStop(0, couleur('table'));
    plan.addColorStop(0.5, melange('table', 'ink', 0.45));
    plan.addColorStop(1, couleur('puits'));
    ctx.fillStyle = plan;
    ctx.fillRect(-this.marge, l.tableY, w, l.h - l.tableY + this.marge);

    /* 4. La flaque de lumière que la lampe pose sur la table. */
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      l.cx - l.unit * 0.55,
      l.tableY + l.unit * 0.75,
      l.unit * 3.6,
      l.unit * 1.15,
      0,
      0,
      Math.PI * 2,
    );
    const nappe = ctx.createRadialGradient(
      l.cx - l.unit * 0.55,
      l.tableY + l.unit * 0.75,
      0,
      l.cx - l.unit * 0.55,
      l.tableY + l.unit * 0.75,
      l.unit * 3.6,
    );
    nappe.addColorStop(0, melange('table', 'halo', 0.95, 0.88));
    nappe.addColorStop(0.42, melange('table', 'halo', 0.5, 0.5));
    nappe.addColorStop(0.72, melange('table', 'halo', 0.2, 0.2));
    nappe.addColorStop(1, couleur('table', 0));
    ctx.fillStyle = nappe;
    ctx.fill();
    ctx.restore();

    /*
     * 5. L'arête de la table. Elle passe DERRIÈRE le verre : on l'interrompt
     * ici, la couche dynamique la redessine décalée par la réfraction.
     * Sans cette ligne, la réfraction serait du code invisible.
     */
    ctx.strokeStyle = verre(0.16);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-this.marge, l.tableY + 0.5);
    ctx.lineTo(l.cx - demiVerre, l.tableY + 0.5);
    ctx.moveTo(l.cx + demiVerre, l.tableY + 0.5);
    ctx.lineTo(l.w + this.marge, l.tableY + 0.5);
    ctx.stroke();

    /* 6. Vignette : les coins tombent dans le puits. */
    const vignette = ctx.createRadialGradient(
      l.w * 0.4,
      l.h * 0.42,
      Math.min(l.w, l.h) * 0.25,
      l.w * 0.4,
      l.h * 0.42,
      Math.max(l.w, l.h) * 0.95,
    );
    vignette.addColorStop(0, couleur('puits', 0));
    vignette.addColorStop(1, couleur('puits', 0.82));
    ctx.fillStyle = vignette;
    ctx.fillRect(-this.marge, -this.marge, w, h);

    /* 7. Le grain, en dernier, très faible. */
    const g = grain(ctx);
    if (g) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = g;
      ctx.fillRect(-this.marge, -this.marge, w, h);
      ctx.restore();
    }
  }

  /** Pose la nature morte avec une parallaxe contraire à l'inclinaison. */
  poser(ctx: CanvasRenderingContext2D, l: Layout, tilt: number, alpha: number): void {
    const dx = -tilt * l.unit * 0.11;
    const dy = Math.abs(tilt) * l.unit * 0.02;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(l.cx, l.h * 0.5);
    ctx.rotate(-tilt * 0.022);
    ctx.translate(-l.cx + dx, -l.h * 0.5 + dy);
    ctx.drawImage(
      this.canvas,
      -this.marge,
      -this.marge,
      l.w + this.marge * 2,
      l.h + this.marge * 2,
    );
    ctx.restore();
  }
}
