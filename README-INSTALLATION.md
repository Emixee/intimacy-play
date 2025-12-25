# 🚀 Intimacy Play - Optimisation Production

## 📦 Contenu du ZIP

Ce package contient les fichiers **MODIFIÉS ET NOUVEAUX** à intégrer dans votre projet existant.

---

## 📋 Liste des fichiers à remplacer/ajouter

### ⚙️ Configuration (REMPLACER)

| Fichier | Action | Description |
|---------|--------|-------------|
| `app.json` | REMPLACER | + Mode immersif, + expo-navigation-bar, + config production |
| `package.json` | REMPLACER | + expo-navigation-bar ~4.0.8 |

### 📱 Layouts (REMPLACER)

| Fichier | Action | Description |
|---------|--------|-------------|
| `app/_layout.tsx` | REMPLACER | + Mode immersif Android |
| `app/(main)/_layout.tsx` | REMPLACER | - test-ads.tsx supprimé |

### 🎮 Écran de jeu (REMPLACER)

| Fichier | Action | Description |
|---------|--------|-------------|
| `app/(main)/game.tsx` | REMPLACER | Version allégée (~300 lignes) |

### 🧩 Nouveaux composants (AJOUTER)

| Fichier | Action |
|---------|--------|
| `components/animations/ConfettiAnimation.tsx` | NOUVEAU |
| `components/animations/index.ts` | NOUVEAU |
| `components/game/GameHeader.tsx` | NOUVEAU |
| `components/game/ActionButtons.tsx` | NOUVEAU |
| `components/game/AlternativesModal.tsx` | NOUVEAU |
| `components/game/GameOverScreen.tsx` | NOUVEAU |
| `components/game/ChatZone.tsx` | NOUVEAU |
| `components/game/ReactionsZone.tsx` | NOUVEAU |
| `components/game/PendingPartnerChallengeIndicator.tsx` | NOUVEAU |
| `components/game/index.ts` | REMPLACER |
| `components/modals/CreatePartnerChallengeModal.tsx` | NOUVEAU |
| `components/modals/index.ts` | NOUVEAU |
| `components/ui/ErrorScreen.tsx` | NOUVEAU |
| `components/ui/index.ts` | REMPLACER |

### 🗑️ Fichiers à supprimer

| Fichier | Raison |
|---------|--------|
| `app/(main)/test-ads.tsx` | Fichier de test, inutile en production |

---

## 🔧 Instructions d'installation

### Étape 1 : Installer la dépendance

```bash
npx expo install expo-navigation-bar
```

### Étape 2 : Copier les fichiers

1. **Remplacer** les fichiers existants par ceux du ZIP
2. **Ajouter** les nouveaux fichiers dans les bons dossiers
3. **Créer** les dossiers manquants si nécessaire :
   - `components/animations/`
   - `components/modals/`
4. **Supprimer** `app/(main)/test-ads.tsx`

### Étape 3 : Structure finale attendue

```
intimacy-play/
├── app.json                          ← REMPLACÉ
├── package.json                      ← REMPLACÉ
├── app/
│   ├── _layout.tsx                   ← REMPLACÉ
│   └── (main)/
│       ├── _layout.tsx               ← REMPLACÉ
│       ├── game.tsx                  ← REMPLACÉ
│       └── test-ads.tsx              ← SUPPRIMÉ
├── components/
│   ├── animations/                   ← NOUVEAU DOSSIER
│   │   ├── ConfettiAnimation.tsx
│   │   └── index.ts
│   ├── game/
│   │   ├── index.ts                  ← REMPLACÉ
│   │   ├── ChallengeCard.tsx         (existant - garder)
│   │   ├── TurnIndicator.tsx         (existant - garder)
│   │   ├── GameHeader.tsx            ← NOUVEAU
│   │   ├── ActionButtons.tsx         ← NOUVEAU
│   │   ├── AlternativesModal.tsx     ← NOUVEAU
│   │   ├── GameOverScreen.tsx        ← NOUVEAU
│   │   ├── ChatZone.tsx              ← NOUVEAU
│   │   ├── ReactionsZone.tsx         ← NOUVEAU
│   │   └── PendingPartnerChallengeIndicator.tsx ← NOUVEAU
│   ├── modals/                       ← NOUVEAU DOSSIER
│   │   ├── CreatePartnerChallengeModal.tsx
│   │   └── index.ts
│   └── ui/
│       ├── index.ts                  ← REMPLACÉ
│       ├── Button.tsx                (existant - garder)
│       ├── Card.tsx                  (existant - garder)
│       └── ErrorScreen.tsx           ← NOUVEAU
```

### Étape 4 : Rebuild

```bash
# Nettoyer le cache
npx expo start --clear

# Rebuild Android
npx expo prebuild --clean
npx expo run:android

# Ou via EAS
eas build --profile production --platform android
```

---

## ✅ Résumé des optimisations

| Optimisation | Impact |
|--------------|--------|
| Mode immersif Android | UX plein écran, barre navigation masquée |
| Refactoring game.tsx | -40KB, 1500 → 300 lignes |
| Composants mémorisés | Moins de re-renders |
| Suppression test-ads | Bundle plus léger |
| Config production | Updates OTA, runtimeVersion |

---

## 🔍 Test du mode immersif

1. Lancer l'app sur un appareil Android
2. La barre de navigation du bas doit disparaître
3. Swiper depuis le bas pour la faire réapparaître temporairement
4. Elle disparaît automatiquement après quelques secondes

---

## ⚠️ Notes importantes

1. **Ne pas modifier** les autres fichiers qui ne sont pas dans ce ZIP
2. **Conserver** les fichiers existants dans `components/game/` qui ne sont pas listés (ChallengeCard.tsx, TurnIndicator.tsx, etc.)
3. **Tester** sur un appareil physique Android pour valider le mode immersif

---

*Intimacy Play v1.0.0 - Optimisation Production*
