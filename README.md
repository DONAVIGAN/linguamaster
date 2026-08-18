# LinguaMaster

Apprendre 6 langues depuis son téléphone, tout en français :
**anglais, espagnol, chinois, russe, arabe, haoussa.**

App web mono-fichier (`index.html`), servie par GitHub Pages sur
`donavigan.github.io/linguamaster/`. Aucune dépendance à installer,
aucun build : pousser sur `main` déploie.

## Parcours utilisateur

```
Landing (découverte) → Essai gratuit (1 langue, sans code)
   → Écran d'offre → Achat WhatsApp → Code reçu → Activation
```

L'activation par code n'est jamais la première chose vue : elle
n'intervient qu'après l'achat.

## Contenu par langue

Vocabulaire · Grammaire · Prononciation · Dialogue · Quiz

## Périmètre de l'essai gratuit

Défini par la constante `TRIAL` dans `index.html` :
5 mots de vocabulaire, 1 leçon de grammaire complète, 1 règle de
prononciation, 3 questions de quiz. Les dialogues restent réservés
aux licences.

## Offres

| Formule | Prix | Durée |
|---|---|---|
| 1 langue | 2 000 FCFA | 30 jours |
| Les 6 langues | 8 000 FCFA | 30 jours |

Prix et numéros WhatsApp sont centralisés dans les constantes
`PRICE_ONE`, `PRICE_ALL` et `WA_NUMBERS` en haut du `<script>`.

## Licences

Format des codes : `LM-<4 aléatoires><LANGUE>-<expiration base36><empreinte 4>`

Les codes sont générés par l'outil d'administration, **volontairement
absent de ce repo** : il contient `SECRET_KEY` et le mot de passe admin,
et ce repo est servi publiquement (voir `.gitignore`). Il est conservé
hors dépôt, dans `sphinx-portfolio/linguamaster-admin/`.

⚠️ `codeChecksum`, `CODE_LANGS` et le format doivent rester **identiques**
entre l'app et l'outil admin, sinon les codes vendus sont refusés.

⚠️ La validation est côté client : `SECRET_KEY` est lisible dans la source
publique. Acceptable en phase de test, **à remplacer par une validation
serveur avant toute campagne publicitaire**.

## Tests

Le parcours complet est vérifié par un test jsdom (50 assertions) :
démarrage, contenu de la landing, liens WhatsApp préremplis, essai
gratuit, verrous, activation, expiration, bouton retour.
