<script lang="ts">
  import { VOLUME_MAX_ML } from '../lib/constants';

  interface Props {
    valeurs: number[];
  }
  const { valeurs }: Props = $props();

  const L = 100;
  const H = 26;

  /*
   * Échelle absolue, de 0 au verre plein : une partie sans perte donne une
   * barre pleine et droite, une catastrophe donne un escalier. Recadrer sur
   * l'amplitude réelle ferait passer trois millilitres pour un désastre.
   */
  const points = $derived.by(() => {
    if (valeurs.length < 2) return '';
    return valeurs
      .map((v, i) => {
        const x = (i / (valeurs.length - 1)) * L;
        const y = H - (v / VOLUME_MAX_ML) * H;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  });


</script>

{#if points}
  <!-- Ce qu'il restait, seconde après seconde. Un trait, pas un graphique. -->
  <svg class="courbe" viewBox="0 0 {L} {H}" preserveAspectRatio="none" aria-hidden="true">
    <line class="plein" x1="0" y1="0" x2={L} y2="0" />
    <polyline points={points} />
  </svg>
{/if}

<style>
  .courbe {
    display: block;
    width: 62%;
    height: 30px;
    overflow: visible;
  }

  .plein {
    stroke: var(--verre-fin);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  polyline {
    fill: none;
    stroke: var(--liqueur);
    stroke-width: 0.6;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    opacity: 0.75;
  }
</style>
