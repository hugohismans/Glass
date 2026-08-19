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

  const aire = $derived(points ? `0,${H} ${points} ${L},${H}` : '');
</script>

{#if points}
  <!-- Ce qu'il restait, seconde après seconde. Un trait, pas un graphique. -->
  <svg class="courbe" viewBox="0 0 {L} {H}" preserveAspectRatio="none" aria-hidden="true">
    <polygon class="aire" points={aire} />
    <polyline points={points} />
  </svg>
{/if}

<style>
  .courbe {
    display: block;
    width: 100%;
    height: 40px;
    overflow: visible;
  }

  .aire {
    fill: var(--liqueur);
    opacity: 0.14;
    stroke: none;
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
