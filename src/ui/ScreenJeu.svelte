<script lang="ts">
  import { onMount } from 'svelte';
  import { jeu, obtenirMoteur } from '../game/session.svelte';

  /*
   * Ces quatre nœuds sont écrits directement par le moteur, hors du cycle
   * réactif : pendant la partie, Svelte ne recalcule rien du tout.
   */
  let chrono: HTMLElement;
  let filet: HTMLElement;
  let millilitres: HTMLElement;
  let perte: HTMLElement;

  const nom = jeu.mode === 'tournee' ? jeu.joueurCourant : '';

  onMount(() => {
    const m = obtenirMoteur();
    m?.attacherHud({ chrono, filet, ml: millilitres, perte });
    return () => m?.detacherHud();
  });
</script>

<div class="couche jeu">
  <!-- Le chrono n'est pas un bloc de chiffres : c'est une gravure sur le bord. -->
  <div class="gravure">
    <span class="trait"><i bind:this={filet}></i></span>
    <span class="donnee valeur" bind:this={chrono}>60</span>
    <span class="donnee unite">s</span>
  </div>

  {#if nom}
    <p class="donnee joueur">{nom}</p>
  {/if}

  <p class="donnee perte" bind:this={perte}></p>

  <p class="donnee reste">
    <span bind:this={millilitres}>360</span> ml
  </p>
</div>

<style>
  .jeu {
    padding: 0;
    pointer-events: none;
  }

  .gravure {
    position: absolute;
    top: calc(var(--st) + var(--e6));
    left: calc(var(--sl) + var(--e4));
    display: flex;
    align-items: flex-start;
    gap: var(--e2);
  }

  .trait {
    display: block;
    width: 1px;
    height: 84px;
    background: var(--verre-fin);
    position: relative;
  }

  .trait i {
    position: absolute;
    inset: 0;
    background: var(--liqueur);
    opacity: 0.55;
    transform-origin: top;
    transform: scaleY(1);
  }

  .valeur {
    font-size: 13px;
    color: var(--texte);
    letter-spacing: 0.1em;
  }

  .unite {
    font-size: 10px;
    opacity: 0.55;
    margin-left: -4px;
  }

  .joueur {
    position: absolute;
    top: calc(var(--st) + var(--e6));
    right: calc(var(--sr) + var(--e4));
    color: var(--texte);
    font-size: 10px;
  }

  .perte {
    position: absolute;
    right: calc(var(--sr) + var(--e4));
    top: 43%;
    color: var(--marque);
    font-size: 10px;
    opacity: 0;
    text-align: right;
  }

  .reste {
    position: absolute;
    right: calc(var(--sr) + var(--e4));
    bottom: calc(var(--sb) + var(--e4));
    font-size: 11px;
  }
</style>
