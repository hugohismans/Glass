import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const cible = document.getElementById('app');
if (!cible) throw new Error('Point de montage introuvable.');

/* Pull-to-refresh et zoom à deux doigts : le jeu se joue en secouant. */
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());

export default mount(App, { target: cible });
