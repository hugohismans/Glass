<script lang="ts">
  import { onMount } from 'svelte';
  import { jeu } from '../game/session.svelte';

  /*
   * Le chrono du joueur est en pause. La simulation, elle, tourne toujours :
   * c'est pendant ce décompte que le verre se venge du passage de main.
   */
  onMount(() => {
    const t = setInterval(() => {
      jeu.decompte -= 1;
      if (jeu.decompte <= 0) {
        clearInterval(t);
        jeu.demarrerTour();
      }
    }, 1000);
    return () => clearInterval(t);
  });
</script>

<div class="couche passage entree">
  <header>
    <p class="donnee">Tour {jeu.tour + 1} sur {jeu.joueurs.length}</p>
    <h2 class="enonce">À toi, {jeu.joueurCourant}.</h2>
  </header>

  <div class="pousse"></div>

  <p class="decompte donnee">{jeu.decompte}</p>
</div>

<style>
  .donnee {
    margin-bottom: var(--e3);
  }

  .decompte {
    font-size: 11px;
    color: var(--liqueur);
    margin: 0;
  }
</style>
