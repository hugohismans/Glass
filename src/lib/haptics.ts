/**
 * Retour haptique. Un seul point d'appel : quand ça commence à déborder.
 * L'API n'existe pas sur iOS — l'absence est silencieuse, pas une erreur.
 */
let dernier = 0;

export function debordement(intensite: number): void {
  const now = performance.now();
  if (now - dernier < 220) return;
  dernier = now;
  if (typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(Math.round(8 + Math.min(1, intensite) * 22));
}

export function reinitialiser(): void {
  dernier = 0;
}
