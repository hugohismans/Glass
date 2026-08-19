import { R, SPILL_THRESHOLD } from '../lib/constants';
import { heightAt } from '../lib/liquid';
import type { LiquidState } from '../lib/liquid';
import { Backdrop } from './backdrop';
import { Caustique } from './caustic';
import { dessinerFlaque, dessinerGouttes } from './drops';
import {
  cheminInterieur,
  dessinerBuee,
  dessinerFond,
  dessinerVerre,
  genererBuee,
} from './glass';
import type { Buee } from './glass';
import { calculerLayout, sx } from './layout';
import type { Layout } from './layout';
import { cheminAir, cheminLiquide, dessinerFondDeVerre, dessinerLiquide } from './liquidBody';
import { chargerPalette, couleur } from './palette';

/** Ce que l'orchestrateur de partie dit au rendu. Rien de plus. */
export interface Vue {
  /** Montée de la lampe pendant l'ouverture. */
  lampe: number;
  /** Apparition du verre. */
  verre: number;
  /** Opacité de la condensation. */
  buee: number;
}

export class Scene {
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly backdrop = new Backdrop();
  private readonly caustique = new Caustique();
  private buee: Buee[] = genererBuee(1);
  layout: Layout;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false });
    chargerPalette();
    this.layout = calculerLayout(1, 1, 1);
    this.redimensionner();
  }

  redimensionner(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.layout = calculerLayout(w, h, dpr);
    this.backdrop.construire(this.layout, this.layout.unit * 1.2);
  }

  regenererBuee(graine: number): void {
    this.buee = genererBuee(graine);
  }

  dessiner(s: LiquidState, vue: Vue): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const l = this.layout;

    ctx.setTransform(l.dpr, 0, 0, l.dpr, 0, 0);
    ctx.fillStyle = couleur('puits');
    ctx.fillRect(0, 0, l.w, l.h);

    /* 1. La pièce. */
    this.backdrop.poser(ctx, l, s.surfaceAngle, vue.lampe);

    if (vue.verre <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = vue.verre;

    /* 2. La caustique, avant tout ce qui est solide : elle est sur la table. */
    this.caustique.dessiner(ctx, l, s, vue.verre);

    /* 3. Ce qui a déjà été renversé. */
    dessinerFlaque(ctx, l, s);

    /* 4. Le fond vu à travers le verre — deux fois, avec et sans réfraction. */
    const decalage = -Math.sin(s.surfaceAngle) * l.unit * 0.16;

    ctx.save();
    cheminInterieur(ctx, l);
    ctx.clip();
    cheminAir(ctx, l, s);
    ctx.clip();
    dessinerFond(ctx, l, 0);
    ctx.restore();

    ctx.save();
    cheminLiquide(ctx, l, s);
    ctx.clip();
    dessinerFond(ctx, l, decalage);
    ctx.restore();

    /* 5. Le liquide. */
    dessinerFondDeVerre(ctx, l, s);
    ctx.save();
    cheminInterieur(ctx, l);
    ctx.clip();
    dessinerLiquide(ctx, l, s);
    ctx.restore();

    /* 6. Le verre par-dessus, puis sa buée. */
    dessinerVerre(ctx, l);
    dessinerBuee(ctx, l, this.buee, vue.buee * vue.verre);

    /* 7. Ce qui est en train de partir. */
    if (s.overflow > SPILL_THRESHOLD) this.dessinerBavure(ctx, l, s);
    dessinerGouttes(ctx, l, s);

    ctx.restore();
  }

  /**
   * Le film de liquide qui franchit la lèvre et coule le long de la paroi.
   * Seule apparition du rouge dans tout le jeu — donc pas de rectangle : une
   * coulée étroite et molle, plaquée contre le verre.
   */
  private dessinerBavure(ctx: CanvasRenderingContext2D, l: Layout, s: LiquidState): void {
    const cote = heightAt(s, -R) > heightAt(s, R) ? -1 : 1;
    const x = sx(l, cote * R);
    const intensite = Math.min(1, s.overflow * 16);
    const longueur = l.unit * (0.35 + intensite * 0.75);

    ctx.save();
    ctx.translate(x, l.rimY + l.ry * 0.2);
    ctx.scale(0.16, 1);

    const coulee = ctx.createRadialGradient(0, 0, 0, 0, 0, longueur);
    coulee.addColorStop(0, couleur('marque', 0.55 * intensite));
    coulee.addColorStop(0.3, couleur('liqueur', 0.4 * intensite));
    coulee.addColorStop(1, couleur('liqueur', 0));
    ctx.fillStyle = coulee;
    ctx.beginPath();
    ctx.arc(0, longueur * 0.45, longueur, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* La perle qui se forme sur la lèvre avant de lâcher. */
    ctx.save();
    ctx.fillStyle = couleur('liqueur', 0.7 * intensite);
    ctx.beginPath();
    ctx.ellipse(
      x - cote * l.unit * 0.01,
      l.rimY + l.ry * 0.1,
      l.unit * 0.045,
      l.unit * 0.06,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }
}
