# Fichiers à ajouter au projet intimacy-play

## 📦 Dépendances manquantes à installer

Exécute ces commandes dans ton projet :

```bash
# Médias
npx expo install expo-image-picker expo-av expo-file-system expo-media-library expo-sharing

# Animations
npx expo install lottie-react-native

# IAP (In-App Purchases) - pour le premium
npx expo install expo-in-app-purchases

# Publicités Google (optionnel pour l'instant)
npm install react-native-google-mobile-ads
```

## 📂 Fichiers à copier

Copie ces fichiers/dossiers dans ton projet :

### utils/
- `generateCode.ts` - Génération des codes de session
- `challengeSelector.ts` - Algorithme de sélection des défis

### components/ui/
- `Modal.tsx` - Composant modal réutilisable
- `PaywallModal.tsx` - Modal d'upgrade premium

### components/chat/
- `ChatBubble.tsx` - Bulle de message
- `MediaMessage.tsx` - Message média (photo/vidéo/audio)
- `ChatInput.tsx` - Champ de saisie du chat
- `index.ts` - Exports

### components/reactions/
- `ReactionPicker.tsx` - Sélecteur d'emojis
- `ReactionAnimation.tsx` - Animation des réactions
- `ReactionOverlay.tsx` - Overlay global pour les réactions
- `index.ts` - Exports

### components/game/
- `ChallengeCard.tsx` - Carte de défi
- `IntensitySelector.tsx` - Sélecteur d'intensité
- `ProgressBar.tsx` - Barre de progression
- `TurnIndicator.tsx` - Indicateur de tour
- `index.ts` - Exports

## ⚙️ Mise à jour de components/ui/index.ts

Ajoute ces exports dans `components/ui/index.ts` :

```typescript
export { Modal, ConfirmModal, AlertModal } from './Modal';
export { PaywallModal } from './PaywallModal';
```

## 🔧 Mise à jour du app.json

Ajoute ces plugins si tu utilises les médias :

```json
{
  "plugins": [
    [
      "expo-image-picker",
      {
        "photosPermission": "Permet d'envoyer des photos à ton partenaire",
        "cameraPermission": "Permet de prendre des photos pour les défis"
      }
    ],
    [
      "expo-av",
      {
        "microphonePermission": "Permet d'enregistrer des messages audio"
      }
    ]
  ]
}
```

## ✅ Checklist après installation

- [ ] `npm install` ou `yarn` pour installer les dépendances
- [ ] Copier les nouveaux fichiers
- [ ] Mettre à jour les index.ts
- [ ] `npx expo prebuild` pour régénérer le projet natif
- [ ] Tester avec `npx expo run:android`

## 📝 Notes

- Ces composants utilisent NativeWind pour le styling
- Ils importent les types depuis `../../types`
- Certains composants nécessitent `expo-linear-gradient` et `@expo/vector-icons`
