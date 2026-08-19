<script lang="ts">
  import Courbe from './Courbe.svelte';
  import { jeu } from '../game/session.svelte';
</script>

<div class="couche fin entree">
  <header>
    <p class="donnee">Tiens bon — 60 s</p>
    <h2 class="enonce">Il reste {jeu.resteMl} ml.</h2>
    {#if jeu.perduMl > 0}
      <p class="corps">{jeu.perduMl} ml sur la table.</p>
    {:else}
      <p class="corps">Pas une goutte.</p>
    {/if}
  </header>

  <figure>
    <Courbe valeurs={jeu.courbe} />
    <figcaption class="donnee legende">Le verre, seconde après seconde</figcaption>
  </figure>

  <div class="pousse"></div>

  <nav>
    <button class="bouton" data-ton="primaire" onclick={() => jeu.lancerTiensBon()}>Rejouer</button>
    <button class="bouton" onclick={() => jeu.retourAccueil()}>Revenir</button>
  </nav>
</div>

<style>
  .donnee {
    margin-bottom: var(--e3);
  }

  h2 {
    margin-bottom: var(--e3);
  }

  figure {
    margin-top: var(--e5);
  }

  .legende {
    margin-top: var(--e2);
    font-size: 9px;
    opacity: 0.6;
  }
</style>
