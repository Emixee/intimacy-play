/**
 * Données légales de l'application Couple Challenge
 *
 * Contenu des CGU et de la Politique de Confidentialité
 * Éditeur : Digital Couple Games - Micro-entreprise
 * Adresse : 2, rue de Beauce, 28800 Le Gault Saint Denis, France
 */

// ============================================================
// INFORMATIONS DE L'ÉDITEUR
// ============================================================

export const COMPANY_INFO = {
  name: "Digital Couple Games",
  legalForm: "Micro-entreprise",
  address: "2, rue de Beauce",
  postalCode: "28800",
  city: "Le Gault Saint Denis",
  country: "France",
  fullAddress: "2, rue de Beauce, 28800 Le Gault Saint Denis, France",
  emails: {
    contact: "contact@digitalcouplegames.com",
    support: "support@digitalcouplegames.com",
    privacy: "privacy@digitalcouplegames.com",
    admin: "admin@digitalcouplegames.com",
  },
} as const;

// ============================================================
// CONFIGURATION LÉGALE
// ============================================================

export const LEGAL_CONFIG = {
  minAge: 18,
  mediaExpirationMinutes: 2,
  mediaExpirationText: "2 minutes ou fin de partie",
  subscriptionPrices: {
    monthly: "6,99 €",
    yearly: "39,99 €",
    yearlyMonthly: "3,33 €",
  },
  version: "1.0",
  lastUpdate: "Décembre 2024",
} as const;

// ============================================================
// POLITIQUE DE CONFIDENTIALITÉ
// ============================================================

export interface LegalSection {
  id: string;
  title: string;
  content: string[];
  subsections?: LegalSection[];
}

export const PRIVACY_POLICY: LegalSection[] = [
  {
    id: "intro",
    title: "1. Introduction",
    content: [
      "La présente politique de confidentialité décrit comment Couple Challenge collecte, utilise, stocke et protège vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) n°2016/679 et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.",
      "Couple Challenge est une application mobile destinée exclusivement aux adultes majeurs (18 ans et plus) permettant aux couples de partager des défis intimes.",
      "⚠️ AVERTISSEMENT : Cette application contient du contenu à caractère adulte et érotique. En l'utilisant, vous confirmez avoir au moins 18 ans.",
    ],
  },
  {
    id: "responsible",
    title: "2. Responsable du traitement",
    content: [
      `Dénomination : ${COMPANY_INFO.name}`,
      `Forme juridique : ${COMPANY_INFO.legalForm}`,
      `Adresse : ${COMPANY_INFO.fullAddress}`,
      `Email RGPD : ${COMPANY_INFO.emails.privacy}`,
    ],
  },
  {
    id: "data-collected",
    title: "3. Données collectées",
    content: [
      "Données fournies directement :",
      "• Adresse email : Création de compte, authentification",
      "• Mot de passe : Sécurisation du compte (stocké hashé)",
      "• Genre (homme/femme) : Personnalisation des défis",
      "• Date de naissance : Vérification de la majorité (18+)",
      "• Préférences de jeu : Personnalisation de l'expérience",
      "",
      "Contenus générés - MÉDIAS ÉPHÉMÈRES :",
      `• Photos, vidéos, messages audio : Supprimés automatiquement après ${LEGAL_CONFIG.mediaExpirationText}`,
      "• Messages texte : Durée de la session de jeu",
      "",
      "Données de paiement :",
      "Les paiements sont gérés par Google Play. Nous ne stockons aucune donnée bancaire.",
    ],
  },
  {
    id: "ephemeral-media",
    title: "4. Médias éphémères",
    content: [
      `Tous les médias partagés expirent automatiquement après ${LEGAL_CONFIG.mediaExpirationText} et sont définitivement supprimés de nos serveurs.`,
      "",
      "⚠️ NOUS NE POUVONS PAS GARANTIR :",
      "• Que votre partenaire ne fera pas de capture d'écran",
      "• Que votre partenaire n'utilisera pas un autre appareil pour photographier",
      "• Que votre partenaire ne téléchargera pas le média (fonctionnalité Premium)",
      "",
      "VOUS ÊTES SEUL RESPONSABLE :",
      "• Du contenu que vous choisissez de partager",
      "• Des personnes avec qui vous partagez ce contenu",
      "• De la vérification de l'identité de votre partenaire",
    ],
  },
  {
    id: "data-retention",
    title: "5. Durée de conservation",
    content: [
      "• Compte utilisateur : Jusqu'à suppression ou 3 ans d'inactivité",
      `• Médias (photos, vidéos, audio) : ${LEGAL_CONFIG.mediaExpirationText}`,
      "• Messages texte : Durée de la session de jeu",
      "• Logs de connexion : 12 mois",
      "• Données de facturation : 10 ans (obligation comptable)",
    ],
  },
  {
    id: "rights",
    title: "6. Vos droits (RGPD)",
    content: [
      "Conformément au RGPD, vous disposez des droits suivants :",
      "• Droit d'accès (Article 15)",
      "• Droit de rectification (Article 16)",
      "• Droit à l'effacement (Article 17)",
      "• Droit à la limitation (Article 18)",
      "• Droit à la portabilité (Article 20)",
      "• Droit d'opposition (Article 21)",
      "",
      `Pour exercer vos droits : ${COMPANY_INFO.emails.privacy}`,
      "Délai de réponse : 30 jours maximum",
      "",
      "Réclamation CNIL :",
      "www.cnil.fr - 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07",
    ],
  },
  {
    id: "security",
    title: "7. Sécurité des données",
    content: [
      "Mesures techniques :",
      "• Chiffrement HTTPS/TLS pour toutes les communications",
      "• Mots de passe hashés avec algorithmes sécurisés",
      "• Protection contre les captures d'écran (techniquement limitée)",
      `• Suppression automatique des médias après ${LEGAL_CONFIG.mediaExpirationText}`,
    ],
  },
  {
    id: "minors",
    title: "8. Mineurs",
    content: [
      `L'Application est strictement interdite aux mineurs de moins de ${LEGAL_CONFIG.minAge} ans.`,
      "Nous vérifions la date de naissance lors de l'inscription. Si nous découvrons qu'un utilisateur est mineur, son compte sera immédiatement supprimé.",
    ],
  },
  {
    id: "contact",
    title: "9. Contact",
    content: [
      `Contact général : ${COMPANY_INFO.emails.contact}`,
      `Support utilisateur : ${COMPANY_INFO.emails.support}`,
      `RGPD / Données personnelles : ${COMPANY_INFO.emails.privacy}`,
      `Adresse postale : ${COMPANY_INFO.fullAddress}`,
    ],
  },
];

// ============================================================
// CONDITIONS GÉNÉRALES D'UTILISATION
// ============================================================

export const TERMS_OF_USE: LegalSection[] = [
  {
    id: "preamble",
    title: "Préambule",
    content: [
      "⚠️ AVERTISSEMENT IMPORTANT :",
      `• Cette Application est EXCLUSIVEMENT RÉSERVÉE aux adultes majeurs (${LEGAL_CONFIG.minAge} ans et plus)`,
      "• L'Application propose des défis à caractère intime et érotique",
      "• L'utilisation implique le partage de contenus potentiellement explicites",
      "• L'ÉDITEUR DÉCLINE TOUTE RESPONSABILITÉ quant à l'utilisation des contenus partagés",
      "",
      `En créant un compte, vous certifiez avoir au moins ${LEGAL_CONFIG.minAge} ans et acceptez sans réserve les présentes CGU.`,
    ],
  },
  {
    id: "definitions",
    title: "Article 1 – Définitions",
    content: [
      "• Application : L'application mobile Couple Challenge",
      `• Éditeur : ${COMPANY_INFO.name}, ${COMPANY_INFO.fullAddress}`,
      "• Utilisateur : Toute personne physique majeure utilisant l'Application",
      "• Partenaire : L'autre membre du couple",
      "• Session : Une partie de jeu comprenant un ensemble de défis",
      "• Média : Photo, vidéo ou message audio partagé",
      "• Abonnement Premium : Formule payante avec fonctionnalités supplémentaires",
    ],
  },
  {
    id: "access",
    title: "Article 2 – Conditions d'accès",
    content: [
      "Pour utiliser l'Application, vous devez :",
      `• Être une personne physique majeure (${LEGAL_CONFIG.minAge} ans minimum)`,
      "• Disposer d'un appareil Android compatible",
      "• Créer un compte utilisateur",
      "• Accepter les présentes CGU et la Politique de Confidentialité",
      "",
      `En créant un compte, vous déclarez sur l'honneur avoir au moins ${LEGAL_CONFIG.minAge} ans.`,
    ],
  },
  {
    id: "service",
    title: "Article 3 – Description du service",
    content: [
      "Fonctionnalités gratuites :",
      "• Défis niveaux 1 (Romantique 😇) et 2 (Sensuel 😊)",
      "• Jusqu'à 15 défis personnalisés par joueur",
      `• Chat avec partage de médias éphémères (${LEGAL_CONFIG.mediaExpirationText})`,
      "• Réactions de base",
      "",
      "Fonctionnalités Premium :",
      "• Défis niveaux 3 (Érotique 😏) et 4 (Explicite 🔥)",
      "• Défis et modifications illimités",
      "• Thèmes premium (BDSM léger, Anal, etc.)",
      "• Téléchargement des médias reçus (avant expiration)",
      "• Défis personnalisés par le partenaire",
    ],
  },
  {
    id: "pricing",
    title: "Article 4 – Abonnements et paiements",
    content: [
      "Tarification :",
      `• Mensuel : ${LEGAL_CONFIG.subscriptionPrices.monthly} / mois`,
      `• Annuel : ${LEGAL_CONFIG.subscriptionPrices.yearly} / an (${LEGAL_CONFIG.subscriptionPrices.yearlyMonthly} / mois)`,
      "",
      "Les paiements sont traités via Google Play. L'Éditeur n'a pas accès à vos données bancaires.",
      "",
      "Droit de rétractation : En souscrivant, vous acceptez que le service soit fourni immédiatement et renoncez à votre droit de rétractation.",
      "",
      "Aucun remboursement ne sera accordé sauf dysfonctionnement technique avéré.",
    ],
  },
  {
    id: "obligations",
    title: "Article 5 – Obligations de l'utilisateur",
    content: [
      "Vous vous engagez à :",
      "• Utiliser l'Application uniquement avec un partenaire consentant et majeur",
      "• Ne pas partager de contenu impliquant des mineurs",
      "• Ne pas partager de contenu non consenti (revenge porn)",
      "• Ne pas diffuser les contenus reçus sans consentement du partenaire",
      "",
      "CONTENUS STRICTEMENT INTERDITS :",
      "• Tout contenu impliquant des mineurs (CSAM)",
      "• Tout contenu violent, zoophile, nécrophile",
      "• Tout contenu non consenti",
      "• Tout contenu diffamatoire ou injurieux",
    ],
  },
  {
    id: "liability",
    title: "Article 6 – Limitation de responsabilité",
    content: [
      "⚠️ CLAUSE ESSENTIELLE :",
      "",
      "L'ÉDITEUR FOURNIT L'APPLICATION « EN L'ÉTAT » ET DÉCLINE TOUTE GARANTIE.",
      "",
      "L'ÉDITEUR NE PEUT EN AUCUN CAS ÊTRE TENU RESPONSABLE :",
      "• Du contenu partagé par les utilisateurs",
      "• De la diffusion non autorisée de vos médias par votre partenaire",
      "• De l'utilisation malveillante (harcèlement, chantage, revenge porn)",
      "• Des captures d'écran effectuées par votre partenaire",
      "• Du téléchargement de médias par les utilisateurs Premium",
      "• De l'identité réelle des utilisateurs",
      "• Du consentement entre partenaires",
    ],
  },
  {
    id: "recommendations",
    title: "Article 7 – Recommandations de prudence",
    content: [
      "AVANT DE PARTAGER DU CONTENU INTIME :",
      "• Connaître personnellement votre partenaire",
      "• Vous assurer de sa majorité et de son consentement",
      "• Ne jamais montrer votre visage dans les contenus sensibles",
      "• Éviter tout élément permettant de vous identifier",
      "• Discuter préalablement des limites avec votre partenaire",
    ],
  },
  {
    id: "indemnification",
    title: "Article 8 – Indemnisation",
    content: [
      "Vous acceptez d'indemniser et de dégager l'Éditeur de toute responsabilité en cas de :",
      "• Réclamation d'un tiers liée à votre contenu",
      "• Violation des présentes CGU",
      "• Violation des lois applicables",
      "• Diffusion non autorisée de contenus de tiers",
    ],
  },
  {
    id: "law",
    title: "Article 9 – Droit applicable",
    content: [
      "Les présentes CGU sont régies par le droit français.",
      "En cas de litige, les parties s'engagent à rechercher une solution amiable.",
      "À défaut, les tribunaux français sont seuls compétents.",
      "",
      "Plateforme européenne de règlement des litiges :",
      "https://ec.europa.eu/consumers/odr",
    ],
  },
  {
    id: "acceptance",
    title: "Article 10 – Acceptation",
    content: [
      "En créant un compte sur Couple Challenge, vous reconnaissez :",
      "• Avoir lu et compris les présentes CGU",
      `• Avoir au moins ${LEGAL_CONFIG.minAge} ans`,
      "• Comprendre les risques liés au partage de contenus intimes",
      "• Être seul responsable des contenus que vous partagez et recevez",
    ],
  },
  {
    id: "contact",
    title: "Article 11 – Contact",
    content: [
      `Contact général : ${COMPANY_INFO.emails.contact}`,
      `Support utilisateur : ${COMPANY_INFO.emails.support}`,
      `RGPD / Données personnelles : ${COMPANY_INFO.emails.privacy}`,
      `Adresse postale : ${COMPANY_INFO.fullAddress}`,
    ],
  },
];