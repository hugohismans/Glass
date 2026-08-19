/**
 * Pas de son au premier jet. Les points d'appel existent déjà pour qu'on
 * puisse en ajouter sans toucher au reste : il suffira de remplir `jouer`.
 */
export type Son = 'clapotis' | 'debordement' | 'goutte' | 'fin' | 'passage';

export function jouer(_son: Son, _intensite = 1): void {
  /* volontairement vide */
}

export function precharger(): void {
  /* volontairement vide */
}
