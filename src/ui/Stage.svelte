<script lang="ts">
  import { onMount } from 'svelte';
  import { Moteur } from '../game/engine';
  import { poserMoteur } from '../game/session.svelte';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const moteur = new Moteur(canvas);
    poserMoteur(moteur);
    moteur.demarrer();
    return () => {
      moteur.detruire();
      poserMoteur(null);
    };
  });
</script>

<canvas class="stage" bind:this={canvas} aria-hidden="true"></canvas>
