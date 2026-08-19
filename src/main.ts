import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const cible = document.getElementById('app');
if (!cible) throw new Error('Point de montage introuvable.');

/*
 * Pull-to-refresh et zoom à deux doigts : le jeu se joue en secouant, jamais
 * en glissant. Seules les listes marquées `data-defilable` gardent le droit
 * de défiler — sinon on ne peut plus lire huit prénoms.
 */
document.addEventListener(
  'touchmove',
  (e) => {
    const cible = e.target;
    if (cible instanceof Element && cible.closest('[data-defilable]')) return;
    e.preventDefault();
  },
  { passive: false },
);
document.addEventListener('gesturestart', (e) => e.preventDefault());

export default mount(App, { target: cible });
