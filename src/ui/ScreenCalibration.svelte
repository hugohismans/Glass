<script lang="ts">
  import { onMount } from 'svelte';
  import { jeu, obtenirMoteur } from '../game/session.svelte';

  let muet = $state(false);

  onMount(() => {
    /* Permission accordée mais aucun événement : capteur absent ou bloqué. */
    const t = setTimeout(() => {
      muet = obtenirMoteur()?.capteurActif === false;
    }, 1800);
    return () => clearTimeout(t);
  });

  function valider(): void {
    const m = obtenirMoteur();
    if (!m) return;
    m.calibrer();
    if (jeu.mode === 'tournee') jeu.lancerTournee();
    else jeu.lancerTiensBon();
  }
</script>

<div class="couche calibration entree">
  <header>
    <p class="donnee">Calibration</p>
    <h2 class="enonce">Tiens le téléphone comme tu vas le tenir.</h2>
    <p class="corps">
      Cette position devient le niveau. Tout se joue ensuite en relatif — peu
      importe ton angle de départ.
    </p>
  </header>

  <div class="pousse"></div>

  <nav>
    {#if muet}
      <p class="corps alerte">
        Aucun mouvement détecté. Vérifie que l'accès aux capteurs est autorisé,
        puis recharge la page.
      </p>
    {/if}
    <button class="bouton" data-ton="primaire" onclick={valider}>C'est ma position</button>
    <button class="bouton" onclick={() => jeu.retourAccueil()}>Revenir</button>
  </nav>
</div>

<style>
  header {
    max-width: 20ch;
  }

  .donnee {
    margin-bottom: var(--e3);
  }

  h2 {
    margin-bottom: var(--e4);
  }

  .alerte {
    color: var(--marque-texte);
    margin-bottom: var(--e3);
    max-width: 32ch;
  }
</style>
