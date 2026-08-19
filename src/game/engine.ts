import { VOLUME_START_ML } from '../lib/constants';
import * as haptique from '../lib/haptics';
import { jouer } from '../lib/audio';
import { createLiquid, step } from '../lib/liquid';
import type { LiquidState } from '../lib/liquid';
import { Loop } from '../lib/loop';
import { Capteur } from '../lib/orientation';
import { ml, secondes } from '../lib/format';
import { Scene } from '../render/scene';

/** Les nœuds que le moteur écrit directement, hors du cycle réactif de Svelte. */
export interface Hud {
  chrono: HTMLElement | null;
  filet: HTMLElement | null;
  ml: HTMLElement | null;
  perte: HTMLElement | null;
}

const INTRO = {
  lampe: [0, 0.95],
  verre: [0.5, 1.15],
  remplissage: [0.72, 2.25],
  buee: [1.5, 2.4],
} as const;

function palier(t: number, [a, b]: readonly [number, number]): number {
  const p = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return p * p * (3 - 2 * p);
}

/**
 * Le chef d'orchestre. Il possède la simulation, le capteur, le rendu et la
 * boucle — et il est délibérément non réactif : pendant une partie, aucune
 * rune Svelte n'est touchée. Le HUD est écrit à la main dans le DOM.
 */
export class Moteur {
  readonly capteur = new Capteur();
  private readonly scene: Scene;
  private readonly loop: Loop;
  private etat: LiquidState = createLiquid(0);
  private hud: Hud | null = null;

  private introT = 0;
  private temps = 0;
  private introActive = true;
  private cible = VOLUME_START_ML;
  private partieEnCours = false;
  /**
   * Hors partie, le verre se remplit tout seul — mais surtout pas sur l'écran
   * de fin : on doit y voir exactement ce qu'on a laissé.
   */
  private verreLibre = true;

  private chronoRestant = 0;
  private chronoActif = false;
  private onEcoule: (() => void) | null = null;

  /** Un relevé du volume toutes les 250 ms : la courbe de l'écran de fin. */
  readonly historique: number[] = [];
  private prochainReleve = 0;

  private perteEnCours = 0;
  private perteVue = 0;
  private dernierSpill = 0;
  private dernierMl = -1;
  private dernieresSecondes = -1;

  private readonly mouvementReduit: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene(canvas);
    this.mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.mouvementReduit) this.introT = 99;
    this.loop = new Loop(this.pas, this.rendu);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
  }

  demarrer(): void {
    this.capteur.demarrer();
    this.loop.start();
  }

  detruire(): void {
    this.loop.stop();
    this.capteur.arreter();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
  }

  get capteurActif(): boolean {
    return this.capteur.actif;
  }

  get volumeMl(): number {
    return this.etat.volumeMl;
  }

  get perduMl(): number {
    return this.etat.lostMl;
  }

  calibrer(): void {
    this.capteur.calibrer();
  }

  attacherHud(hud: Hud): void {
    this.hud = hud;
    this.dernierMl = -1;
    this.dernieresSecondes = -1;
  }

  detacherHud(): void {
    this.hud = null;
  }

  /** Nouveau verre : plein, propre, avec une condensation neuve. */
  nouvellePartie(graine: number): void {
    this.etat = createLiquid(VOLUME_START_ML);
    this.cible = VOLUME_START_ML;
    this.scene.regenererBuee(graine);
    this.partieEnCours = true;
    this.verreLibre = false;
    this.historique.length = 0;
    this.historique.push(VOLUME_START_ML);
    this.prochainReleve = 0.25;
    this.perteEnCours = 0;
    this.perteVue = 0;
    haptique.reinitialiser();
  }

  terminerPartie(): void {
    this.partieEnCours = false;
    this.chronoActif = false;
    this.onEcoule = null;
  }

  /** Retour à l'accueil : le verre se remplit à nouveau, la table se nettoie. */
  libererVerre(): void {
    this.partieEnCours = false;
    this.verreLibre = true;
  }

  lancerChrono(duree: number, onEcoule: () => void): void {
    this.chronoRestant = duree;
    this.onEcoule = onEcoule;
    this.chronoActif = true;
  }

  suspendreChrono(): void {
    this.chronoActif = false;
  }

  reprendreChrono(): void {
    if (this.chronoRestant > 0) this.chronoActif = true;
  }

  get resteSecondes(): number {
    return this.chronoRestant;
  }

  private readonly onResize = (): void => {
    this.scene.redimensionner();
  };

  private readonly pas = (dt: number): void => {
    this.temps += dt;
    if (this.introActive) {
      this.introT += dt;
      if (this.introT > 3) this.introActive = false;
    }

    /* Pendant l'ouverture, le verre se remplit lentement. */
    const cible = this.introActive
      ? this.cible * palier(this.introT, INTRO.remplissage)
      : this.cible;

    /*
     * Aucun capteur (bureau, ou permission jamais accordée) : on donne au
     * verre un roulis très lent, pour que la scène respire au lieu de figer.
     */
    const tilt = this.capteur.actif
      ? this.capteur.tilt
      : Math.sin(this.temps * 0.55) * 0.05 + Math.sin(this.temps * 0.23) * 0.03;

    step(this.etat, { tilt, shake: this.capteur.shake }, dt);
    this.capteur.decroitre(dt);

    if (this.verreLibre) {
      /* Sur l'accueil, le verre se remplit à nouveau : on montre la règle. */
      this.etat.volumeMl += (cible - this.etat.volumeMl) * (1 - Math.exp(-dt / 0.7));
      for (let i = this.etat.splats.length - 1; i >= 0; i--) {
        const s = this.etat.splats[i];
        if (!s) continue;
        s.a -= dt * 0.5;
        if (s.a <= 0) this.etat.splats.splice(i, 1);
      }
    } else {
      this.prochainReleve -= dt;
      if (this.prochainReleve <= 0) {
        this.prochainReleve = 0.25;
        if (this.historique.length < 512) this.historique.push(this.etat.volumeMl);
      }
    }

    if (this.partieEnCours && this.etat.spilledMl > 0) {
      this.perteEnCours += this.etat.spilledMl;
      this.dernierSpill = performance.now();
      haptique.debordement(this.etat.overflow * 12);
      jouer('debordement', this.etat.overflow);
    }

    if (this.chronoActif) {
      this.chronoRestant -= dt;
      if (this.chronoRestant <= 0) {
        this.chronoRestant = 0;
        this.chronoActif = false;
        const fin = this.onEcoule;
        this.onEcoule = null;
        if (fin) fin();
      }
    }
  };

  private readonly rendu = (): void => {
    const t = this.introT;
    this.scene.dessiner(this.etat, {
      lampe: palier(t, INTRO.lampe),
      verre: palier(t, INTRO.verre),
      buee: palier(t, INTRO.buee),
    });
    this.ecrireHud();
  };

  /** Écriture directe dans le DOM : pas d'invalidation, pas de re-rendu. */
  private ecrireHud(): void {
    const hud = this.hud;
    if (!hud) return;

    const sec = Math.ceil(this.chronoRestant);
    if (sec !== this.dernieresSecondes) {
      this.dernieresSecondes = sec;
      if (hud.chrono) hud.chrono.textContent = secondes(this.chronoRestant);
    }
    if (hud.filet) {
      const p = Math.max(0, Math.min(1, this.chronoRestant / Math.max(1, this.dureeAffichee)));
      hud.filet.style.transform = `scaleY(${p.toFixed(4)})`;
    }

    const volume = Math.round(this.etat.volumeMl);
    if (volume !== this.dernierMl) {
      this.dernierMl = volume;
      if (hud.ml) hud.ml.textContent = ml(volume);
    }

    if (hud.perte) {
      const depuis = performance.now() - this.dernierSpill;
      if (this.perteEnCours >= 1 && this.perteEnCours !== this.perteVue) {
        this.perteVue = this.perteEnCours;
        hud.perte.textContent = `${ml(this.perteEnCours)} ml perdus`;
      }
      const visible = this.perteEnCours >= 1 && depuis < 1400;
      const opacite = visible ? Math.min(1, (1400 - depuis) / 700) : 0;
      hud.perte.style.opacity = opacite.toFixed(3);
      if (!visible && this.perteEnCours > 0 && depuis > 1600) this.perteEnCours = 0;
    }
  }

  /** Durée du tour en cours, pour la longueur du filet. */
  dureeAffichee = 60;
}
