# 💕 Intimacy Play

> Application mobile de défis intimes pour couples à distance

![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.81-green)
![Firebase](https://img.shields.io/badge/Firebase-21.x-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Platform](https://img.shields.io/badge/Platform-Android-brightgreen)

## 📱 Description

**Intimacy Play** est une application mobile Android permettant aux couples en relation à distance de renforcer leur intimité grâce à un système de défis progressifs et personnalisés.

### Caractéristiques principales

- 🎮 **648 défis** répartis sur 4 niveaux d'intensité
- 👫 **Système de tour par tour** en temps réel
- 🔥 **Progression graduelle** de l'intensité
- 💎 **Modèle Freemium** (niveaux 1-2 gratuits, 3-4 premium)
- 🔐 **Sécurisé** avec Firebase Authentication
- ⚡ **Temps réel** avec Firestore

## 🛠️ Stack Technique

### Frontend
- **Expo SDK 54** avec React Native 0.81
- **TypeScript** strict
- **Expo Router** (navigation file-based)
- **NativeWind** (Tailwind CSS pour RN)
- **Zustand** (state management)

### Backend
- **Firebase Authentication** (email/password)
- **Cloud Firestore** (base de données temps réel)
- **Firebase Cloud Messaging** (notifications push)
- **Firebase Storage** (médias éphémères)

## 📁 Structure du projet
```
intimacy-play/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Écrans non-authentifiés
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   └── (main)/             # Écrans authentifiés
│       ├── index.tsx       # Home
│       ├── profile.tsx
│       ├── create-session.tsx
│       ├── join-session.tsx
│       ├── waiting-room.tsx
│       ├── game.tsx
│       └── premium.tsx
├── components/
│   └── ui/                 # Composants réutilisables
├── config/
│   └── firebase.ts         # Configuration Firebase
├── data/
│   └── challenges.ts       # 648 défis
├── hooks/                  # Hooks personnalisés
├── services/               # Services Firebase
├── stores/                 # Zustand stores
├── theme/                  # Design tokens
├── types/                  # Types TypeScript
└── utils/                  # Utilitaires
```

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Android Studio (pour l'émulateur)
- Compte Firebase

### Étapes
```bash
# 1. Cloner le repo
git clone https://github.com/Emixee/intimacy-play.git
cd intimacy-play

# 2. Installer les dépendances
npm install

# 3. Copier la configuration
cp .env.example .env

# 4. Ajouter google-services.json
# Téléchargez depuis la console Firebase et placez à la racine

# 5. Générer le build de développement
npx expo prebuild

# 6. Lancer sur Android
npx expo run:android
```

### Configuration Firebase

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com)
2. Activez Authentication (Email/Password)
3. Créez une base Firestore
4. Téléchargez `google-services.json`
5. Placez-le à la racine du projet

## 📜 Scripts disponibles
```bash
# Développement
npm start              # Démarrer Expo
npm run android        # Lancer sur Android

# Builds EAS
npm run build:dev      # Build développement
npm run build:preview  # Build preview (APK)
npm run build:prod     # Build production (AAB)

# Firebase
npm run firebase:deploy:rules   # Déployer les règles Firestore
npm run firebase:emulator       # Lancer l'émulateur local
```

## 🎨 Niveaux d'intensité

| Niveau | Nom | Emoji | Accès |
|--------|-----|-------|-------|
| 1 | Romantique | 😇 | Gratuit |
| 2 | Sensuel | 😊 | Gratuit |
| 3 | Érotique | 😏 | Premium |
| 4 | Explicite | 🔥 | Premium |

## 💰 Modèle économique

- **Gratuit** : Niveaux 1-2, 3 parties/jour, 10 défis max
- **Premium** : Tous les niveaux, illimité, 50 défis max
  - Mensuel : 6,99€/mois
  - Annuel : 39,99€/an (44% d'économie)

## 🔐 Sécurité

- Authentification Firebase sécurisée
- Règles Firestore strictes
- Pas de stockage de données sensibles
- Médias éphémères (expiration 10 min)
- Contenu 18+ uniquement

## 📄 Licence

Propriétaire - Tous droits réservés © 2024

---

**Fait avec 💕 pour les couples à distance**