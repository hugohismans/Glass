<script lang="ts">
  import { jeu } from '../game/session.svelte';
  import { DUREE_TOUR, JOUEURS_MAX } from '../game/modes';

  let saisie = $state('');

  function ajouter(): void {
    const nom = saisie.trim().slice(0, 14);
    if (!nom || jeu.joueurs.length >= JOUEURS_MAX) return;
    jeu.joueurs = [...jeu.joueurs, nom];
    saisie = '';
  }

  function retirer(i: number): void {
    jeu.joueurs = jeu.joueurs.filter((_, j) => j !== i);
  }

  function commencer(): void {
    if (jeu.joueurs.length < 2) return;
    jeu.aller('calibration');
  }
</script>

<div class="couche noms entree">
  <header>
    <p class="donnee">La tournée</p>
    <h2 class="enonce">Qui tient le verre&nbsp;?</h2>
    <p class="corps">
      {DUREE_TOUR} secondes chacun, puis on passe. Le liquide, lui, ne s'arrête
      pas entre deux mains.
    </p>
  </header>

  <form
    onsubmit={(e) => {
      e.preventDefault();
      ajouter();
    }}
  >
    <input
      type="text"
      bind:value={saisie}
      placeholder="Prénom"
      autocomplete="off"
      autocapitalize="words"
      maxlength="14"
      aria-label="Prénom du joueur"
    />
  </form>

  <ul data-defilable>
    {#each jeu.joueurs as nom, i (nom + i)}
      <li>
        <span class="donnee rang">{String(i + 1).padStart(2, '0')}</span>
        <span class="prenom">{nom}</span>
        <button class="retirer donnee" onclick={() => retirer(i)} aria-label="Retirer {nom}">
          retirer
        </button>
      </li>
    {/each}
  </ul>

  <div class="pousse"></div>

  <nav>
    <button
      class="bouton"
      data-ton="primaire"
      disabled={jeu.joueurs.length < 2}
      onclick={commencer}
    >
      {jeu.joueurs.length < 2 ? 'Deux joueurs minimum' : `Commencer à ${jeu.joueurs.length}`}
    </button>
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

  form {
    margin-top: var(--e4);
  }

  ul {
    list-style: none;
    margin-top: var(--e3);
    max-height: 34vh;
    overflow-y: auto;
  }

  li {
    display: flex;
    align-items: baseline;
    gap: var(--e3);
    padding: var(--e2) 0;
    border-bottom: 1px solid var(--verre-fin);
  }

  .rang {
    margin: 0;
    font-size: 10px;
    opacity: 0.6;
  }

  .prenom {
    flex: 1;
    font-size: 17px;
    color: var(--texte);
  }

  .retirer {
    margin: 0;
    background: none;
    border: 0;
    padding: var(--e1) 0;
    font-size: 9px;
    color: var(--texte-faible);
    cursor: pointer;
  }

  .retirer:focus-visible {
    outline: 1px solid var(--liqueur);
    outline-offset: 3px;
  }
</style>
