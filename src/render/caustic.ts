import { R, VOLUME_MAX_ML } from '../lib/constants';
import { heightAt, slopeAt } from '../lib/liquid';
import type { LiquidState } from '../lib/liquid';
import { couleur, melange } from './palette';
import type { Layout } from './layout';

/* ------------------------------------------------------------------ *
 * La caustique — l'élément signature.
 *
 * Ce n'est pas une texture animée qu'on plaque sous le verre. On échantillonne
 * la surface, on réfracte un rayon vertical à travers chaque échantillon
 * (Snell, n = 1,36), on le projette sur la table, et la luminosité en un point
 * vaut la COMPRESSION des rayons qui y arrivent : |dx / dx'|.
 *
 * Conséquence directe : surface plate → tache douce et régulière ; surface qui
 * clapote → les rayons se regroupent et des nervures vives traversent la tache.
 * La même équation produit la surface du liquide et la lumière sur la table.
 * ------------------------------------------------------------------ */

const N = 56;
/* Volontairement minuscule : l'agrandissement au moment de la pose fait le
   flou, gratuitement, sans jamais appeler un filtre de flou. */
const LARGEUR = 112;
const HAUTEUR = 40;
/** Demi-largeur couverte par la tache, en unités de simulation. */
const PORTEE = 1.65;
const INDICE = 1.36;
/** La table n'est pas juste sous la surface : on amplifie la déviation. */
const PROFONDEUR = 2.4;

export class Caustique {
  private readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D | null;
  private masque: CanvasGradient | null = null;
  private colonne: CanvasGradient | null = null;
  private readonly arrivees = new Float32Array(N + 1);

  constructor() {
    this.canvas.width = LARGEUR;
    this.canvas.height = HAUTEUR;
    this.ctx = this.canvas.getContext('2d');
  }

  dessiner(
    principal: CanvasRenderingContext2D,
    l: Layout,
    state: LiquidState,
    opacite: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx || opacite <= 0.001 || state.volumeMl <= 0) return;

    /* 1. Réfraction : où atterrit chaque rayon. */
    for (let i = 0; i <= N; i++) {
      const x = -R + (2 * R * i) / N;
      const pente = slopeAt(state, x);
      const theta = Math.atan(pente);
      const sinR = Math.min(1, Math.max(-1, Math.sin(theta) / INDICE));
      const devie = theta - Math.asin(sinR);
      const profondeur = Math.max(0.1, heightAt(state, x)) * PROFONDEUR;
      /* La normale penche à l'opposé de la pente : le rayon dévie vers -x. */
      this.arrivees[i] = x - Math.tan(devie) * profondeur;
    }

    /* 2. Compression des rayons → luminosité. */
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, LARGEUR, HAUTEUR);
    ctx.globalCompositeOperation = 'lighter';
    /* Chaque rayon dépose une lentille, pas une barre : d'où le dégradé. */
    ctx.fillStyle = this.obtenirColonne(ctx);

    const pas = (2 * R) / N;
    const echelle = LARGEUR / (2 * PORTEE);
    for (let i = 0; i < N; i++) {
      const a = this.arrivees[i] ?? 0;
      const b = this.arrivees[i + 1] ?? 0;
      const largeur = Math.abs(b - a);
      const intensite = Math.min(2.0, pas / Math.max(largeur, pas * 0.12));

      const x0 = (Math.min(a, b) + PORTEE) * echelle;
      /* Une largeur plancher : sinon un rayon très concentré devient un laser. */
      const w = Math.max(2.4, largeur * echelle);
      if (x0 + w < 0 || x0 > LARGEUR) continue;

      ctx.globalAlpha = Math.min(0.5, intensite * 0.115);
      ctx.fillRect(x0, 0, w, HAUTEUR);
    }

    /*
     * 3. Masque elliptique : une flaque de lumière, pas une bande. Le dégradé
     * est circulaire, on l'écrase au ratio du canvas — sinon la retombée
     * verticale n'a pas lieu et la tache garde des bords francs.
     */
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.save();
    ctx.translate(LARGEUR / 2, HAUTEUR / 2);
    ctx.scale(1, HAUTEUR / LARGEUR);
    ctx.fillStyle = this.obtenirMasque(ctx);
    ctx.fillRect(-LARGEUR / 2, -LARGEUR / 2, LARGEUR, LARGEUR);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    /* 4. Pose sur la table. L'agrandissement fait le flou, gratuitement. */
    const remplissage = state.volumeMl / VOLUME_MAX_ML;
    const largeurEcran = PORTEE * 2 * l.unit;
    const hauteurEcran = l.unit * 1.15;
    /* La lampe est en haut à gauche : la tache fuit vers la droite. */
    const glissement = l.unit * (0.52 - state.surfaceAngle * 0.5);
    const haut = l.tableY - hauteurEcran * 0.42;

    principal.save();
    principal.globalCompositeOperation = 'lighter';

    /* Un halo large et sourd, pour que la tache ne soit pas posée à plat. */
    const rayon = largeurEcran * 0.7;
    principal.globalAlpha = opacite * (0.12 + remplissage * 0.2);
    principal.save();
    principal.translate(l.cx + glissement, haut + hauteurEcran * 0.42);
    principal.scale(1, 0.42);
    const glow = principal.createRadialGradient(0, 0, 0, 0, 0, rayon);
    glow.addColorStop(0, couleur('liqueur', 0.62));
    glow.addColorStop(0.45, couleur('liqueur', 0.22));
    glow.addColorStop(1, couleur('liqueur', 0));
    principal.fillStyle = glow;
    principal.beginPath();
    principal.arc(0, 0, rayon, 0, Math.PI * 2);
    principal.fill();
    principal.restore();

    principal.globalAlpha = opacite * (0.35 + remplissage * 0.65);
    principal.drawImage(
      this.canvas,
      l.cx + glissement - largeurEcran / 2,
      haut,
      largeurEcran,
      hauteurEcran,
    );
    principal.restore();
  }

  private obtenirColonne(ctx: CanvasRenderingContext2D): CanvasGradient {
    if (this.colonne) return this.colonne;
    const g = ctx.createLinearGradient(0, 0, 0, HAUTEUR);
    const teinte = melange('liqueur', 'caustique', 0.6);
    g.addColorStop(0, melange('liqueur', 'caustique', 0.6, 0));
    g.addColorStop(0.34, teinte);
    g.addColorStop(0.62, melange('liqueur', 'caustique', 0.6, 0.8));
    g.addColorStop(1, melange('liqueur', 'caustique', 0.6, 0));
    this.colonne = g;
    return g;
  }

  private obtenirMasque(ctx: CanvasRenderingContext2D): CanvasGradient {
    if (this.masque) return this.masque;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, LARGEUR / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.78, 'rgba(255,255,255,0.36)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    this.masque = g;
    return g;
  }
}
