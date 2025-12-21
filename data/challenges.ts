/**
 * Données des défis pour Intimacy Play
 *
 * Structure :
 * - Défis séparés par niveau (1-4) et genre (homme/femme)
 * - Niveaux 1-2 : Gratuits
 * - Niveaux 3-4 : Premium
 *
 * Total : 648 défis
 * - Niveau 1 : 86 (43 homme + 43 femme)
 * - Niveau 2 : 70 (35 homme + 35 femme)
 * - Niveau 3 : 163 (81 homme + 82 femme)
 * - Niveau 4 : 329 (161 homme + 168 femme)
 * 
 * FIX BUG COUPLES MÊME GENRE :
 * Ajout de forPlayer dans SessionChallenge pour gérer les tours par RÔLE
 */

import {
  Gender,
  IntensityLevel,
  ChallengeType,
  SessionChallenge,
  PlayerRole,
} from "../types";

// ============================================================
// TYPES LOCAUX
// ============================================================

interface ChallengeData {
  text: string;
  type: ChallengeType;
  theme: string;
}

// ============================================================
// DÉFIS NIVEAU 1 - ROMANTIQUE (Gratuit)
// ============================================================

export const CHALLENGES_N1_HOMME: ChallengeData[] = [
  { text: "Enregistre-toi en train de lui dire 3 choses que tu aimes chez elle", type: "audio", theme: "Classique" },
  { text: "Chante-lui une chanson qui te fait penser à elle", type: "audio", theme: "Classique" },
  { text: "Raconte-lui ton plus beau souvenir ensemble", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce que tu ressens quand tu penses à elle", type: "audio", theme: "Classique" },
  { text: "Enregistre un message de bonne nuit personnalisé", type: "audio", theme: "Classique" },
  { text: "Récite-lui un poème d'amour", type: "audio", theme: "Classique" },
  { text: "Décris-lui ta journée idéale avec elle", type: "audio", theme: "Classique" },
  { text: "Dis-lui 5 raisons pourquoi elle te manque", type: "audio", theme: "Classique" },
  { text: "Raconte-lui comment tu es tombé amoureux d'elle", type: "audio", theme: "Classique" },
  { text: "Enregistre un message de bonjour pour son réveil", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce que tu admires le plus chez elle", type: "audio", theme: "Classique" },
  { text: "Raconte-lui un rêve que tu as fait avec elle", type: "audio", theme: "Classique" },
  { text: "Décris-lui l'endroit où tu aimerais l'emmener", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce qui te fait sourire quand tu penses à elle", type: "audio", theme: "Classique" },
  { text: "Raconte-lui un moment où elle t'a rendu fier", type: "audio", theme: "Classique" },
  { text: "Enregistre une déclaration d'amour spontanée", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce que sa voix te fait ressentir", type: "audio", theme: "Classique" },
  { text: "Raconte-lui ce que tu ferais si elle était là maintenant", type: "audio", theme: "Classique" },
  { text: "Lis-lui un passage d'un livre qui te touche", type: "audio", theme: "Classique" },
  { text: "Dis-lui les petits détails d'elle que tu adores", type: "audio", theme: "Classique" },
  { text: "Envoie une selfie de toi avec un grand sourire pour elle", type: "photo", theme: "Classique" },
  { text: "Photographie un endroit qui te fait penser à elle", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ton petit-déjeuner avec un message", type: "photo", theme: "Classique" },
  { text: "Prends une photo du ciel et dédie-la lui", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de quelque chose qui t'a fait penser à elle", type: "photo", theme: "Classique" },
  { text: "Photographie un cadeau que tu aimerais lui offrir", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de toi au travail avec un clin d'œil", type: "photo", theme: "Classique" },
  { text: "Prends une photo de ta main avec un cœur dessiné", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ton plat préféré", type: "photo", theme: "Classique" },
  { text: "Photographie un coucher de soleil pour elle", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de toi habillé comme elle aime", type: "photo", theme: "Classique" },
  { text: "Prends une photo d'un objet qui symbolise votre amour", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie surprise pendant ta journée", type: "photo", theme: "Classique" },
  { text: "Photographie un message d'amour écrit à la main", type: "photo", theme: "Classique" },
  { text: "Prends une selfie en faisant une grimace drôle", type: "photo", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de lui envoyer un bisou", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie en lui disant bonjour", type: "video", theme: "Classique" },
  { text: "Filme-toi en train de danser sur votre chanson", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo où tu mimes que tu l'embrasses", type: "video", theme: "Classique" },
  { text: "Filme ta réaction quand tu reçois un message d'elle", type: "video", theme: "Classique" },
  { text: "Filme-toi en train de lui raconter une blague", type: "video", theme: "Classique" },
  { text: "Filme-toi en train de lui faire un câlin virtuel", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo de toi lisant ses anciens messages", type: "video", theme: "Classique" },
];

export const CHALLENGES_N1_FEMME: ChallengeData[] = [
  { text: "Enregistre-toi en train de lui dire 3 choses que tu aimes chez lui", type: "audio", theme: "Classique" },
  { text: "Chante-lui une chanson qui te fait penser à lui", type: "audio", theme: "Classique" },
  { text: "Raconte-lui ton plus beau souvenir ensemble", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce que tu ressens quand tu penses à lui", type: "audio", theme: "Classique" },
  { text: "Enregistre un message de bonne nuit personnalisé", type: "audio", theme: "Classique" },
  { text: "Récite-lui un poème d'amour", type: "audio", theme: "Classique" },
  { text: "Décris-lui ta journée idéale avec lui", type: "audio", theme: "Classique" },
  { text: "Dis-lui 5 raisons pourquoi il te manque", type: "audio", theme: "Classique" },
  { text: "Raconte-lui comment tu es tombée amoureuse de lui", type: "audio", theme: "Classique" },
  { text: "Enregistre un message de bonjour pour son réveil", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce que tu admires le plus chez lui", type: "audio", theme: "Classique" },
  { text: "Raconte-lui un rêve que tu as fait avec lui", type: "audio", theme: "Classique" },
  { text: "Décris-lui l'endroit où tu aimerais qu'il t'emmène", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce qui te fait sourire quand tu penses à lui", type: "audio", theme: "Classique" },
  { text: "Raconte-lui un moment où il t'a rendue fière", type: "audio", theme: "Classique" },
  { text: "Enregistre une déclaration d'amour spontanée", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce que sa voix te fait ressentir", type: "audio", theme: "Classique" },
  { text: "Raconte-lui ce que tu ferais s'il était là maintenant", type: "audio", theme: "Classique" },
  { text: "Lis-lui un passage d'un livre qui te touche", type: "audio", theme: "Classique" },
  { text: "Dis-lui les petits détails de lui que tu adores", type: "audio", theme: "Classique" },
  { text: "Envoie une selfie de toi avec un grand sourire pour lui", type: "photo", theme: "Classique" },
  { text: "Photographie un endroit qui te fait penser à lui", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ton petit-déjeuner avec un message", type: "photo", theme: "Classique" },
  { text: "Prends une photo du ciel et dédie-la lui", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de quelque chose qui t'a fait penser à lui", type: "photo", theme: "Classique" },
  { text: "Photographie un cadeau que tu aimerais lui offrir", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de toi au travail avec un clin d'œil", type: "photo", theme: "Classique" },
  { text: "Prends une photo de ta main avec un cœur dessiné", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ton plat préféré", type: "photo", theme: "Classique" },
  { text: "Photographie un coucher de soleil pour lui", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de toi habillée comme il aime", type: "photo", theme: "Classique" },
  { text: "Prends une photo d'un objet qui symbolise votre amour", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie surprise pendant ta journée", type: "photo", theme: "Classique" },
  { text: "Photographie un message d'amour écrit à la main", type: "photo", theme: "Classique" },
  { text: "Prends une selfie en faisant une grimace drôle", type: "photo", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de lui envoyer un bisou", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie en lui disant bonjour", type: "video", theme: "Classique" },
  { text: "Filme-toi en train de danser sur votre chanson", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo où tu mimes que tu l'embrasses", type: "video", theme: "Classique" },
  { text: "Filme ta réaction quand tu reçois un message de lui", type: "video", theme: "Classique" },
  { text: "Filme-toi en train de lui raconter une blague", type: "video", theme: "Classique" },
  { text: "Filme-toi en train de lui faire un câlin virtuel", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo de toi lisant ses anciens messages", type: "video", theme: "Classique" },
];


// ============================================================
// DÉFIS NIVEAU 2 - SENSUEL (Gratuit)
// ============================================================

export const CHALLENGES_N2_HOMME: ChallengeData[] = [
  { text: "Décris-lui ce que tu ferais si tu pouvais l'embrasser maintenant", type: "audio", theme: "Classique" },
  { text: "Murmure-lui des mots doux comme si elle était près de toi", type: "audio", theme: "Classique" },
  { text: "Raconte-lui ton fantasme le plus romantique avec elle", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce qui te fait craquer chez elle physiquement", type: "audio", theme: "Classique" },
  { text: "Enregistre un message avec ta voix la plus sensuelle", type: "audio", theme: "Classique" },
  { text: "Décris-lui comment tu aimerais la câliner", type: "audio", theme: "Classique" },
  { text: "Raconte-lui un rêve sensuel que tu as fait d'elle", type: "audio", theme: "Classique" },
  { text: "Dis-lui où tu aimerais l'embrasser en premier", type: "audio", theme: "Classique" },
  { text: "Murmure-lui ce qui t'attire le plus chez elle", type: "audio", theme: "Classique" },
  { text: "Décris-lui comment tu la déshabilleras du regard", type: "audio", theme: "Classique" },
  { text: "Enregistre-toi en train de soupirer en pensant à elle", type: "audio", theme: "Classique" },
  { text: "Raconte-lui une situation où tu l'as trouvée irrésistible", type: "audio", theme: "Classique" },
  { text: "Dis-lui comment tu aimerais la serrer dans tes bras", type: "audio", theme: "Classique" },
  { text: "Murmure-lui des compliments sur son corps", type: "audio", theme: "Classique" },
  { text: "Envoie une selfie miroir de toi torse nu avec un sourire séducteur", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir suggestive en boxer", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de toi sortant de la gym, en sueur", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir dans ton lit, l'air langoureux", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de toi te mordant la lèvre", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir montrant tes abdos", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir de ta ceinture défaite", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir allongé sur le lit", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie avec un regard intense", type: "photo", theme: "Classique" },
  { text: "Prends une selfie de ton boxer qui dépasse du pantalon", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de toi le matin au réveil, sexy", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir de toi en boxer moulant", type: "photo", theme: "Lingerie" },
  { text: "Prends une selfie miroir de toi en jockstrap", type: "photo", theme: "Lingerie" },
  { text: "Envoie une selfie miroir de toi en caleçon sexy", type: "photo", theme: "Lingerie" },
  { text: "Filme-toi (selfie) en train d'enlever ta chemise", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi te passant la main dans les cheveux", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de te mettre du parfum", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de danser sensuellement", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi enlevant ta cravate", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) passant ta main sur ton torse", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi soufflant un baiser sensuel", type: "video", theme: "Classique" },
];

export const CHALLENGES_N2_FEMME: ChallengeData[] = [
  { text: "Décris-lui ce que tu ferais si tu pouvais l'embrasser maintenant", type: "audio", theme: "Classique" },
  { text: "Murmure-lui des mots doux comme s'il était près de toi", type: "audio", theme: "Classique" },
  { text: "Raconte-lui ton fantasme le plus romantique avec lui", type: "audio", theme: "Classique" },
  { text: "Dis-lui ce qui te fait craquer chez lui physiquement", type: "audio", theme: "Classique" },
  { text: "Enregistre un message avec ta voix la plus sensuelle", type: "audio", theme: "Classique" },
  { text: "Décris-lui comment tu aimerais qu'il te câline", type: "audio", theme: "Classique" },
  { text: "Raconte-lui un rêve sensuel que tu as fait de lui", type: "audio", theme: "Classique" },
  { text: "Dis-lui où tu aimerais qu'il t'embrasse en premier", type: "audio", theme: "Classique" },
  { text: "Murmure-lui ce qui t'attire le plus chez lui", type: "audio", theme: "Classique" },
  { text: "Décris-lui comment tu le déshabilleras du regard", type: "audio", theme: "Classique" },
  { text: "Enregistre-toi en train de soupirer en pensant à lui", type: "audio", theme: "Classique" },
  { text: "Raconte-lui une situation où tu l'as trouvé irrésistible", type: "audio", theme: "Classique" },
  { text: "Dis-lui comment tu aimerais qu'il te serre dans ses bras", type: "audio", theme: "Classique" },
  { text: "Murmure-lui des compliments sur son corps", type: "audio", theme: "Classique" },
  { text: "Envoie une selfie miroir de toi en lingerie fine", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir suggestive en nuisette", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie avec un décolleté plongeant", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir montrant tes jambes avec des bas", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir dans ton lit, l'air langoureux", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de toi te mordant la lèvre", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir de ta bretelle tombant de l'épaule", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir allongée sur le lit", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie avec un regard intense", type: "photo", theme: "Classique" },
  { text: "Prends une selfie de ton soutien-gorge qui dépasse", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de toi le matin au réveil, sexy", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir de toi en ensemble assorti", type: "photo", theme: "Lingerie" },
  { text: "Prends une selfie miroir de toi en porte-jarretelles", type: "photo", theme: "Lingerie" },
  { text: "Envoie une selfie miroir de toi en body transparent", type: "photo", theme: "Lingerie" },
  { text: "Filme-toi (selfie) en train d'enlever ton haut", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi te passant la main dans les cheveux", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de te mettre du parfum", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de danser sensuellement", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi enlevant tes bijoux", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) passant ta main sur tes hanches", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi soufflant un baiser sensuel", type: "video", theme: "Classique" },
];


// ============================================================
// DÉFIS NIVEAU 3 - ÉROTIQUE (Premium)
// ============================================================

export const CHALLENGES_N3_HOMME: ChallengeData[] = [
  { text: "Décris-lui en détail comment tu aimerais explorer son corps", type: "audio", theme: "Classique" },
  { text: "Enregistre-toi en train de gémir doucement en pensant à elle", type: "audio", theme: "Classique" },
  { text: "Raconte-lui un fantasme érotique détaillé", type: "audio", theme: "Classique" },
  { text: "Décris-lui ce que tu ferais si elle était nue devant toi", type: "audio", theme: "Classique" },
  { text: "Murmure-lui ce que tu aimerais lui faire au lit", type: "audio", theme: "Classique" },
  { text: "Raconte-lui comment tu la caresserais partout", type: "audio", theme: "Classique" },
  { text: "Décris-lui le plaisir que tu ressens en pensant à elle", type: "audio", theme: "Classique" },
  { text: "Murmure-lui ce que tu veux qu'elle te fasse", type: "audio", theme: "Classique" },
  { text: "Enregistre ta respiration qui s'accélère en l'imaginant", type: "audio", theme: "Classique" },
  { text: "Décris-lui comment tu embrasserais chaque partie de son corps", type: "audio", theme: "Classique" },
  { text: "Raconte-lui ta position préférée et pourquoi", type: "audio", theme: "Classique" },
  { text: "Murmure-lui des mots crus qui te viennent en pensant à elle", type: "audio", theme: "Classique" },
  { text: "Envoie une photo de ton érection à travers ton boxer", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir de toi nu", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ta main posée sur ton entrejambe", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir, torse nu, main descendant vers le bas", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir de tes fesses nues", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ton sexe en érection partiellement caché par ta main", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ta main descendant dans ton boxer", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir de ton corps nu avec ta main pour cacher", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir de ton érection visible sous le drap", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir nu avec une lumière tamisée", type: "photo", theme: "Classique" },
  { text: "Filme-toi (selfie miroir) en train de te déshabiller", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi caressant ton corps", type: "video", theme: "Classique" },
  { text: "Filme (selfie) ton érection grandissante à travers ton boxer", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi enlevant ton boxer", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de ta main descendant sur ton torse", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de te caresser les cuisses", type: "video", theme: "Classique" },
  { text: "Enregistre-toi en donnant des ordres d'une voix autoritaire", type: "audio", theme: "Dom/Sub" },
  { text: "Dis-lui ce que tu lui feras si elle désobéit", type: "audio", theme: "Dom/Sub" },
  { text: "Demande-lui de te supplier avec une voix dominante", type: "audio", theme: "Dom/Sub" },
  { text: "Prends une selfie de toi avec un regard dominateur", type: "photo", theme: "Dom/Sub" },
  { text: "Envoie une selfie de toi pointant du doigt (ordre)", type: "photo", theme: "Dom/Sub" },
  { text: "Enregistre-toi en train de supplier qu'elle te touche", type: "audio", theme: "Dom/Sub" },
  { text: "Dis-lui que tu feras tout ce qu'elle veut", type: "audio", theme: "Dom/Sub" },
  { text: "Prends une selfie de toi à genoux, tête baissée", type: "photo", theme: "Dom/Sub" },
  { text: "Envoie une selfie de toi les mains jointes en soumission", type: "photo", theme: "Dom/Sub" },
  { text: "Prends une selfie de toi avec une cravate autour des poignets", type: "photo", theme: "Bondage" },
  { text: "Envoie une selfie de tes mains attachées avec une ceinture", type: "photo", theme: "Bondage" },
  { text: "Décris-lui comment tu voudrais qu'elle t'attache", type: "audio", theme: "Bondage" },
  { text: "Prends une selfie allongé, poignets croisés au-dessus de la tête", type: "photo", theme: "Bondage" },
  { text: "Enregistre-toi en train de te donner une claque sur la cuisse", type: "audio", theme: "S&M" },
  { text: "Prends une photo de la marque rouge sur ta peau après une tape", type: "photo", theme: "S&M" },
  { text: "Décris-lui la douleur plaisante que tu ressens", type: "audio", theme: "S&M" },
  { text: "Envoie une photo de pinces à linge sur tes tétons", type: "photo", theme: "S&M" },
  { text: "Prends une selfie miroir de toi portant une culotte féminine", type: "photo", theme: "Féminisation" },
  { text: "Prends une selfie miroir de toi en porte-jarretelles et bas", type: "photo", theme: "Féminisation" },
  { text: "Enregistre-toi en parlant avec une voix douce et féminine", type: "audio", theme: "Féminisation" },
  { text: "Envoie une selfie miroir de toi en nuisette", type: "photo", theme: "Féminisation" },
  { text: "Prends une selfie miroir de toi en soutien-gorge rembourré", type: "photo", theme: "Féminisation" },
  { text: "Envoie une selfie miroir de toi en robe", type: "photo", theme: "Féminisation" },
  { text: "Prends une selfie miroir de toi avec une perruque", type: "photo", theme: "Féminisation" },
  { text: "Décris-toi en utilisant un prénom féminin", type: "audio", theme: "Féminisation" },
  { text: "Décris-lui comment tu lécheras chaque partie de son corps", type: "audio", theme: "Oral" },
  { text: "Enregistre-toi lui disant ce que tu feras avec ta langue", type: "audio", theme: "Oral" },
  { text: "Prends une selfie de ta langue tirée de façon suggestive", type: "photo", theme: "Oral" },
  { text: "Murmure-lui comment tu aimerais la goûter", type: "audio", theme: "Oral" },
  { text: "Décris-lui ce que ça te fait de penser à lui faire un cunnilingus", type: "audio", theme: "Oral" },
  { text: "Enregistre un message très explicite sur ce que tu veux lui faire", type: "audio", theme: "Dirty Talk" },
  { text: "Murmure-lui les mots les plus crus qui te viennent", type: "audio", theme: "Dirty Talk" },
  { text: "Décris-lui en détail comment tu la baiserais", type: "audio", theme: "Dirty Talk" },
  { text: "Prends une selfie miroir de toi en boxer ouvert", type: "photo", theme: "Lingerie" },
  { text: "Envoie une selfie miroir de toi en jockstrap moulant", type: "photo", theme: "Lingerie" },
  { text: "Prends une selfie miroir de toi en slip de bain très court", type: "photo", theme: "Lingerie" },
  { text: "Filme-toi (selfie miroir) changeant de sous-vêtement", type: "video", theme: "Lingerie" },
  { text: "Prends une selfie miroir de toi en boxer en cuir", type: "photo", theme: "Latex/Cuir" },
  { text: "Envoie une selfie miroir de toi avec un harnais", type: "photo", theme: "Latex/Cuir" },
  { text: "Prends une selfie miroir de toi avec un collier de cuir", type: "photo", theme: "Latex/Cuir" },
  { text: "Décris-lui les sensations du cuir sur ta peau", type: "audio", theme: "Latex/Cuir" },
  { text: "Écris son prénom sur ton torse et prends une selfie miroir", type: "photo", theme: "Body Writing" },
  { text: "Écris 'À toi' sur ton ventre et photographie", type: "photo", theme: "Body Writing" },
  { text: "Écris un mot coquin sur ta cuisse et envoie la photo", type: "photo", theme: "Body Writing" },
  { text: "Dessine un cœur sur ton entrejambe et photographie", type: "photo", theme: "Body Writing" },
  { text: "Prends une selfie de ton entrejambe bombé dans un lieu semi-public", type: "photo", theme: "Exhib" },
  { text: "Envoie une selfie de toi torse nu sur ton balcon", type: "photo", theme: "Exhib" },
  { text: "Décris-lui un lieu risqué où tu aimerais te montrer pour elle", type: "audio", theme: "Exhib" },
  { text: "Prends une selfie avec ton boxer visible dépassant dans un vestiaire", type: "photo", theme: "Exhib" },
  { text: "Prends une photo d'un plug anal à côté de toi", type: "photo", theme: "Jouets" },
  { text: "Envoie une photo de toi tenant un cockring", type: "photo", theme: "Jouets" },
  { text: "Décris-lui quel jouet tu aimerais utiliser", type: "audio", theme: "Jouets" },
  { text: "Prends une photo de ta collection de jouets", type: "photo", theme: "Jouets" },
];

export const CHALLENGES_N3_FEMME: ChallengeData[] = [
  { text: "Décris-lui en détail comment tu aimerais qu'il explore ton corps", type: "audio", theme: "Classique" },
  { text: "Enregistre-toi en train de gémir doucement en pensant à lui", type: "audio", theme: "Classique" },
  { text: "Raconte-lui un fantasme érotique détaillé", type: "audio", theme: "Classique" },
  { text: "Décris-lui ce que tu ferais s'il était nu devant toi", type: "audio", theme: "Classique" },
  { text: "Murmure-lui ce que tu aimerais qu'il te fasse au lit", type: "audio", theme: "Classique" },
  { text: "Raconte-lui comment tu aimerais qu'il te caresse", type: "audio", theme: "Classique" },
  { text: "Décris-lui le plaisir que tu ressens en pensant à lui", type: "audio", theme: "Classique" },
  { text: "Murmure-lui ce que tu veux lui faire", type: "audio", theme: "Classique" },
  { text: "Enregistre ta respiration qui s'accélère en l'imaginant", type: "audio", theme: "Classique" },
  { text: "Décris-lui comment tu voudrais qu'il embrasse chaque partie de ton corps", type: "audio", theme: "Classique" },
  { text: "Raconte-lui ta position préférée et pourquoi", type: "audio", theme: "Classique" },
  { text: "Murmure-lui des mots crus qui te viennent en pensant à lui", type: "audio", theme: "Classique" },
  { text: "Envoie une photo de ton intimité à travers ta culotte", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir de toi nue", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ta main posée sur ton entrejambe", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie de ta poitrine nue", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir de tes fesses nues", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ton sexe partiellement caché par ta main", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ta main descendant dans ta culotte", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir de ton corps nu avec ta main pour cacher", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir de ta poitrine sous un drap fin", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir nue avec une lumière tamisée", type: "photo", theme: "Classique" },
  { text: "Filme-toi (selfie miroir) en train de te déshabiller", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi caressant ton corps", type: "video", theme: "Classique" },
  { text: "Filme (selfie miroir) ta culotte mouillée", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de toi enlevant ta culotte", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo selfie de ta main sur ta poitrine", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de te caresser les cuisses", type: "video", theme: "Classique" },
  { text: "Enregistre-toi en donnant des ordres d'une voix autoritaire", type: "audio", theme: "Dom/Sub" },
  { text: "Dis-lui ce que tu lui feras s'il désobéit", type: "audio", theme: "Dom/Sub" },
  { text: "Demande-lui de te supplier avec une voix dominante", type: "audio", theme: "Dom/Sub" },
  { text: "Prends une selfie de toi avec un regard dominateur", type: "photo", theme: "Dom/Sub" },
  { text: "Envoie une selfie de toi pointant du doigt (ordre)", type: "photo", theme: "Dom/Sub" },
  { text: "Enregistre-toi en train de supplier qu'il te touche", type: "audio", theme: "Dom/Sub" },
  { text: "Dis-lui que tu feras tout ce qu'il veut", type: "audio", theme: "Dom/Sub" },
  { text: "Prends une selfie de toi à genoux, tête baissée", type: "photo", theme: "Dom/Sub" },
  { text: "Envoie une selfie de toi les mains jointes en soumission", type: "photo", theme: "Dom/Sub" },
  { text: "Prends une selfie de toi avec un foulard autour des poignets", type: "photo", theme: "Bondage" },
  { text: "Envoie une selfie de tes mains attachées avec un ruban", type: "photo", theme: "Bondage" },
  { text: "Décris-lui comment tu voudrais qu'il t'attache", type: "audio", theme: "Bondage" },
  { text: "Prends une selfie allongée, bras au-dessus de la tête", type: "photo", theme: "Bondage" },
  { text: "Enregistre-toi en train de te donner une fessée", type: "audio", theme: "S&M" },
  { text: "Prends une selfie de la marque rouge sur tes fesses", type: "photo", theme: "S&M" },
  { text: "Décris-lui la douleur plaisante que tu ressens", type: "audio", theme: "S&M" },
  { text: "Envoie une photo de pinces à linge sur tes tétons", type: "photo", theme: "S&M" },
  { text: "Prends une selfie miroir de toi tenant un gode-ceinture", type: "photo", theme: "Pegging" },
  { text: "Décris-lui ce que tu lui feras avec le strap-on", type: "audio", theme: "Pegging" },
  { text: "Envoie une selfie miroir de toi portant le gode-ceinture", type: "photo", theme: "Pegging" },
  { text: "Parle-lui de comment tu vas le pénétrer", type: "audio", theme: "Pegging" },
  { text: "Décris-lui comment tu lécheras chaque partie de son corps", type: "audio", theme: "Oral" },
  { text: "Enregistre-toi lui disant ce que tu feras avec ta langue", type: "audio", theme: "Oral" },
  { text: "Prends une selfie de ta langue tirée de façon suggestive", type: "photo", theme: "Oral" },
  { text: "Murmure-lui comment tu aimerais le goûter", type: "audio", theme: "Oral" },
  { text: "Décris-lui ce que ça te fait de penser à lui faire une fellation", type: "audio", theme: "Oral" },
  { text: "Enregistre un message très explicite sur ce que tu veux lui faire", type: "audio", theme: "Dirty Talk" },
  { text: "Murmure-lui les mots les plus crus qui te viennent", type: "audio", theme: "Dirty Talk" },
  { text: "Décris-lui en détail comment tu veux qu'il te baise", type: "audio", theme: "Dirty Talk" },
  { text: "Prends une selfie miroir de toi en ensemble de lingerie complet", type: "photo", theme: "Lingerie" },
  { text: "Envoie une selfie miroir de toi en corset", type: "photo", theme: "Lingerie" },
  { text: "Prends une selfie miroir de toi en guêpière", type: "photo", theme: "Lingerie" },
  { text: "Envoie une selfie miroir de toi en baby-doll transparent", type: "photo", theme: "Lingerie" },
  { text: "Filme-toi (selfie miroir) enfilant tes bas", type: "video", theme: "Lingerie" },
  { text: "Prends une selfie miroir de toi en string ficelle", type: "photo", theme: "Lingerie" },
  { text: "Prends une selfie miroir de toi en bustier en cuir", type: "photo", theme: "Latex/Cuir" },
  { text: "Envoie une selfie miroir de toi avec un collier et laisse", type: "photo", theme: "Latex/Cuir" },
  { text: "Prends une selfie miroir de toi en latex brillant", type: "photo", theme: "Latex/Cuir" },
  { text: "Décris-lui les sensations du latex/cuir sur ta peau", type: "audio", theme: "Latex/Cuir" },
  { text: "Écris son prénom sur ta poitrine et prends une selfie", type: "photo", theme: "Body Writing" },
  { text: "Écris 'Propriété de [son nom]' sur ton ventre", type: "photo", theme: "Body Writing" },
  { text: "Écris un mot coquin sur ta cuisse et photographie", type: "photo", theme: "Body Writing" },
  { text: "Écris 'À toi' avec une flèche vers ton intimité", type: "photo", theme: "Body Writing" },
  { text: "Prends une selfie de ton décolleté plongeant dans un café", type: "photo", theme: "Exhib" },
  { text: "Envoie une selfie de toi en lingerie sur ton balcon", type: "photo", theme: "Exhib" },
  { text: "Décris-lui un lieu risqué où tu aimerais te montrer pour lui", type: "audio", theme: "Exhib" },
  { text: "Prends une selfie sans culotte sous ta jupe en public", type: "photo", theme: "Exhib" },
  { text: "Prends une photo de ta culotte mouillée", type: "photo", theme: "Cyprine" },
  { text: "Décris-lui à quel point tu mouilles en pensant à lui", type: "audio", theme: "Cyprine" },
  { text: "Envoie une photo de ton doigt brillant de cyprine", type: "photo", theme: "Cyprine" },
  { text: "Prends une photo d'un vibromasseur à côté de toi", type: "photo", theme: "Jouets" },
  { text: "Envoie une photo de toi tenant un plug", type: "photo", theme: "Jouets" },
  { text: "Décris-lui quel jouet tu aimerais utiliser", type: "audio", theme: "Jouets" },
  { text: "Prends une photo de ta collection de jouets", type: "photo", theme: "Jouets" },
];


// ============================================================
// DÉFIS NIVEAU 4 - EXPLICITE (Premium)
// ============================================================

export const CHALLENGES_N4_HOMME: ChallengeData[] = [
  { text: "Enregistre-toi en train de te masturber en gémissant son prénom", type: "audio", theme: "Classique" },
  { text: "Décris-lui exactement ce que tu fais pendant que tu te touches", type: "audio", theme: "Classique" },
  { text: "Enregistre tes gémissements pendant que tu jouis", type: "audio", theme: "Classique" },
  { text: "Murmure-lui des mots crus pendant que tu te caresses", type: "audio", theme: "Classique" },
  { text: "Raconte-lui en direct ce que tu ressens quand tu te branles", type: "audio", theme: "Classique" },
  { text: "Enregistre le son de ta main sur ton sexe", type: "audio", theme: "Classique" },
  { text: "Décris-lui ton orgasme au moment où il arrive", type: "audio", theme: "Classique" },
  { text: "Gémis son prénom de plus en plus fort jusqu'à l'orgasme", type: "audio", theme: "Classique" },
  { text: "Enregistre-toi lui dire des cochonneries pendant l'acte", type: "audio", theme: "Classique" },
  { text: "Décris-lui comment tu voudrais la pénétrer", type: "audio", theme: "Classique" },
  { text: "Enregistre ta respiration haletante pendant le plaisir", type: "audio", theme: "Classique" },
  { text: "Murmure-lui ce que tu sens quand tu éjacules", type: "audio", theme: "Classique" },
  { text: "Envoie une photo de ta main tenant ton sexe en érection", type: "photo", theme: "Classique" },
  { text: "Prends une photo de ton sexe dressé, gros plan", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ton gland luisant de pré-sperme", type: "photo", theme: "Classique" },
  { text: "Prends une photo de ton sexe depuis ton point de vue", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ton érection matinale", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de tes testicules", type: "photo", theme: "Classique" },
  { text: "Prends une photo de ton périnée", type: "photo", theme: "Classique" },
  { text: "Prends une selfie miroir de ton corps entier nu en érection", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de toi te masturbant (selfie miroir)", type: "photo", theme: "Classique" },
  { text: "Filme (selfie) ta main montant et descendant sur ton sexe", type: "video", theme: "Classique" },
  { text: "Enregistre une vidéo (selfie) de ton sexe qui durcit", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de jouir en disant son prénom", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) caressant tes testicules", type: "video", theme: "Classique" },
  { text: "Filme (selfie) ton visage pendant que tu jouis", type: "video", theme: "Classique" },
  { text: "Ordonne-lui de se toucher en l'écoutant", type: "audio", theme: "Dom/Sub" },
  { text: "Dis-lui comment elle doit se masturber, étape par étape", type: "audio", theme: "Dom/Sub" },
  { text: "Enregistre-toi lui interdisant de jouir sans permission", type: "audio", theme: "Dom/Sub" },
  { text: "Envoie une photo de ton sexe avec un message d'ordre", type: "photo", theme: "Dom/Sub" },
  { text: "Décris-lui la punition qu'elle recevra", type: "audio", theme: "Dom/Sub" },
  { text: "Supplie-la de te laisser jouir", type: "audio", theme: "Dom/Sub" },
  { text: "Enregistre-toi demandant la permission de te toucher", type: "audio", theme: "Dom/Sub" },
  { text: "Envoie une selfie miroir de toi à genoux, sexe en main", type: "photo", theme: "Dom/Sub" },
  { text: "Dis-lui que tu es son esclave sexuel", type: "audio", theme: "Dom/Sub" },
  { text: "Envoie une selfie miroir de toi attaché (poignets), sexe en érection", type: "photo", theme: "Bondage" },
  { text: "Prends une photo de ton sexe avec un ruban enroulé autour", type: "photo", theme: "Bondage" },
  { text: "Décris-lui ta frustration d'être attaché et excité", type: "audio", theme: "Bondage" },
  { text: "Envoie une photo de tes tétons pincés fort", type: "photo", theme: "S&M" },
  { text: "Enregistre tes gémissements de douleur-plaisir", type: "audio", theme: "S&M" },
  { text: "Prends une photo des marques sur ton corps", type: "photo", theme: "S&M" },
  { text: "Décris-lui la douleur que tu t'infliges et le plaisir", type: "audio", theme: "S&M" },
  { text: "Envoie une photo de tes testicules serrées dans ta main", type: "photo", theme: "CBT" },
  { text: "Enregistre-toi te tapant doucement sur les testicules", type: "audio", theme: "CBT" },
  { text: "Prends une photo de ton sexe avec une pince à linge", type: "photo", theme: "CBT" },
  { text: "Décris-lui la sensation quand tu te fais mal aux couilles", type: "audio", theme: "CBT" },
  { text: "Envoie une photo de tes testicules étirées", type: "photo", theme: "CBT" },
  { text: "Envoie une photo de ton anus", type: "photo", theme: "Anal" },
  { text: "Prends une photo de ton doigt près de ton anus", type: "photo", theme: "Anal" },
  { text: "Décris-lui les sensations quand tu te doigtes l'anus", type: "audio", theme: "Anal" },
  { text: "Envoie une photo de ton anus lubrifié", type: "photo", theme: "Anal" },
  { text: "Prends une selfie miroir montrant ton anus écarté", type: "photo", theme: "Anal" },
  { text: "Enregistre tes gémissements pendant la stimulation anale", type: "audio", theme: "Anal" },
  { text: "Décris-lui comment tu veux qu'elle te pénètre", type: "audio", theme: "Pegging" },
  { text: "Envoie une photo de ton anus préparé et lubrifié", type: "photo", theme: "Pegging" },
  { text: "Enregistre tes gémissements pendant la stimulation prostatique", type: "audio", theme: "Pegging" },
  { text: "Prends une photo du plug en toi (selfie miroir)", type: "photo", theme: "Pegging" },
  { text: "Supplie-la de te prendre plus fort", type: "audio", theme: "Pegging" },
  { text: "Envoie une selfie miroir à quatre pattes, montrant ton anus", type: "photo", theme: "Pegging" },
  { text: "Envoie une selfie miroir de toi en lingerie complète, sexe visible", type: "photo", theme: "Féminisation" },
  { text: "Enregistre-toi jouissant avec une voix féminine", type: "audio", theme: "Féminisation" },
  { text: "Prends une selfie miroir de ton sexe dans une culotte trop petite", type: "photo", theme: "Féminisation" },
  { text: "Envoie une selfie miroir en nuisette transparente, sexe visible", type: "photo", theme: "Féminisation" },
  { text: "Décris-toi comme sa petite sissy obéissante", type: "audio", theme: "Féminisation" },
  { text: "Prends une selfie miroir de toi en robe soulevée montrant la culotte", type: "photo", theme: "Féminisation" },
  { text: "Envoie une selfie miroir en corset et string féminin", type: "photo", theme: "Féminisation" },
  { text: "Supplie-la de te traiter comme sa petite femme", type: "audio", theme: "Féminisation" },
  { text: "Prends une selfie miroir avec une perruque, en lingerie sexy", type: "photo", theme: "Féminisation" },
  { text: "Décris-lui comment tu lui ferais une fellation détaillée", type: "audio", theme: "Oral" },
  { text: "Prends une selfie avec un objet phallique dans ta bouche", type: "photo", theme: "Oral" },
  { text: "Enregistre-toi décrivant comment tu voudrais sucer son sexe", type: "audio", theme: "Oral" },
  { text: "Décris-lui ce que tu ferais avec ta langue sur son clitoris", type: "audio", theme: "Oral" },
  { text: "Envoie une selfie de ta bouche grande ouverte, prête", type: "photo", theme: "Oral" },
  { text: "Enregistre des sons de succion sur tes doigts", type: "audio", theme: "Oral" },
  { text: "Prends une selfie de toi léchant deux doigts sensuellement", type: "photo", theme: "Oral" },
  { text: "Décris-lui le goût que tu imagines de son sexe", type: "audio", theme: "Oral" },
  { text: "Enregistre-toi bavant sur un jouet en le suçant", type: "audio", theme: "Oral" },
  { text: "Envoie une photo de ta langue sortie, prête à lécher", type: "photo", theme: "Oral" },
  { text: "Envoie une photo de ton sperme sur tes doigts", type: "photo", theme: "Sperme" },
  { text: "Prends une photo de ton sperme coulant sur ton gland", type: "photo", theme: "Sperme" },
  { text: "Envoie une photo de toi léchant ton propre sperme", type: "photo", theme: "Sperme" },
  { text: "Décris-lui le goût de ton sperme", type: "audio", theme: "Sperme" },
  { text: "Prends une photo de ton sperme sur ton torse", type: "photo", theme: "Sperme" },
  { text: "Envoie une photo de ton sperme très près de ta bouche", type: "photo", theme: "Sperme" },
  { text: "Enregistre-toi avalant ton propre sperme", type: "audio", theme: "Sperme" },
  { text: "Prends une photo de toi avec du sperme sur le visage", type: "photo", theme: "Sperme" },
  { text: "Envoie une photo de ton sperme étalé avec tes doigts", type: "photo", theme: "Sperme" },
  { text: "Décris-lui ce que tu ferais avec ton sperme sur elle", type: "audio", theme: "Sperme" },
  { text: "Prends une photo de ton sperme sur ton ventre", type: "photo", theme: "Sperme" },
  { text: "Envoie une photo de ton sperme coulant de ta main", type: "photo", theme: "Sperme" },
  { text: "Filme (selfie) ton éjaculation en gros plan", type: "video", theme: "Sperme" },
  { text: "Filme-toi (selfie) léchant ton sperme sur tes doigts", type: "video", theme: "Sperme" },
  { text: "Prends une photo de ton sperme sur un jouet", type: "photo", theme: "Sperme" },
  { text: "Décris-lui où tu voudrais éjaculer sur elle", type: "audio", theme: "Sperme" },
  { text: "Envoie une photo de ton sperme qui coule le long de ton sexe", type: "photo", theme: "Sperme" },
  { text: "Filme (selfie) ton sperme gicler sur ton ventre", type: "video", theme: "Sperme" },
  { text: "Prends une photo de beaucoup de sperme accumulé", type: "photo", theme: "Sperme" },
  { text: "Décris-lui la quantité de sperme que tu as pour elle", type: "audio", theme: "Sperme" },
  { text: "Enregistre-toi te retenant de jouir pendant 5 minutes", type: "audio", theme: "Edging" },
  { text: "Décris-lui la frustration de ne pas pouvoir jouir", type: "audio", theme: "Edging" },
  { text: "Envoie une photo de ton sexe au bord de l'orgasme, pré-sperme visible", type: "photo", theme: "Edging" },
  { text: "Enregistre plusieurs faux départs avant l'orgasme", type: "audio", theme: "Edging" },
  { text: "Supplie-la de te laisser enfin jouir", type: "audio", theme: "Edging" },
  { text: "Enregistre-toi te rabaissant devant elle", type: "audio", theme: "Humiliation" },
  { text: "Prends une selfie dans une position humiliante", type: "photo", theme: "Humiliation" },
  { text: "Dis-lui que ton sexe est petit et qu'elle mérite mieux", type: "audio", theme: "Humiliation" },
  { text: "Remercie-la de te laisser te masturber", type: "audio", theme: "Humiliation" },
  { text: "Enregistre le message le plus cochon que tu puisses imaginer", type: "audio", theme: "Dirty Talk" },
  { text: "Décris-lui en détail comment tu éjaculerais en elle", type: "audio", theme: "Dirty Talk" },
  { text: "Murmure-lui tout ce que tu veux lui faire avec des mots crus", type: "audio", theme: "Dirty Talk" },
  { text: "Enregistre-toi l'insultant gentiment pendant l'acte", type: "audio", theme: "Dirty Talk" },
  { text: "Décris-lui comment tu la prendrais violemment", type: "audio", theme: "Dirty Talk" },
  { text: "Envoie une photo de glaçons sur ton torse", type: "photo", theme: "Température" },
  { text: "Décris-lui la sensation du froid sur ton sexe", type: "audio", theme: "Température" },
  { text: "Prends une photo de cire de bougie sur ta peau", type: "photo", theme: "Température" },
  { text: "Enregistre-toi vénérant son corps en détail", type: "audio", theme: "Worship" },
  { text: "Décris-lui comment tu adorerais chaque partie d'elle", type: "audio", theme: "Worship" },
  { text: "Dis-lui qu'elle est une déesse et que tu es indigne", type: "audio", theme: "Worship" },
  { text: "Envoie une selfie miroir de toi en boxer ouvert, sexe sorti", type: "photo", theme: "Lingerie" },
  { text: "Prends une selfie miroir de ton érection dans un jockstrap", type: "photo", theme: "Lingerie" },
  { text: "Filme-toi (selfie miroir) te masturbant en boxer ouvert", type: "video", theme: "Lingerie" },
  { text: "Prends une selfie miroir de toi nu avec juste un harnais", type: "photo", theme: "Latex/Cuir" },
  { text: "Envoie une selfie miroir de toi en slip en cuir, sexe visible", type: "photo", theme: "Latex/Cuir" },
  { text: "Décris-lui tes sensations en portant du cuir", type: "audio", theme: "Latex/Cuir" },
  { text: "Écris 'Salope' sur ton torse et prends une selfie", type: "photo", theme: "Body Writing" },
  { text: "Écris 'Propriété de [son nom]' avec flèche vers ton sexe", type: "photo", theme: "Body Writing" },
  { text: "Écris un mot très cru sur ton pubis", type: "photo", theme: "Body Writing" },
  { text: "Écris combien de fois tu as joui pour elle sur ton ventre", type: "photo", theme: "Body Writing" },
  { text: "Écris 'Sissy' sur toi si tu portes de la lingerie féminine", type: "photo", theme: "Body Writing" },
  { text: "Prends une selfie miroir nu dans un vestiaire public", type: "photo", theme: "Exhib" },
  { text: "Envoie une photo de ton érection dans ta voiture garée", type: "photo", theme: "Exhib" },
  { text: "Enregistre-toi te masturbant dans un lieu risqué", type: "audio", theme: "Exhib" },
  { text: "Prends une selfie de toi nu sur ton balcon la nuit", type: "photo", theme: "Exhib" },
  { text: "Envoie une photo de ton sexe sorti dans un parking", type: "photo", theme: "Exhib" },
  { text: "Décris-lui le frisson de te montrer en public", type: "audio", theme: "Exhib" },
  { text: "Prends une photo de crème chantilly sur ton sexe", type: "photo", theme: "Food Play" },
  { text: "Envoie une photo de chocolat fondu sur ton torse", type: "photo", theme: "Food Play" },
  { text: "Prends une photo de miel coulant sur ton gland", type: "photo", theme: "Food Play" },
  { text: "Décris-lui comment elle lècherait la nourriture sur toi", type: "audio", theme: "Food Play" },
  { text: "Envoie une photo de fruits (fraises) près de ton sexe", type: "photo", theme: "Food Play" },
  { text: "Enregistre-toi lui demandant de te guider", type: "audio", theme: "Masturb. guidée" },
  { text: "Dis-lui que tu fais exactement ce qu'elle t'ordonne", type: "audio", theme: "Masturb. guidée" },
  { text: "Enregistre-toi suivant ses instructions imaginaires", type: "audio", theme: "Masturb. guidée" },
  { text: "Décris-lui ton rythme et demande-lui si c'est bien", type: "audio", theme: "Masturb. guidée" },
  { text: "Supplie-la de te dire quand tu peux jouir", type: "audio", theme: "Masturb. guidée" },
  { text: "Envoie une photo de ton sexe dans un masturbateur", type: "photo", theme: "Jouets" },
  { text: "Prends une photo d'un cockring serré autour de ton sexe", type: "photo", theme: "Jouets" },
  { text: "Enregistre le son du vibromasseur et tes réactions", type: "audio", theme: "Jouets" },
  { text: "Envoie une photo de ton anus dilaté par un plug", type: "photo", theme: "Jouets" },
  { text: "Prends une photo de ton sexe avec un anneau vibrant", type: "photo", theme: "Jouets" },
  { text: "Décris-lui les sensations du stimulateur prostatique", type: "audio", theme: "Jouets" },
  { text: "Envoie une photo de ton sperme sur un jouet", type: "photo", theme: "Jouets" },
  { text: "Prends une photo de lubrifiant coulant sur un jouet", type: "photo", theme: "Jouets" },
  { text: "Enregistre-toi décrivant quel jouet tu préfères", type: "audio", theme: "Jouets" },
  { text: "Envoie une photo de toi avec un plug queue", type: "photo", theme: "Jouets" },
  { text: "Prends une photo d'un gros plug en toi", type: "photo", theme: "Jouets" },
  { text: "Filme-toi (selfie miroir) insérant un plug", type: "video", theme: "Jouets" },
  { text: "Enregistre-toi jouant un inconnu qui la drague", type: "audio", theme: "Jeu de rôle" },
  { text: "Joue le rôle d'un professeur qui la punit", type: "audio", theme: "Jeu de rôle" },
  { text: "Incarne un médecin qui l'examine intimement", type: "audio", theme: "Jeu de rôle" },
  { text: "Joue un cambrioleur qui la surprend", type: "audio", theme: "Jeu de rôle" },
];

export const CHALLENGES_N4_FEMME: ChallengeData[] = [
  { text: "Enregistre-toi en train de te masturber en gémissant son prénom", type: "audio", theme: "Classique" },
  { text: "Décris-lui exactement ce que tu fais pendant que tu te touches", type: "audio", theme: "Classique" },
  { text: "Enregistre tes gémissements pendant que tu jouis", type: "audio", theme: "Classique" },
  { text: "Murmure-lui des mots crus pendant que tu te caresses", type: "audio", theme: "Classique" },
  { text: "Raconte-lui en direct ce que tu ressens quand tu te doigtes", type: "audio", theme: "Classique" },
  { text: "Enregistre le son de tes doigts sur ton sexe mouillé", type: "audio", theme: "Classique" },
  { text: "Décris-lui ton orgasme au moment où il arrive", type: "audio", theme: "Classique" },
  { text: "Gémis son prénom de plus en plus fort jusqu'à l'orgasme", type: "audio", theme: "Classique" },
  { text: "Enregistre-toi lui dire des cochonneries pendant l'acte", type: "audio", theme: "Classique" },
  { text: "Décris-lui comment tu voudrais qu'il te pénètre", type: "audio", theme: "Classique" },
  { text: "Enregistre ta respiration haletante pendant le plaisir", type: "audio", theme: "Classique" },
  { text: "Murmure-lui ce que tu sens quand tu jouis", type: "audio", theme: "Classique" },
  { text: "Envoie une photo de ta main sur ton sexe ouvert", type: "photo", theme: "Classique" },
  { text: "Prends une photo de ton intimité, gros plan", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de tes doigts à l'intérieur de toi", type: "photo", theme: "Classique" },
  { text: "Prends une photo de ton sexe depuis ton point de vue", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de ton clitoris gonflé de plaisir", type: "photo", theme: "Classique" },
  { text: "Envoie une photo de tes lèvres écartées", type: "photo", theme: "Classique" },
  { text: "Prends une photo de ton anus", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir de ton corps nu, jambes écartées", type: "photo", theme: "Classique" },
  { text: "Envoie une selfie miroir de toi te masturbant", type: "photo", theme: "Classique" },
  { text: "Filme (selfie) tes doigts entrant et sortant de ton sexe", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) en train de jouir en disant son prénom", type: "video", theme: "Classique" },
  { text: "Filme-toi (selfie) caressant ton clitoris", type: "video", theme: "Classique" },
  { text: "Filme (selfie) ton corps qui tremble de plaisir", type: "video", theme: "Classique" },
  { text: "Filme (selfie) ton visage pendant que tu jouis", type: "video", theme: "Classique" },
  { text: "Ordonne-lui de se toucher en t'écoutant", type: "audio", theme: "Dom/Sub" },
  { text: "Dis-lui comment il doit se masturber, étape par étape", type: "audio", theme: "Dom/Sub" },
  { text: "Enregistre-toi lui interdisant de jouir sans permission", type: "audio", theme: "Dom/Sub" },
  { text: "Envoie une photo de ton sexe avec un message d'ordre", type: "photo", theme: "Dom/Sub" },
  { text: "Décris-lui la punition qu'il recevra", type: "audio", theme: "Dom/Sub" },
  { text: "Supplie-le de te laisser jouir", type: "audio", theme: "Dom/Sub" },
  { text: "Enregistre-toi demandant la permission de te toucher", type: "audio", theme: "Dom/Sub" },
  { text: "Envoie une selfie miroir de toi à genoux, main entre les jambes", type: "photo", theme: "Dom/Sub" },
  { text: "Dis-lui que tu es son esclave sexuelle", type: "audio", theme: "Dom/Sub" },
  { text: "Envoie une selfie miroir de toi attachée (poignets), jambes écartées", type: "photo", theme: "Bondage" },
  { text: "Prends une photo de ta poitrine avec un ruban enroulé", type: "photo", theme: "Bondage" },
  { text: "Décris-lui ta frustration d'être attachée et excitée", type: "audio", theme: "Bondage" },
  { text: "Envoie une photo de tes tétons pincés fort", type: "photo", theme: "S&M" },
  { text: "Enregistre tes gémissements de douleur-plaisir", type: "audio", theme: "S&M" },
  { text: "Prends une photo des marques rouges sur tes fesses", type: "photo", theme: "S&M" },
  { text: "Décris-lui la douleur que tu t'infliges et le plaisir", type: "audio", theme: "S&M" },
  { text: "Envoie une photo de ton anus", type: "photo", theme: "Anal" },
  { text: "Prends une photo de ton doigt près de ton anus", type: "photo", theme: "Anal" },
  { text: "Décris-lui les sensations quand tu te doigtes l'anus", type: "audio", theme: "Anal" },
  { text: "Envoie une photo de ton anus lubrifié", type: "photo", theme: "Anal" },
  { text: "Prends une selfie miroir montrant ton anus écarté", type: "photo", theme: "Anal" },
  { text: "Enregistre tes gémissements pendant la stimulation anale", type: "audio", theme: "Anal" },
  { text: "Envoie une photo d'un doigt entrant dans ton anus", type: "photo", theme: "Anal" },
  { text: "Décris-lui comment tu vas le pénétrer", type: "audio", theme: "Pegging" },
  { text: "Envoie une selfie miroir de toi portant le harnais avec le gode", type: "photo", theme: "Pegging" },
  { text: "Parle-lui avec une voix dominante de ce que tu vas lui faire", type: "audio", theme: "Pegging" },
  { text: "Prends une selfie miroir en position de domination avec le strap-on", type: "photo", theme: "Pegging" },
  { text: "Dis-lui de se préparer à te recevoir", type: "audio", theme: "Pegging" },
  { text: "Envoie une selfie miroir du gode entre tes jambes", type: "photo", theme: "Pegging" },
  { text: "Décris-lui en détail comment tu lui ferais une fellation", type: "audio", theme: "Oral" },
  { text: "Prends une selfie avec un objet dans ta bouche", type: "photo", theme: "Oral" },
  { text: "Enregistre-toi décrivant ce que tu ferais avec sa queue", type: "audio", theme: "Oral" },
  { text: "Envoie une selfie de ta langue sur un gode", type: "photo", theme: "Oral" },
  { text: "Décris-lui le goût que tu imagines de son sperme", type: "audio", theme: "Oral" },
  { text: "Envoie une selfie de ta bouche grande ouverte, langue tirée", type: "photo", theme: "Oral" },
  { text: "Enregistre des sons de succion", type: "audio", theme: "Oral" },
  { text: "Prends une selfie de tes lèvres autour d'un jouet", type: "photo", theme: "Oral" },
  { text: "Enregistre-toi bavant sur un gode", type: "audio", theme: "Oral" },
  { text: "Envoie une photo de toi faisant une gorge profonde sur un jouet", type: "photo", theme: "Oral" },
  { text: "Envoie une photo de ta cyprine sur tes doigts", type: "photo", theme: "Cyprine" },
  { text: "Prends une photo de ton sexe très mouillé", type: "photo", theme: "Cyprine" },
  { text: "Décris-lui à quel point tu mouilles pour lui", type: "audio", theme: "Cyprine" },
  { text: "Envoie une photo de ta cyprine coulant sur tes cuisses", type: "photo", theme: "Cyprine" },
  { text: "Prends une photo de ta culotte trempée de l'intérieur", type: "photo", theme: "Cyprine" },
  { text: "Filme (selfie) ta cyprine qui coule quand tu écartes tes lèvres", type: "video", theme: "Cyprine" },
  { text: "Envoie une photo de fils de cyprine entre tes doigts", type: "photo", theme: "Cyprine" },
  { text: "Enregistre le son mouillé de tes doigts sur ton sexe", type: "audio", theme: "Cyprine" },
  { text: "Prends une photo de cyprine sur un jouet", type: "photo", theme: "Cyprine" },
  { text: "Envoie une photo de toi goûtant ta cyprine", type: "photo", theme: "Cyprine" },
  { text: "Décris-lui le goût de ta cyprine", type: "audio", theme: "Cyprine" },
  { text: "Prends une photo de ta main brillante de cyprine", type: "photo", theme: "Cyprine" },
  { text: "Filme (selfie) ton sexe qui mouille pendant la masturbation", type: "video", theme: "Cyprine" },
  { text: "Envoie une photo de cyprine sur tes lèvres (bouche)", type: "photo", theme: "Cyprine" },
  { text: "Décris-lui l'odeur de ton excitation", type: "audio", theme: "Cyprine" },
  { text: "Prends une photo de draps mouillés après l'orgasme", type: "photo", theme: "Cyprine" },
  { text: "Envoie une photo de ta cyprine qui a coulé sur le lit", type: "photo", theme: "Cyprine" },
  { text: "Filme (selfie) toi étalant ta cyprine sur tes seins", type: "video", theme: "Cyprine" },
  { text: "Prends une photo de ton string trempé de cyprine", type: "photo", theme: "Cyprine" },
  { text: "Décris-lui combien tu es mouillée juste en pensant à lui", type: "audio", theme: "Cyprine" },
  { text: "Envoie une photo avec du faux sperme sur tes seins", type: "photo", theme: "Sperme" },
  { text: "Prends une selfie avec du faux sperme sur le visage", type: "photo", theme: "Sperme" },
  { text: "Décris-lui ce que tu ressens avec son sperme sur toi", type: "audio", theme: "Sperme" },
  { text: "Envoie une photo de faux sperme coulant sur ta langue", type: "photo", theme: "Sperme" },
  { text: "Prends une photo de faux sperme sur tes lèvres", type: "photo", theme: "Sperme" },
  { text: "Enregistre-toi suppliant qu'il éjacule sur ton visage", type: "audio", theme: "Sperme" },
  { text: "Envoie une photo de faux sperme sur ton ventre", type: "photo", theme: "Sperme" },
  { text: "Prends une photo de toi léchant du faux sperme sur tes doigts", type: "photo", theme: "Sperme" },
  { text: "Décris-lui où tu voudrais qu'il éjacule", type: "audio", theme: "Sperme" },
  { text: "Envoie une photo de faux sperme près de ta bouche ouverte", type: "photo", theme: "Sperme" },
  { text: "Prends une photo de faux sperme coulant entre tes seins", type: "photo", theme: "Sperme" },
  { text: "Envoie une photo de faux sperme sur tes fesses", type: "photo", theme: "Sperme" },
  { text: "Décris-lui comment tu avalerais son sperme", type: "audio", theme: "Sperme" },
  { text: "Prends une photo de faux sperme mélangé à ta cyprine", type: "photo", theme: "Sperme" },
  { text: "Enregistre-toi te retenant de jouir pendant 5 minutes", type: "audio", theme: "Edging" },
  { text: "Décris-lui la frustration de ne pas pouvoir jouir", type: "audio", theme: "Edging" },
  { text: "Envoie une photo de ton sexe au bord de l'orgasme", type: "photo", theme: "Edging" },
  { text: "Enregistre plusieurs faux départs avant l'orgasme", type: "audio", theme: "Edging" },
  { text: "Supplie-le de te laisser enfin jouir", type: "audio", theme: "Edging" },
  { text: "Enregistre-toi te rabaissant devant lui", type: "audio", theme: "Humiliation" },
  { text: "Prends une selfie dans une position humiliante", type: "photo", theme: "Humiliation" },
  { text: "Dis-lui que tu es sa petite salope", type: "audio", theme: "Humiliation" },
  { text: "Remercie-le de te laisser te masturber", type: "audio", theme: "Humiliation" },
  { text: "Enregistre le message le plus cochon que tu puisses imaginer", type: "audio", theme: "Dirty Talk" },
  { text: "Décris-lui en détail comment tu veux qu'il éjacule en toi", type: "audio", theme: "Dirty Talk" },
  { text: "Murmure-lui tout ce que tu veux qu'il te fasse avec des mots crus", type: "audio", theme: "Dirty Talk" },
  { text: "Enregistre-toi l'insultant gentiment pendant l'acte", type: "audio", theme: "Dirty Talk" },
  { text: "Décris-lui comment tu veux qu'il te prenne violemment", type: "audio", theme: "Dirty Talk" },
  { text: "Envoie une photo de glaçons sur tes tétons", type: "photo", theme: "Température" },
  { text: "Décris-lui la sensation du froid sur ton sexe", type: "audio", theme: "Température" },
  { text: "Prends une photo de cire de bougie sur ta peau", type: "photo", theme: "Température" },
  { text: "Enregistre-toi vénérant son corps en détail", type: "audio", theme: "Worship" },
  { text: "Décris-lui comment tu adorerais chaque partie de lui", type: "audio", theme: "Worship" },
  { text: "Dis-lui qu'il est un dieu et que tu le vénères", type: "audio", theme: "Worship" },
  { text: "Envoie une selfie miroir de toi en lingerie ouverte, sexe visible", type: "photo", theme: "Lingerie" },
  { text: "Prends une selfie miroir en porte-jarretelles, sans culotte", type: "photo", theme: "Lingerie" },
  { text: "Filme-toi (selfie miroir) te masturbant en lingerie fine", type: "video", theme: "Lingerie" },
  { text: "Envoie une selfie miroir en body ouvert à l'entrejambe", type: "photo", theme: "Lingerie" },
  { text: "Prends une selfie miroir en corset, seins sortis", type: "photo", theme: "Lingerie" },
  { text: "Prends une selfie miroir de toi nue avec juste un harnais", type: "photo", theme: "Latex/Cuir" },
  { text: "Envoie une selfie miroir de toi en latex, sexe exposé", type: "photo", theme: "Latex/Cuir" },
  { text: "Décris-lui tes sensations en portant du latex", type: "audio", theme: "Latex/Cuir" },
  { text: "Prends une selfie miroir avec un collier et laisse en cuir", type: "photo", theme: "Latex/Cuir" },
  { text: "Écris 'Salope' sur ta poitrine et prends une selfie", type: "photo", theme: "Body Writing" },
  { text: "Écris 'Propriété de [son nom]' avec flèche vers ton sexe", type: "photo", theme: "Body Writing" },
  { text: "Écris un mot très cru sur ton pubis", type: "photo", theme: "Body Writing" },
  { text: "Écris combien de fois tu as joui pour lui sur ton ventre", type: "photo", theme: "Body Writing" },
  { text: "Écris 'Baise-moi' sur ton dos (selfie miroir)", type: "photo", theme: "Body Writing" },
  { text: "Écris son prénom sur tes fesses", type: "photo", theme: "Body Writing" },
  { text: "Prends une selfie miroir nue dans un vestiaire public", type: "photo", theme: "Exhib" },
  { text: "Envoie une photo de toi te touchant dans ta voiture garée", type: "photo", theme: "Exhib" },
  { text: "Enregistre-toi te masturbant dans un lieu risqué", type: "audio", theme: "Exhib" },
  { text: "Prends une selfie de toi nue sur ton balcon la nuit", type: "photo", theme: "Exhib" },
  { text: "Envoie une photo de toi sans culotte dans un endroit public", type: "photo", theme: "Exhib" },
  { text: "Décris-lui le frisson de te montrer en public", type: "audio", theme: "Exhib" },
  { text: "Prends une selfie de ta poitrine exposée dans un lieu semi-public", type: "photo", theme: "Exhib" },
  { text: "Prends une photo de crème chantilly sur tes seins", type: "photo", theme: "Food Play" },
  { text: "Envoie une photo de chocolat fondu sur ton ventre", type: "photo", theme: "Food Play" },
  { text: "Prends une photo de miel coulant sur tes tétons", type: "photo", theme: "Food Play" },
  { text: "Décris-lui comment il lècherait la nourriture sur toi", type: "audio", theme: "Food Play" },
  { text: "Envoie une photo de fruits (fraises) près de ton sexe", type: "photo", theme: "Food Play" },
  { text: "Prends une photo de crème sur ta bouche comme du sperme", type: "photo", theme: "Food Play" },
  { text: "Enregistre-toi lui demandant de te guider", type: "audio", theme: "Masturb. guidée" },
  { text: "Dis-lui que tu fais exactement ce qu'il t'ordonne", type: "audio", theme: "Masturb. guidée" },
  { text: "Enregistre-toi suivant ses instructions imaginaires", type: "audio", theme: "Masturb. guidée" },
  { text: "Décris-lui ton rythme et demande-lui si c'est bien", type: "audio", theme: "Masturb. guidée" },
  { text: "Supplie-le de te dire quand tu peux jouir", type: "audio", theme: "Masturb. guidée" },
  { text: "Envoie une photo d'un gode à l'intérieur de toi", type: "photo", theme: "Jouets" },
  { text: "Prends une photo d'un plug anal en toi (selfie miroir)", type: "photo", theme: "Jouets" },
  { text: "Enregistre le son du vibromasseur et tes réactions", type: "audio", theme: "Jouets" },
  { text: "Envoie une photo d'un œuf vibrant en toi", type: "photo", theme: "Jouets" },
  { text: "Prends une photo de ta cyprine sur un jouet", type: "photo", theme: "Jouets" },
  { text: "Décris-lui les sensations du vibro sur ton clitoris", type: "audio", theme: "Jouets" },
  { text: "Envoie une selfie miroir chevauchant un gode ventouse", type: "photo", theme: "Jouets" },
  { text: "Prends une photo de lubrifiant coulant sur un gode", type: "photo", theme: "Jouets" },
  { text: "Enregistre-toi décrivant quel jouet te fait le plus jouir", type: "audio", theme: "Jouets" },
  { text: "Envoie une photo de plusieurs jouets prêts à l'emploi", type: "photo", theme: "Jouets" },
  { text: "Prends une photo d'un gros gode en toi", type: "photo", theme: "Jouets" },
  { text: "Filme-toi (selfie miroir) insérant un plug", type: "video", theme: "Jouets" },
  { text: "Enregistre-toi jouant une inconnue qui le drague", type: "audio", theme: "Jeu de rôle" },
  { text: "Joue le rôle d'une professeure qui le punit", type: "audio", theme: "Jeu de rôle" },
  { text: "Incarne une infirmière qui l'examine intimement", type: "audio", theme: "Jeu de rôle" },
  { text: "Joue une cambrioleuse qui le surprend", type: "audio", theme: "Jeu de rôle" },
];


// ============================================================
// MAP DES DÉFIS PAR NIVEAU ET GENRE
// ============================================================

const CHALLENGES_MAP: Record<IntensityLevel, Record<Gender, ChallengeData[]>> = {
  1: {
    homme: CHALLENGES_N1_HOMME,
    femme: CHALLENGES_N1_FEMME,
  },
  2: {
    homme: CHALLENGES_N2_HOMME,
    femme: CHALLENGES_N2_FEMME,
  },
  3: {
    homme: CHALLENGES_N3_HOMME,
    femme: CHALLENGES_N3_FEMME,
  },
  4: {
    homme: CHALLENGES_N4_HOMME,
    femme: CHALLENGES_N4_FEMME,
  },
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Mélange un tableau de façon aléatoire (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Récupère des défis aléatoires pour un niveau et genre donné
 */
function getRandomChallenges(
  level: IntensityLevel,
  gender: Gender,
  count: number
): ChallengeData[] {
  const challenges = CHALLENGES_MAP[level][gender];
  const shuffled = shuffleArray(challenges);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Détermine le niveau maximum autorisé
 */
function getMaxLevel(isPremium: boolean): IntensityLevel {
  return isPremium ? 4 : 2;
}

/**
 * Calcule la distribution des défis par niveau
 * Commence au niveau de départ et progresse vers les niveaux supérieurs
 */
function calculateLevelDistribution(
  count: number,
  startLevel: IntensityLevel,
  maxLevel: IntensityLevel
): Map<IntensityLevel, number> {
  const distribution = new Map<IntensityLevel, number>();
  const availableLevels = maxLevel - startLevel + 1;

  if (availableLevels === 1) {
    // Un seul niveau disponible
    distribution.set(startLevel, count);
  } else if (availableLevels === 2) {
    // Deux niveaux : 60% premier, 40% second
    const firstLevelCount = Math.ceil(count * 0.6);
    distribution.set(startLevel, firstLevelCount);
    distribution.set((startLevel + 1) as IntensityLevel, count - firstLevelCount);
  } else if (availableLevels === 3) {
    // Trois niveaux : 40% premier, 35% second, 25% troisième
    const firstLevelCount = Math.ceil(count * 0.4);
    const secondLevelCount = Math.ceil(count * 0.35);
    distribution.set(startLevel, firstLevelCount);
    distribution.set((startLevel + 1) as IntensityLevel, secondLevelCount);
    distribution.set((startLevel + 2) as IntensityLevel, count - firstLevelCount - secondLevelCount);
  } else {
    // Quatre niveaux : 30% / 30% / 25% / 15%
    const firstLevelCount = Math.ceil(count * 0.3);
    const secondLevelCount = Math.ceil(count * 0.3);
    const thirdLevelCount = Math.ceil(count * 0.25);
    distribution.set(1, firstLevelCount);
    distribution.set(2, secondLevelCount);
    distribution.set(3, thirdLevelCount);
    distribution.set(4, count - firstLevelCount - secondLevelCount - thirdLevelCount);
  }

  return distribution;
}

// ============================================================
// FONCTION PRINCIPALE DE SÉLECTION (AVEC FIX forPlayer)
// ============================================================

/**
 * Sélectionne les défis pour une session de jeu
 *
 * FIX BUG COUPLES MÊME GENRE :
 * - forGender : détermine le TEXTE du défi (contenu genré)
 * - forPlayer : détermine QUI fait le défi ("creator" | "partner")
 * 
 * Avant le fix, la validation utilisait forGender, ce qui posait problème
 * pour les couples homme/homme ou femme/femme car les deux joueurs avaient
 * le même genre et ne pouvaient pas valider les défis de l'autre.
 *
 * @param creatorGender - Genre du créateur de la session
 * @param partnerGender - Genre du partenaire
 * @param count - Nombre total de défis à sélectionner
 * @param startLevel - Niveau d'intensité de départ (1-4)
 * @param isPremium - Si l'utilisateur a accès au contenu premium
 * @returns Array de SessionChallenge avec alternance créateur/partenaire
 */
export function selectChallenges(
  creatorGender: Gender,
  partnerGender: Gender,
  count: number,
  startLevel: IntensityLevel,
  isPremium: boolean
): SessionChallenge[] {
  const maxLevel = getMaxLevel(isPremium);
  const effectiveStartLevel = Math.min(startLevel, maxLevel) as IntensityLevel;

  // Calcul de la distribution par niveau
  const distribution = calculateLevelDistribution(count, effectiveStartLevel, maxLevel);

  // Collecter les défis pour chaque genre
  const creatorChallenges: SessionChallenge[] = [];
  const partnerChallenges: SessionChallenge[] = [];

  // Nombre de défis par personne
  const creatorCount = Math.ceil(count / 2);
  const partnerCount = count - creatorCount;

  // Répartir les niveaux entre créateur et partenaire
  let creatorRemaining = creatorCount;
  let partnerRemaining = partnerCount;

  // Parcourir les niveaux dans l'ordre
  const levels = Array.from(distribution.keys()).sort((a, b) => a - b);

  for (const level of levels) {
    const levelCount = distribution.get(level) || 0;
    const creatorLevelCount = Math.ceil(levelCount / 2);
    const partnerLevelCount = levelCount - creatorLevelCount;

    // Défis pour le créateur (texte selon son genre, forPlayer = "creator")
    const creatorLevelChallenges = getRandomChallenges(
      level,
      creatorGender,
      Math.min(creatorLevelCount, creatorRemaining)
    );

    for (const challenge of creatorLevelChallenges) {
      creatorChallenges.push({
        text: challenge.text,
        level,
        type: challenge.type,
        forGender: creatorGender,    // Pour le contenu textuel
        forPlayer: "creator",         // FIX: Pour la validation des tours
        completed: false,
        completedBy: null,
        completedAt: null,
      });
      creatorRemaining--;
    }

    // Défis pour le partenaire (texte selon son genre, forPlayer = "partner")
    const partnerLevelChallenges = getRandomChallenges(
      level,
      partnerGender,
      Math.min(partnerLevelCount, partnerRemaining)
    );

    for (const challenge of partnerLevelChallenges) {
      partnerChallenges.push({
        text: challenge.text,
        level,
        type: challenge.type,
        forGender: partnerGender,    // Pour le contenu textuel
        forPlayer: "partner",         // FIX: Pour la validation des tours
        completed: false,
        completedBy: null,
        completedAt: null,
      });
      partnerRemaining--;
    }
  }

  // Mélanger chaque liste
  const shuffledCreator = shuffleArray(creatorChallenges);
  const shuffledPartner = shuffleArray(partnerChallenges);

  // Alterner les défis (créateur commence)
  const result: SessionChallenge[] = [];
  const maxLength = Math.max(shuffledCreator.length, shuffledPartner.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < shuffledCreator.length) {
      result.push(shuffledCreator[i]);
    }
    if (i < shuffledPartner.length) {
      result.push(shuffledPartner[i]);
    }
  }

  // Trier par niveau pour une progression naturelle
  result.sort((a, b) => a.level - b.level);

  return result;
}

// ============================================================
// FONCTIONS D'EXPORT UTILITAIRES
// ============================================================

/**
 * Retourne le nombre total de défis disponibles par niveau
 */
export function getChallengeCountByLevel(level: IntensityLevel): number {
  return CHALLENGES_MAP[level].homme.length + CHALLENGES_MAP[level].femme.length;
}

/**
 * Vérifie si un niveau est accessible
 */
export function isLevelAccessible(level: IntensityLevel, isPremium: boolean): boolean {
  if (level <= 2) return true;
  return isPremium;
}

/**
 * Retourne les niveaux accessibles pour un utilisateur
 */
export function getAccessibleLevels(isPremium: boolean): IntensityLevel[] {
  if (isPremium) {
    return [1, 2, 3, 4];
  }
  return [1, 2];
}

/**
 * Retourne les statistiques des défis
 */
export function getChallengeStats(): {
  total: number;
  byLevel: Record<IntensityLevel, { homme: number; femme: number; total: number }>;
} {
  return {
    total: 648,
    byLevel: {
      1: { homme: CHALLENGES_N1_HOMME.length, femme: CHALLENGES_N1_FEMME.length, total: CHALLENGES_N1_HOMME.length + CHALLENGES_N1_FEMME.length },
      2: { homme: CHALLENGES_N2_HOMME.length, femme: CHALLENGES_N2_FEMME.length, total: CHALLENGES_N2_HOMME.length + CHALLENGES_N2_FEMME.length },
      3: { homme: CHALLENGES_N3_HOMME.length, femme: CHALLENGES_N3_FEMME.length, total: CHALLENGES_N3_HOMME.length + CHALLENGES_N3_FEMME.length },
      4: { homme: CHALLENGES_N4_HOMME.length, femme: CHALLENGES_N4_FEMME.length, total: CHALLENGES_N4_HOMME.length + CHALLENGES_N4_FEMME.length },
    },
  };
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default {
  selectChallenges,
  getChallengeCountByLevel,
  isLevelAccessible,
  getAccessibleLevels,
  getChallengeStats,
  CHALLENGES_N1_HOMME,
  CHALLENGES_N1_FEMME,
  CHALLENGES_N2_HOMME,
  CHALLENGES_N2_FEMME,
  CHALLENGES_N3_HOMME,
  CHALLENGES_N3_FEMME,
  CHALLENGES_N4_HOMME,
  CHALLENGES_N4_FEMME,
};