/** Millilitres, toujours entiers : personne ne compte en décimales de ml. */
export function ml(valeur: number): string {
  return String(Math.round(valeur));
}

/** Secondes restantes, sans zéro inutile : 47, 9, 0. */
export function secondes(restant: number): string {
  return String(Math.max(0, Math.ceil(restant)));
}

/** Durée longue, pour les récapitulatifs. */
export function chrono(restant: number): string {
  const t = Math.max(0, Math.ceil(restant));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
