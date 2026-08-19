import type { Moteur } from './engine';
import { DECOMPTE_PASSAGE, DUREE_TIENS_BON, DUREE_TOUR, GAGES } from './modes';
import type { ModeId } from './modes';

export type Ecran =
  | 'desktop'
  | 'accueil'
  | 'calibration'
  | 'jeu'
  | 'fin'
  | 'refus'
  | 'noms'
  | 'passage'
  | 'classement';

export interface Score {
  nom: string;
  perduMl: number;
}

/** Le moteur n'est pas réactif : on le garde à côté des runes, pas dedans. */
let moteur: Moteur | null = null;

export function poserMoteur(m: Moteur | null): void {
  moteur = m;
}

export function obtenirMoteur(): Moteur | null {
  return moteur;
}

class Session {
  ecran = $state<Ecran>('accueil');
  mode = $state<ModeId>('tiens-bon');

  /** Résultat de la dernière partie. */
  resteMl = $state(0);
  perduMl = $state(0);
  courbe = $state<number[]>([]);

  /** La tournée. */
  joueurs = $state<string[]>([]);
  tour = $state(0);
  scores = $state<Score[]>([]);
  decompte = $state(DECOMPTE_PASSAGE);
  verreVide = $state(false);

  get joueurCourant(): string {
    return this.joueurs[this.tour] ?? '';
  }

  get gage(): string {
    const i = Math.abs(this.scores.length * 7 + this.joueurs.length) % GAGES.length;
    return GAGES[i] ?? GAGES[0];
  }

  get classement(): Score[] {
    return [...this.scores].sort((a, b) => a.perduMl - b.perduMl);
  }

  aller(ecran: Ecran): void {
    this.ecran = ecran;
  }

  /* -- Tiens bon -------------------------------------------------- */

  lancerTiensBon(): void {
    const m = moteur;
    if (!m) return;
    this.mode = 'tiens-bon';
    m.nouvellePartie(Date.now() & 0xffff);
    m.dureeAffichee = DUREE_TIENS_BON;
    this.ecran = 'jeu';
    m.lancerChrono(DUREE_TIENS_BON, () => this.terminerTiensBon());
  }

  private terminerTiensBon(): void {
    const m = moteur;
    if (!m) return;
    m.terminerPartie();
    this.resteMl = Math.round(m.volumeMl);
    this.perduMl = Math.round(m.perduMl);
    this.courbe = [...m.historique];
    this.ecran = 'fin';
  }

  /* -- La tournée -------------------------------------------------- */

  lancerTournee(): void {
    const m = moteur;
    if (!m) return;
    this.mode = 'tournee';
    this.scores = [];
    this.tour = 0;
    this.verreVide = false;
    m.nouvellePartie(Date.now() & 0xffff);
    m.dureeAffichee = DUREE_TOUR;
    this.preparerPassage();
  }

  /** Entre deux joueurs : le chrono s'arrête, le liquide non. */
  preparerPassage(): void {
    this.decompte = DECOMPTE_PASSAGE;
    this.ecran = 'passage';
  }

  demarrerTour(): void {
    const m = moteur;
    if (!m) return;
    this.avantTourMl = m.volumeMl;
    this.ecran = 'jeu';
    m.lancerChrono(DUREE_TOUR, () => this.terminerTour());
  }

  private avantTourMl = 0;

  private terminerTour(): void {
    const m = moteur;
    if (!m) return;
    const perdu = Math.max(0, this.avantTourMl - m.volumeMl);
    this.scores = [...this.scores, { nom: this.joueurCourant, perduMl: Math.round(perdu) }];

    if (m.volumeMl < 1) {
      this.verreVide = true;
      this.terminerTournee();
      return;
    }
    if (this.tour + 1 >= this.joueurs.length) {
      this.terminerTournee();
      return;
    }
    this.tour += 1;
    this.preparerPassage();
  }

  private terminerTournee(): void {
    const m = moteur;
    if (!m) return;
    m.terminerPartie();
    this.resteMl = Math.round(m.volumeMl);
    this.perduMl = Math.round(m.perduMl);
    this.courbe = [...m.historique];
    this.ecran = 'classement';
  }

  /* -- Retour ------------------------------------------------------ */

  retourAccueil(): void {
    moteur?.libererVerre();
    this.joueurs = [];
    this.scores = [];
    this.tour = 0;
    this.ecran = 'accueil';
  }
}

export const jeu = new Session();
