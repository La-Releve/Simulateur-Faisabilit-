# Simulateur de Faisabilité — La Relève

Simulateur d'opération de marchand de biens : plan de financement (Emplois / Ressources), apport nécessaire, prix de revient au m² et trois scénarios de revente. Application Next.js installable (PWA), 100 % côté client.

## Démarrer

```bash
pnpm install
pnpm dev          # développement (service worker désactivé)
pnpm test         # tests du moteur (Vitest)
pnpm build        # next build + génération du service worker (Serwist)
pnpm start        # serveur Node standard
```

## Architecture

```
lib/simulateur/
  params.ts        taux et pourcentages (seul endroit où ils sont définis)
  types.ts         Inputs, Outputs, Scenario
  engine.ts        computeFaisabilite(inputs, params) → outputs (fonction pure)
  scenarios.ts     computeScenario(outputs, inputs, prixM2) (formules de l'Excel d'origine)
  format.ts        formatage €, %, m² et saisie
  state.ts         état de saisie, validation, encodage du lien de partage
  *.test.ts        cas A, B, C (parité Notion / Excel) et invariants
components/simulateur/  UI (sections 01 à 05, guide d'installation, graphiques)
components/charts/      composants Bklit UI (registre shadcn), voir « Écarts » ci-dessous
app/sw.ts               service worker (précache du shell → fonctionne hors ligne)
public/pwa-install-animation.html  animation d'installation iOS (rebrandée La Relève)
assets/                 sources non servies (favicon, avatars, icônes iOS) ; versions optimisées dans public/
```

## Confidentialité

- Aucun chiffre saisi ne quitte l'appareil : le calcul est 100 % local.
- La simulation en cours est sauvegardée dans `localStorage` (clé `simulateur:v1`).
- Le bouton Partager ouvre la feuille de partage native avec un message pré-rédigé et un lien court du type `/#9n80.64.rv34` : les valeurs saisies sont encodées dans l'URL (base 36, valeurs par défaut omises, sans base de données) et placées dans le fragment `#`, que le navigateur n'envoie jamais au serveur. À l'ouverture, la simulation est chargée puis le fragment est retiré de l'URL.
- Image Open Graph : `app/opengraph-image.png`. Son adresse absolue utilise `NEXT_PUBLIC_SITE_URL` (voir `.env.example`), ou à défaut le domaine de production fourni par Vercel ; la valeur étant intégrée au build, tout changement demande un redéploiement.
- Open Sans est auto-hébergée au build (`next/font`), aucune requête vers Google au runtime.

## Modifications apportées aux composants Bklit

Les composants sont copiés dans le projet par le registre shadcn et ont été ajustés :

- `bar.tsx` / `bar-chart.tsx` : prise en charge des valeurs négatives (domaine sous zéro, barres depuis la ligne 0), couleur par barre (`getFill`) pour afficher une marge négative en rouge, correction de la largeur des barres horizontales empilées.
- `sankey-node.tsx` : prop `formatValue` (le libellé par défaut affichait « sessions »).

## Suivi des usages

Chaque action (visite, simulation réalisée, partage, ouverture d'un lien partagé, guide d'installation, installation, nouvelle simulation) crée une ligne dans une base Notion : phrase lisible, type, date, adresse IP, user agent, appareil. Aucun montant saisi n'est transmis.

- Navigateur (`lib/tracking/client.ts`) : envoi silencieux en tâche de fond ; hors connexion ou en cas d'échec, file locale (50 actions, 7 jours) renvoyée au retour du réseau.
- Serveur (`app/api/track/route.ts`) : répond immédiatement, puis écrit dans Notion après la réponse (`after`) ; même origine, robots ignorés, 60 actions / minute / IP.
- Variables d'environnement (serveur uniquement) : `NOTION_API_KEY` (secret de l'intégration Notion, qui doit avoir accès à la base) et `NOTION_TRACKING_DATABASE_ID`. Sans elles, le suivi est simplement désactivé.

## Thème

Clair ou sombre selon l'apparence système de l'appareil, avec un bouton de bascule dans l'en-tête. Un choix manuel est mémorisé (`localStorage`, clé `theme`) tant qu'il diffère du système ; `data-theme` est posé avant le premier affichage pour éviter tout flash.

## Animations

Les transitions suivent l'échelle de tokens de mouvement de [transitions.dev](https://transitions.dev) (déclarée dans `app/globals.css` : `--duration-*`, `--ease-smooth-out`…) : pastille glissante des segmented controls, apparition du titre, modale du guide d'installation, toast, bascule d'icône du bouton de thème, accordéons. Les montants clés roulent vers leur nouvelle valeur avec [NumberFlow](https://number-flow.barvian.me) (MIT), avec un texte équivalent pour les lecteurs d'écran. Tout est désactivé avec `prefers-reduced-motion`.
