export type ModeId = 'tiens-bon' | 'tournee';

/** « Tiens bon » : une minute, seul, sans rien renverser. */
export const DUREE_TIENS_BON = 60;

/** « La tournée » : dix secondes chacun, puis on passe. */
export const DUREE_TOUR = 10;

/** Le temps qu'on laisse pour tendre le téléphone. Le liquide, lui, continue. */
export const DECOMPTE_PASSAGE = 3;

export const JOUEURS_MAX = 8;

export const GAGES = [
  'sert la prochaine tournée',
  'range la table',
  'choisit la musique du prochain',
  'raconte comment il a perdu',
] as const;
