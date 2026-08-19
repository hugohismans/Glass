<script lang="ts">
  import { jeu } from '../game/session.svelte';

  const classement = $derived(jeu.classement);
  const dernier = $derived(classement[classement.length - 1]);
</script>

<div class="couche classement entree">
  <header>
    <p class="donnee">La tournée</p>
    <h2 class="enonce">
      {#if jeu.verreVide}Le verre est vide.{:else}Il reste {jeu.resteMl} ml.{/if}
    </h2>
  </header>

  <ol>
    {#each classement as score, i (score.nom + i)}
      <li class:dernier={i === classement.length - 1 && classement.length > 1}>
        <span class="donnee rang">{String(i + 1).padStart(2, '0')}</span>
        <span class="prenom">{score.nom}</span>
        <span class="donnee perdu">{score.perduMl} ml</span>
      </li>
    {/each}
  </ol>

  {#if dernier && classement.length > 1}
    <p class="corps gage">{dernier.nom} {jeu.gage}.</p>
  {/if}

  <div class="pousse"></div>

  <nav>
    <button class="bouton" data-ton="primaire" onclick={() => jeu.lancerTournee()}>
      Remettre une tournée
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
  }

  ol {
    list-style: none;
    max-height: 38vh;
    overflow-y: auto;
  }

  li {
    display: flex;
    align-items: baseline;
    gap: var(--e3);
    padding: var(--e2) 0;
    border-bottom: 1px solid var(--verre-fin);
  }

  .rang,
  .perdu {
    margin: 0;
    font-size: 10px;
  }

  .prenom {
    flex: 1;
    font-size: 17px;
    color: var(--texte);
  }

  .dernier .prenom,
  .dernier .perdu {
    color: var(--marque);
  }

  .gage {
    margin-top: var(--e4);
    color: var(--marque);
  }
</style>
