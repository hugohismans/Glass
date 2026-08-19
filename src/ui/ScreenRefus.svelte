<script lang="ts">
  import { jeu } from '../game/session.svelte';
</script>

<div class="couche refus entree">
  <header>
    <p class="donnee">Capteur indisponible</p>
    <h2 class="enonce">Sans le gyroscope, il n'y a pas de verre.</h2>
    <p class="corps">
      Le jeu lit l'inclinaison du téléphone, rien d'autre. Autorise l'accès au
      mouvement dans les réglages du navigateur, puis recharge la page.
    </p>
  </header>

  <div class="pousse"></div>

  <nav>
    <button class="bouton" data-ton="primaire" onclick={() => location.reload()}>
      Recharger
    </button>
    <button class="bouton" onclick={() => jeu.retourAccueil()}>Revenir</button>
  </nav>
</div>

<style>
  .donnee {
    margin-bottom: var(--e3);
  }

  h2 {
    margin-bottom: var(--e4);
    max-width: 16ch;
  }
</style>
