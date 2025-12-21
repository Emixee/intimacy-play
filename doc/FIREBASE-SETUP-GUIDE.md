# 🔥 Guide de Configuration Firebase - Intimacy Play

## 📋 Table des matières

1. [Créer le projet Firebase](#1-créer-le-projet-firebase)
2. [Configurer Authentication](#2-configurer-authentication)
3. [Créer la base Firestore](#3-créer-la-base-firestore)
4. [Activer Storage](#4-activer-storage)
5. [Configurer Cloud Messaging](#5-configurer-cloud-messaging-fcm)
6. [Télécharger google-services.json](#6-télécharger-google-servicesjson)
7. [Déployer les règles de sécurité](#7-déployer-les-règles-de-sécurité)

---

## 1. Créer le projet Firebase

1. Va sur [Firebase Console](https://console.firebase.google.com)
2. Clique sur **"Ajouter un projet"**
3. Nom du projet : `intimacy-play`
4. **Désactive** Google Analytics (optionnel)
5. Clique sur **"Créer le projet"**

---

## 2. Configurer Authentication

1. Menu : **Build > Authentication**
2. Clique sur **"Commencer"**
3. Onglet **"Sign-in method"**
4. Active **"Adresse e-mail/Mot de passe"**
5. Clique sur **"Enregistrer"**

---

## 3. Créer la base Firestore

1. Menu : **Build > Firestore Database**
2. Clique sur **"Créer une base de données"**
3. Mode : **"Démarrer en mode production"**
4. Emplacement : **"eur3 (europe-west)"**
5. Clique sur **"Créer"**

---

## 4. Activer Storage

1. Menu : **Build > Storage**
2. Clique sur **"Commencer"**
3. Mode : **"Démarrer en mode production"**
4. Même emplacement que Firestore
5. Clique sur **"OK"**

---

## 5. Configurer Cloud Messaging (FCM)

1. Menu : **Build > Cloud Messaging**
2. FCM est automatiquement activé ✅

---

## 6. Télécharger google-services.json

1. Page d'accueil du projet Firebase
2. Clique sur l'icône **Android**
3. Nom du package : `com.intimacyplay.app`
4. Clique sur **"Enregistrer l'application"**
5. **Télécharge** `google-services.json`
6. Place-le à la **racine** du projet

---

## 7. Déployer les règles de sécurité
```bash
# Se connecter à Firebase
firebase login

# Lier le projet
firebase use ton-project-id

# Déployer Firestore rules + indexes
firebase deploy --only firestore

# Déployer Storage rules
firebase deploy --only storage

# Ou tout d'un coup
firebase deploy --only firestore,storage
```

---

## ✅ Checklist

- [ ] Projet Firebase créé
- [ ] Authentication Email/Password activé
- [ ] Firestore créé
- [ ] Storage activé
- [ ] App Android ajoutée
- [ ] google-services.json téléchargé
- [ ] Règles Firestore déployées
- [ ] Règles Storage déployées
- [ ] Index déployés

---

## 🧪 Tester
```bash
# Lancer l'émulateur Firebase
firebase emulators:start

# Accéder à l'UI
# http://localhost:4000
```

---

**Configuration terminée ! 🎉**