import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const T3_LOGO = (slug: string) =>
  `https://www.tabletopturniere.de/gfx/games/${slug}.jpg`;

// ─────────────────────────────────────────────────────────────
// JEUX (247 jeux recensés sur T³ — tabletopturniere.de)
// ─────────────────────────────────────────────────────────────

const games = [
  // ── Games Workshop — 40K Universe ────────────────────────────
  {
    name: "Warhammer 40,000",
    slug: "warhammer-40k",
    abbreviation: "W40K",
    description:
      "Le plus grand jeu de figurines de science-fiction. Des armées de l'Impérium, du Chaos et des Xenos s'affrontent dans un univers grimdark en 28mm.",
    logoUrl: T3_LOGO("warhammer-40k"),
  },
  {
    name: "Warhammer 40K: Kill Team",
    slug: "kill-team",
    abbreviation: "KT",
    description:
      "Escarmouche élite dans l'univers de 40k. De petits groupes de guerriers s'affrontent dans des environnements complexes pour des missions tactiques.",
    logoUrl: T3_LOGO("warhammer-40k-kill-team"),
  },
  {
    name: "Warhammer 40K: Boarding Actions",
    slug: "boarding-actions",
    abbreviation: "BA40K",
    description:
      "Variante de 40k simulant les combats d'abordage dans les couloirs étroits des vaisseaux spatiaux.",
    logoUrl: null,
  },
  {
    name: "Warhammer: The Horus Heresy",
    slug: "horus-heresy",
    abbreviation: "W30K",
    description:
      "Jeu de bataille épique dans l'ère pré-hérésie de Warhammer 40k. Space Marines légendaires s'affrontent lors de la grande trahison de l'Impérium.",
    logoUrl: T3_LOGO("warhammer-30k-the-horus-heresy"),
  },
  {
    name: "Warhammer: Legions Imperialis",
    slug: "legions-imperialis",
    abbreviation: "LI",
    description:
      "Jeu de bataille à grande échelle dans l'univers de The Horus Heresy, avec des armées entières en petite échelle (6mm).",
    logoUrl: T3_LOGO("warhammer-thh-legions-imperialis"),
  },
  {
    name: "Adeptus Titanicus",
    slug: "adeptus-titanicus",
    abbreviation: "AT",
    description:
      "Affrontement de titans de guerre colossaux dans l'ère de The Horus Heresy. Des dieux mécaniques s'affrontent sur des champs de bataille dévastés.",
    logoUrl: T3_LOGO("adeptus-titanicus"),
  },
  {
    name: "Aeronautica Imperialis",
    slug: "aeronautica-imperialis",
    abbreviation: "AI",
    description:
      "Dogfighting aérien dans l'univers 40k. Des escadrilles de chasseurs impériaux et xenos s'affrontent dans des batailles aériennes intenses.",
    logoUrl: T3_LOGO("aeronautica-imperialis"),
  },
  {
    name: "Necromunda",
    slug: "necromunda",
    abbreviation: "Nec",
    description:
      "Guerre de gangs dans les ruelles labyrinthiques de Necromunda, une cité-ruche de l'Impérium. Campagnes progressives avec évolution des guerriers.",
    logoUrl: T3_LOGO("necromunda"),
  },
  {
    name: "Battlefleet Gothic",
    slug: "battlefleet-gothic",
    abbreviation: "BFG",
    description:
      "Batailles navales spatiales dans l'univers 40k. Des flottes gigantesques s'affrontent dans le vide de l'espace.",
    logoUrl: T3_LOGO("battlefleet-gothic"),
  },
  {
    name: "Epic Armageddon",
    slug: "epic-armageddon",
    abbreviation: "EA",
    description:
      "Jeu de bataille 40k à l'échelle épique (6mm), reproduisant des guerres planétaires avec des milliers de figurines.",
    logoUrl: T3_LOGO("epic-armageddon"),
  },
  {
    name: "Shadow War: Armageddon",
    slug: "shadow-war-armageddon",
    abbreviation: "SW",
    description:
      "Escarmouche skirmish dans l'univers 40k, prédécesseur de Kill Team. Des équipes d'élite s'affrontent dans des ruines industrielles.",
    logoUrl: T3_LOGO("shadow-war-armageddon"),
  },
  {
    name: "Gorkamorka",
    slug: "gorkamorka",
    abbreviation: "GM",
    description:
      "Jeu de gang Ork post-apocalyptique. Des warbannes Orks s'affrontent dans les déserts de la planète Angelis pour contrôler les ressources.",
    logoUrl: T3_LOGO("gorkamorka"),
  },
  // ── Games Workshop — Age of Sigmar Universe ──────────────────
  {
    name: "Warhammer Age of Sigmar",
    slug: "age-of-sigmar",
    abbreviation: "WAoS",
    description:
      "Jeu de bataille fantastique dans les Royaumes Mortels. Des armées flamboyantes de l'Order, du Chaos, de la Death et de la Destruction s'affrontent.",
    logoUrl: T3_LOGO("warhammer-age-of-sigmar"),
  },
  {
    name: "Warhammer Age of Sigmar: Warcry",
    slug: "warcry",
    abbreviation: "WAoSW",
    description:
      "Escarmouche rapide dans les Royaumes Mortels. De petites bandes de guerriers s'affrontent dans des environnements dangereux.",
    logoUrl: T3_LOGO("warhammer-age-of-sigmar-warcry"),
  },
  {
    name: "Warhammer Age of Sigmar: Spearhead",
    slug: "spearhead",
    abbreviation: "AoSSH",
    description:
      "Format rapide d'Age of Sigmar avec des armées pré-construites, idéal pour des parties accessibles et compétitives.",
    logoUrl: null,
  },
  {
    name: "Warhammer Age of Sigmar: Skirmish",
    slug: "aos-skirmish",
    abbreviation: "WAoSS",
    description:
      "Variante escarmouche d'Age of Sigmar pour de très petites bandes.",
    logoUrl: null,
  },
  {
    name: "Warhammer Underworlds",
    slug: "warhammer-underworlds",
    abbreviation: "WUS",
    description:
      "Jeu de cartes/figurines ultra-compact dans les Royaumes Mortels. Des warbands s'affrontent pour des parties rapides et très tactiques.",
    logoUrl: T3_LOGO("warhammer-underworlds"),
  },
  // ── Games Workshop — The Old World ───────────────────────────
  {
    name: "Warhammer: The Old World",
    slug: "the-old-world",
    abbreviation: "TOW",
    description:
      "Le retour officiel de Warhammer Fantasy. Des armées en rangs serrés s'affrontent dans le Vieux Monde classique, ressuscitant l'ère dorée du hobby.",
    logoUrl: T3_LOGO("warhammer-the-old-world"),
  },
  {
    name: "Warhammer Fantasy Battles",
    slug: "warhammer-fantasy-battles",
    abbreviation: "WHFB",
    description:
      "Le classique jeu de bataille fantastique de Games Workshop. Des armées disciplinées en rangs serrés s'affrontent dans le Vieux Monde en 28mm.",
    logoUrl: T3_LOGO("warhammer"),
  },
  {
    name: "Warhammer Ancient Battles",
    slug: "warhammer-ancient-battles",
    abbreviation: "WAB",
    description:
      "Adaptation des règles Warhammer pour les batailles historiques de l'Antiquité et du Moyen Âge.",
    logoUrl: T3_LOGO("warhammer-ancient-battles"),
  },
  {
    name: "Warhammer Armies Project",
    slug: "warhammer-armies-project",
    abbreviation: "WAP",
    description:
      "Projet communautaire maintenant des listes d'armée pour toutes les factions de Warhammer Fantasy avec des règles équilibrées.",
    logoUrl: null,
  },
  // ── Games Workshop — Specialist Games ────────────────────────
  {
    name: "Blood Bowl",
    slug: "blood-bowl",
    abbreviation: "BB",
    description:
      "Football américain fantastique dans l'univers de Warhammer. Des équipes de toutes races (Orcs, Elfes, Nains...) s'affrontent dans un sport brutal.",
    logoUrl: T3_LOGO("blood-bowl"),
  },
  {
    name: "Blitz Bowl",
    slug: "blitz-bowl",
    abbreviation: "BB2",
    description:
      "Version simplifiée et rapide de Blood Bowl, idéale pour initier les nouveaux joueurs au football fantastique.",
    logoUrl: null,
  },
  {
    name: "Space Hulk",
    slug: "space-hulk",
    abbreviation: "SH",
    description:
      "Jeu de plateau tactique dans un vaisseau spatial abandonné. Des Space Marines Terminator affrontent des hordes de Genestealers.",
    logoUrl: T3_LOGO("space-hulk"),
  },
  {
    name: "Man O'War",
    slug: "man-o-war",
    abbreviation: "MoW",
    description:
      "Batailles navales fantastiques dans la Mer de Griffe dans l'univers de Warhammer Fantasy.",
    logoUrl: T3_LOGO("man-o-war"),
  },
  {
    name: "Mordheim",
    slug: "mordheim",
    abbreviation: "MH",
    description:
      "Escarmouche de gangs dans les ruines de la cité maudite de Mordheim. Système de campagne progressif avec expérience et équipement.",
    logoUrl: T3_LOGO("mordheim"),
  },
  {
    name: "Warmaster",
    slug: "warmaster",
    abbreviation: "Warm",
    description:
      "Jeu de bataille à grande échelle (10mm) dans l'univers de Warhammer Fantasy, conçu par Rick Priestley.",
    logoUrl: T3_LOGO("warmaster"),
  },
  {
    name: "Warmaster Revolution",
    slug: "warmaster-revolution",
    abbreviation: "WMR",
    description:
      "Version communautaire et actualisée de Warmaster, maintenue par des fans passionnés.",
    logoUrl: null,
  },
  {
    name: "Warmaster Ancients",
    slug: "warmaster-ancients",
    abbreviation: "WMA",
    description:
      "Adaptation des règles de Warmaster pour les batailles historiques de l'Antiquité.",
    logoUrl: null,
  },
  // ── The 9th Age ───────────────────────────────────────────────
  {
    name: "The 9th Age: Fantasy Battles",
    slug: "the-9th-age",
    abbreviation: "T9A",
    description:
      "Successeur communautaire de Warhammer Fantasy Battles, avec un équilibrage rigoureux et de nombreuses armées. Le jeu de bataille fantastique en rangs le plus joué en compétition.",
    logoUrl: T3_LOGO("fantasy-battles-the-9th-age"),
  },
  // ── Mantic Games ─────────────────────────────────────────────
  {
    name: "Kings of War",
    slug: "kings-of-war",
    abbreviation: "KoW",
    description:
      "Jeu de bataille fantastique en rangs serrés par Mantic Games. Règles rapides, bien équilibrées et gratuites. Idéal pour revaloriser les vieilles armées GW.",
    logoUrl: T3_LOGO("kings-of-war"),
  },
  {
    name: "Kings of War Vanguard",
    slug: "kings-of-war-vanguard",
    abbreviation: "KoWV",
    description:
      "Jeu d'escarmouche dans l'univers de Kings of War, pour des parties rapides avec de petites équipes.",
    logoUrl: null,
  },
  {
    name: "Dreadball",
    slug: "dreadball",
    abbreviation: "DB",
    description:
      "Sport de science-fiction futuriste par Mantic Games, dans un univers de stades galactiques.",
    logoUrl: T3_LOGO("dreadball"),
  },
  {
    name: "Deadzone",
    slug: "deadzone",
    abbreviation: "DZ",
    description:
      "Jeu d'escarmouche sci-fi dans des zones de quarantaine. Des factions variées s'affrontent dans des environnements modulaires.",
    logoUrl: T3_LOGO("deadzone"),
  },
  {
    name: "Firefight",
    slug: "firefight",
    abbreviation: "Fif",
    description:
      "Jeu de bataille sci-fi par Mantic Games, à l'échelle intermédiaire entre escarmouche et grande bataille.",
    logoUrl: null,
  },
  // ── Privateer Press ───────────────────────────────────────────
  {
    name: "Warmachine",
    slug: "warmachine",
    abbreviation: "WM",
    description:
      "Jeu de bataille steampunk par Privateer Press. Des Warcasters commandent des warjacks mécaniques et des troupes dans des combats intenses.",
    logoUrl: T3_LOGO("warmachine"),
  },
  {
    name: "Hordes",
    slug: "hordes",
    abbreviation: "Hrd",
    description:
      "Jeu de bataille dark fantasy par Privateer Press, compatible avec Warmachine. Des Warlocks contrôlent des warbeasts sauvages.",
    logoUrl: null,
  },
  {
    name: "Warcaster: Neo-Mechanika",
    slug: "warcaster-neo-mechanika",
    abbreviation: "WcNM",
    description:
      "Successeur de Warmachine dans un univers science-fantasy futuriste par Privateer Press.",
    logoUrl: null,
  },
  // ── Corvus Belli ──────────────────────────────────────────────
  {
    name: "Infinity",
    slug: "infinity",
    abbreviation: "Inf",
    description:
      "Escarmouche cyberpunk sci-fi ultra-tactique par Corvus Belli. Système d'ordres/ARO unique, figurines exceptionnelles, profondeur stratégique.",
    logoUrl: T3_LOGO("infinity"),
  },
  {
    name: "Aristeia!",
    slug: "aristeia",
    abbreviation: "A",
    description:
      "Jeu d'arène compétitif dans l'univers d'Infinity. Des héros s'affrontent dans le sport de divertissement le plus populaire de l'Human Sphere.",
    logoUrl: T3_LOGO("aristeia"),
  },
  {
    name: "Warcrow",
    slug: "warcrow",
    abbreviation: "WC",
    description:
      "Nouveau jeu d'escarmouche fantastique par Corvus Belli (créateurs d'Infinity). Figurines de haute qualité dans un univers fantasy original.",
    logoUrl: T3_LOGO("warcrow"),
  },
  // ── Wyrd Miniatures ───────────────────────────────────────────
  {
    name: "Malifaux",
    slug: "malifaux",
    abbreviation: "MF",
    description:
      "Escarmouche dans un univers gothique steampunk par Wyrd Miniatures. Utilise des cartes à jouer en lieu et place des dés pour un gameplay unique.",
    logoUrl: T3_LOGO("malifaux"),
  },
  // ── Star Wars (AMG/Fantasy Flight) ───────────────────────────
  {
    name: "Star Wars: Legion",
    slug: "star-wars-legion",
    abbreviation: "SWL",
    description:
      "Jeu de bataille dans l'univers Star Wars. Rébellion, Empire, Séparatistes et République s'affrontent en 35mm avec des figurines détaillées.",
    logoUrl: T3_LOGO("star-wars-legion"),
  },
  {
    name: "Star Wars: X-Wing Miniatures Game",
    slug: "star-wars-xwing",
    abbreviation: "XWING",
    description:
      "Jeu de dogfighting spatial dans l'univers Star Wars. Des escadrilles de vaisseaux pré-peints s'affrontent dans des manœuvres subtiles.",
    logoUrl: T3_LOGO("star-wars-x-wing-miniatures-game"),
  },
  {
    name: "Star Wars: Armada",
    slug: "star-wars-armada",
    abbreviation: "SWA",
    description:
      "Jeu de batailles de flottes dans l'univers Star Wars. Des vaisseaux capitaux colossaux s'affrontent escortés de vagues de chasseurs.",
    logoUrl: T3_LOGO("star-wars-armada"),
  },
  {
    name: "Star Wars: Imperial Assault",
    slug: "star-wars-imperial-assault",
    abbreviation: "SWIA",
    description:
      "Jeu de plateau tactique dans l'univers Star Wars, combinant missions narratives et escarmouches compétitives.",
    logoUrl: T3_LOGO("star-wars-imperial-assault"),
  },
  {
    name: "Star Wars: Shatterpoint",
    slug: "star-wars-shatterpoint",
    abbreviation: "SWSP",
    description:
      "Escarmouche centrée sur les personnages iconiques de Star Wars, surtout les Force-sensitifs. Figurines cinématiques en grand format.",
    logoUrl: T3_LOGO("star-wars-shatterpoint"),
  },
  {
    name: "Star Wars Miniatures",
    slug: "star-wars-miniatures",
    abbreviation: "SWM",
    description:
      "Jeu de figurines collectibles Star Wars de West End Games/Wizards of the Coast, jouable en escarmouche.",
    logoUrl: T3_LOGO("star-wars-miniatures"),
  },
  // ── Atomic Mass Games / Marvel ────────────────────────────────
  {
    name: "Marvel: Crisis Protocol",
    slug: "marvel-crisis-protocol",
    abbreviation: "MCP",
    description:
      "Escarmouche de super-héros Marvel par Atomic Mass Games. Des personnages iconiques s'affrontent avec des décors destructibles et des pouvoirs spectaculaires.",
    logoUrl: T3_LOGO("marvel-crisis-protocol"),
  },
  // ── Batman / DC ───────────────────────────────────────────────
  {
    name: "Batman Miniature Game",
    slug: "batman-miniature-game",
    abbreviation: "BMG",
    description:
      "Escarmouche dans l'univers DC Comics à Gotham City. Batman, ses alliés et ses ennemis s'affrontent dans des ruelles sombres.",
    logoUrl: T3_LOGO("batman-miniature-game"),
  },
  // ── Middle-earth ──────────────────────────────────────────────
  {
    name: "Middle-earth Strategy Battle Game",
    slug: "middle-earth-sbg",
    abbreviation: "LotR",
    description:
      "Jeu de bataille officiel dans la Terre du Milieu de Tolkien par Games Workshop. Armées du Bien et du Mal s'affrontent fidèlement aux livres et films.",
    logoUrl: T3_LOGO("lord-of-the-rings"),
  },
  {
    name: "War of the Ring",
    slug: "war-of-the-ring",
    abbreviation: "WotR",
    description:
      "Jeu de bataille épique dans la Terre du Milieu, avec de grandes armées et des héros légendaires.",
    logoUrl: T3_LOGO("war-of-the-ring"),
  },
  // ── WWII Historical ──────────────────────────────────────────
  {
    name: "Bolt Action",
    slug: "bolt-action",
    abbreviation: "BA",
    description:
      "Jeu de squad-level WWII en 28mm par Warlord Games. Des sections d'infanterie, chars et soutiens s'affrontent dans des batailles historiques.",
    logoUrl: T3_LOGO("bolt-action"),
  },
  {
    name: "Flames of War",
    slug: "flames-of-war",
    abbreviation: "FoW",
    description:
      "Wargame WW2 en 15mm par Battlefront Miniatures. Batailles d'infanterie, blindés et artillerie sur des tables très détaillées.",
    logoUrl: T3_LOGO("flames-of-war"),
  },
  {
    name: "World War III: Team Yankee",
    slug: "team-yankee",
    abbreviation: "TY",
    description:
      "Wargame de guerre froide en 15mm par Battlefront. OTAN vs Pacte de Varsovie dans les années 1980 en Europe.",
    logoUrl: T3_LOGO("world-war-iii-team-yankee"),
  },
  {
    name: "Dust 1947",
    slug: "dust-1947",
    abbreviation: "DT",
    description:
      "Wargame alternatif-historique WWII avec des éléments dieselpunk. Des super-soldats et véhicules rétrofuturistes s'affrontent en 1947.",
    logoUrl: T3_LOGO("dust-1947"),
  },
  {
    name: "Dust Warfare",
    slug: "dust-warfare",
    abbreviation: "DWF",
    description:
      "Jeu de bataille alternatif-historique WWII de Fantasy Flight Games, prédécesseur de Dust 1947.",
    logoUrl: null,
  },
  {
    name: "Dust Tactics Battlefield",
    slug: "dust-tactics-battlefield",
    abbreviation: "DTB",
    description:
      "Jeu de plateau WWII alternatif, version simpliée de la gamme Dust.",
    logoUrl: null,
  },
  {
    name: "Konflikt '47",
    slug: "konflikt-47",
    abbreviation: "K47",
    description:
      "Wargame alternatif-historique WWII avec des éléments fantastiques. Compatible avec Bolt Action.",
    logoUrl: T3_LOGO("konflikt-47"),
  },
  {
    name: "Secrets of the Third Reich",
    slug: "secrets-of-the-third-reich",
    abbreviation: "SOTR",
    description:
      "Wargame WWII alternatif avec zombies, soldats d'élite surnaturels et technologie secrète.",
    logoUrl: null,
  },
  {
    name: "Blood Red Skies",
    slug: "blood-red-skies",
    abbreviation: "BRS",
    description:
      "Jeu de dogfighting aérien WWII rapide et dynamique par Warlord Games.",
    logoUrl: null,
  },
  {
    name: "Chain of Command",
    slug: "chain-of-command",
    abbreviation: "CoC",
    description:
      "Wargame WWII tactique et immersif par Two Fat Lardies. Système de commandement et de suppression réaliste.",
    logoUrl: null,
  },
  {
    name: "Force on Force",
    slug: "force-on-force",
    abbreviation: "FoF",
    description:
      "Wargame moderne et contemporain par Ambush Alley Games. Des conflits du XXe et XXIe siècles en 15-28mm.",
    logoUrl: null,
  },
  {
    name: "Operation Squad",
    slug: "operation-squad",
    abbreviation: "OS",
    description:
      "Jeu d'escarmouche WWII simple et rapide, idéal pour de petites sections.",
    logoUrl: null,
  },
  {
    name: "Blitzkrieg Commander",
    slug: "blitzkrieg-commander",
    abbreviation: "BKC",
    description:
      "Wargame WWII à grande échelle, de l'escarmouche à la grande bataille, en 6-15mm.",
    logoUrl: null,
  },
  {
    name: "Kugelhagel",
    slug: "kugelhagel",
    abbreviation: "KH",
    description:
      "Jeu d'escarmouche WWII pour de petites unités en action rapide.",
    logoUrl: null,
  },
  {
    name: "Steinhagel",
    slug: "steinhagel",
    abbreviation: "StHag",
    description:
      "Wargame médiéval basé sur la même mécanique que Kugelhagel.",
    logoUrl: null,
  },
  {
    name: "Operation World War Two",
    slug: "operation-world-war-two",
    abbreviation: "OWWII",
    description:
      "Jeu de wargame WWII tactique pour des opérations à l'échelle de la section.",
    logoUrl: null,
  },
  {
    name: "Achtung Panzer!",
    slug: "achtung-panzer",
    abbreviation: "AP",
    description:
      "Jeu de batailles de blindés WWII par Warlord Games, centré sur les affrontements entre chars.",
    logoUrl: null,
  },
  {
    name: "Behind Omaha",
    slug: "behind-omaha",
    abbreviation: "BO",
    description:
      "Jeu d'escarmouche WWII centré sur le débarquement en Normandie.",
    logoUrl: null,
  },
  {
    name: "Tanks",
    slug: "tanks",
    abbreviation: "Tnk",
    description:
      "Jeu rapide de batailles de chars WWII par Gale Force Nine, avec des véhicules pré-peints.",
    logoUrl: T3_LOGO("tanks"),
  },
  {
    name: "Spectre Operations",
    slug: "spectre-operations",
    abbreviation: "SO",
    description:
      "Jeu d'opérations spéciales modernes et contemporaines, de contre-terrorisme aux conflits asymétriques.",
    logoUrl: null,
  },
  {
    name: "Sharp Practice",
    slug: "sharp-practice",
    abbreviation: "ShPr",
    description:
      "Wargame d'ère napoléonienne et XVIIIe siècle par Two Fat Lardies, centré sur des unités d'élite.",
    logoUrl: null,
  },
  {
    name: "Valour and Fortitude",
    slug: "valour-and-fortitude",
    abbreviation: "VaF",
    description:
      "Jeu de bataille napoléonien par Warlord Games, conçu pour des parties rapides à grande échelle.",
    logoUrl: null,
  },
  // ── Sci-Fi Historique / Post-Apo ─────────────────────────────
  {
    name: "Gaslands",
    slug: "gaslands",
    abbreviation: "GL",
    description:
      "Course de voitures post-apocalyptique Mad Max-inspired par Osprey. Utilisez de vraies voitures jouets customisées.",
    logoUrl: T3_LOGO("gaslands"),
  },
  {
    name: "Fallout: Wasteland Warfare",
    slug: "fallout-wasteland-warfare",
    abbreviation: "FWW",
    description:
      "Jeu d'escarmouche dans l'univers post-apocalyptique de Fallout. Survivants, ghouls, super mutants et robots s'affrontent dans les Terres Désolées.",
    logoUrl: T3_LOGO("fallout-wasteland-warfare"),
  },
  {
    name: "The Walking Dead: All Out War",
    slug: "the-walking-dead-all-out-war",
    abbreviation: "TWD",
    description:
      "Jeu d'escarmouche dans l'univers de The Walking Dead par Mantic Games. Survie et conflits entre groupes humains.",
    logoUrl: T3_LOGO("the-walking-dead-all-out-war"),
  },
  {
    name: "Trench Crusade",
    slug: "trench-crusade",
    abbreviation: "TrC",
    description:
      "Jeu d'escarmouche dans un univers de Guerre Sainte alternative, dark fantasy. Une Grande Guerre décalée où la foi et la sorcellerie s'affrontent.",
    logoUrl: T3_LOGO("trench-crusade"),
  },
  {
    name: "Necropolis28",
    slug: "necropolis28",
    abbreviation: "N28",
    description:
      "Jeu d'escarmouche grimdark fortement inspiré de Warhammer 40k, conçu pour être accessible et modulaire.",
    logoUrl: null,
  },
  {
    name: "Turnip28",
    slug: "turnip28",
    abbreviation: "T28",
    description:
      "Jeu d'escarmouche grotesque et décalé inspiré de Warhammer, dans un univers post-apocalyptique de racines de navet.",
    logoUrl: null,
  },
  // ── Sci-Fi Contemporary ───────────────────────────────────────
  {
    name: "Dropzone Commander",
    slug: "dropzone-commander",
    abbreviation: "DZC",
    description:
      "Jeu de science-fiction futuriste par Hawk Wargames. Des dropships déposent des troupes dans des villes en ruines pour des batailles urbaines rapides.",
    logoUrl: T3_LOGO("dropzone-commander"),
  },
  {
    name: "Dropfleet Commander",
    slug: "dropfleet-commander",
    abbreviation: "DFC",
    description:
      "Jeu de batailles de flottes orbitales dans l'univers de Dropzone Commander. Contrôlez l'orbite pour dominer le champ de bataille.",
    logoUrl: T3_LOGO("dropfleet-commander"),
  },
  {
    name: "OPR Grimdark Future",
    slug: "opr-grimdark-future",
    abbreviation: "OGF",
    description:
      "Alternative gratuite et simplifiée à Warhammer 40k par One Page Rules. Toutes les règles en une page.",
    logoUrl: null,
  },
  {
    name: "OPR Grimdark Future: Firefight",
    slug: "opr-grimdark-future-firefight",
    abbreviation: "OGFF",
    description:
      "Version escarmouche de OPR Grimdark Future pour de petites équipes.",
    logoUrl: null,
  },
  {
    name: "OPR Age of Fantasy",
    slug: "opr-age-of-fantasy",
    abbreviation: "OAoF",
    description:
      "Alternative gratuite et simplifiée aux jeux de bataille fantastique par One Page Rules.",
    logoUrl: null,
  },
  {
    name: "OPR Age of Fantasy: Skirmish",
    slug: "opr-age-of-fantasy-skirmish",
    abbreviation: "OAoFS",
    description:
      "Version escarmouche de OPR Age of Fantasy pour de petites bandes.",
    logoUrl: null,
  },
  {
    name: "OPR Age of Fantasy: Regiments",
    slug: "opr-age-of-fantasy-regiments",
    abbreviation: "OAoFR",
    description:
      "Version intermédiaire de OPR Age of Fantasy pour des régiments de taille moyenne.",
    logoUrl: null,
  },
  {
    name: "Starship Troopers",
    slug: "starship-troopers",
    abbreviation: "SST",
    description:
      "Jeu de bataille sci-fi basé sur l'univers de Robert A. Heinlein. Des Fédérateurs affrontent les hordes d'Arachnides.",
    logoUrl: null,
  },
  {
    name: "AT-43",
    slug: "at-43",
    abbreviation: "AT43",
    description:
      "Jeu de bataille sci-fi par Rackham Entertainment avec des figurines pré-peintes. Armées humaines et extraterrestres dans un futur sombre.",
    logoUrl: T3_LOGO("at-43"),
  },
  {
    name: "Heavy Gear Blitz",
    slug: "heavy-gear-blitz",
    abbreviation: "HGB",
    description:
      "Jeu de mecha militaire sci-fi en 1/144 par Dream Pod 9. Des robots bipèdes s'affrontent dans des batailles épiques.",
    logoUrl: null,
  },
  {
    name: "Monsterpocalypse",
    slug: "monsterpocalypse",
    abbreviation: "Mopoc",
    description:
      "Jeu de kaijus géants par Privateer Press. Des monstres colossaux dévastent des villes dans des affrontements épiques.",
    logoUrl: T3_LOGO("monsterpocalypse"),
  },
  {
    name: "BattleTech: Alpha Strike",
    slug: "battletech-alpha-strike",
    abbreviation: "BTAS",
    description:
      "Jeu de bataille de mechas militaires, version rapide du classique BattleTech.",
    logoUrl: null,
  },
  {
    name: "Classic BattleTech",
    slug: "classic-battletech",
    abbreviation: "CBT",
    description:
      "Le jeu de mecha militaire classique. Des BattleMechs s'affrontent dans des guerres futures complexes avec des règles détaillées.",
    logoUrl: T3_LOGO("classic-battletech"),
  },
  {
    name: "Dystopian Wars",
    slug: "dystopian-wars",
    abbreviation: "DWars",
    description:
      "Jeu de bataille naval/aérien steampunk-alternatif par Warcradle Studios. Des empires victoriens rétrofuturistes s'affrontent sur mer, terre et air.",
    logoUrl: T3_LOGO("dystopian-wars"),
  },
  {
    name: "Dystopian Legions",
    slug: "dystopian-legions",
    abbreviation: "DL",
    description:
      "Jeu d'infanterie dans l'univers Dystopian Wars, pour des batailles terrestres steampunk.",
    logoUrl: null,
  },
  {
    name: "Firestorm Armada",
    slug: "firestorm-armada",
    abbreviation: "FA",
    description:
      "Jeu de batailles spatiales par Spartan Games. Des flottes de vaisseaux futuristes s'affrontent dans l'espace.",
    logoUrl: T3_LOGO("firestorm-armada"),
  },
  {
    name: "Firestorm Planetfall",
    slug: "firestorm-planetfall",
    abbreviation: "FP",
    description:
      "Jeu de bataille terrestre sci-fi dans l'univers de Firestorm Armada.",
    logoUrl: null,
  },
  {
    name: "Warzone",
    slug: "warzone",
    abbreviation: "WZ",
    description:
      "Jeu de science-fiction dark par Prodos Games dans l'univers de Mutant Chronicles. Des corporations mégacorporatistes s'affrontent.",
    logoUrl: T3_LOGO("warzone"),
  },
  {
    name: "Mutant Chronicles Miniature Game",
    slug: "mutant-chronicles",
    abbreviation: "MCMG",
    description:
      "Jeu d'escarmouche dans l'univers Mutant Chronicles, entre corporations et forces du Mal.",
    logoUrl: null,
  },
  {
    name: "Runewars Miniatures Game",
    slug: "runewars",
    abbreviation: "RMG",
    description:
      "Jeu de bataille fantastique en rangs serrés par Fantasy Flight Games dans l'univers de Runebound.",
    logoUrl: T3_LOGO("runewars-miniatures-game"),
  },
  {
    name: "Halo: Flashpoint",
    slug: "halo-flashpoint",
    abbreviation: "HF",
    description:
      "Jeu d'escarmouche dans l'univers de Halo par Mantic Games. UNSC et Covenant s'affrontent en 32mm.",
    logoUrl: null,
  },
  {
    name: "World of Tanks Miniatures Game",
    slug: "world-of-tanks",
    abbreviation: "WoT",
    description:
      "Jeu de batailles de chars basé sur le jeu vidéo World of Tanks. Simple et accessible pour des parties rapides.",
    logoUrl: null,
  },
  {
    name: "Bot War",
    slug: "bot-war",
    abbreviation: "BW",
    description:
      "Jeu de robots géants dans un univers pulp retro-futuriste.",
    logoUrl: null,
  },
  {
    name: "Jovian Chronicles",
    slug: "jovian-chronicles",
    abbreviation: "JC",
    description:
      "Jeu de mecha dans l'univers du système solaire colonisé, par Dream Pod 9.",
    logoUrl: null,
  },
  {
    name: "Gear Krieg",
    slug: "gear-krieg",
    abbreviation: "GK",
    description:
      "Jeu de mechas et de guerre alternatif dans un univers WWII rétrofuturiste par Dream Pod 9.",
    logoUrl: null,
  },
  {
    name: "Tomorrow's War",
    slug: "tomorrows-war",
    abbreviation: "TW",
    description:
      "Règles d'escarmouche sci-fi moderne par Ambush Alley Games, pour des conflits futurs réalistes.",
    logoUrl: null,
  },
  {
    name: "Armoured Clash",
    slug: "armoured-clash",
    abbreviation: "AC",
    description:
      "Jeu de bataille blindée à grande échelle dans l'univers de Dystopian Wars.",
    logoUrl: null,
  },
  {
    name: "Warfleets: FTL",
    slug: "warfleets-ftl",
    abbreviation: "WFTL",
    description:
      "Jeu de batailles spatiales rapides et accessibles.",
    logoUrl: null,
  },
  {
    name: "A Call to Arms: Star Fleet",
    slug: "a-call-to-arms-star-fleet",
    abbreviation: "ACASF",
    description:
      "Jeu de batailles de flottes spatiales dans l'univers de Star Trek.",
    logoUrl: null,
  },
  {
    name: "Babylon 5",
    slug: "babylon-5",
    abbreviation: "B5",
    description:
      "Jeu de batailles spatiales dans l'univers de la série TV Babylon 5.",
    logoUrl: null,
  },
  {
    name: "Star Trek: Attack Wing",
    slug: "star-trek-attack-wing",
    abbreviation: "STAW",
    description:
      "Jeu de dogfighting de vaisseaux Star Trek utilisant le système FlightPath.",
    logoUrl: T3_LOGO("star-trek-attack-wing"),
  },
  {
    name: "Mars: Code Aurora",
    slug: "mars-code-aurora",
    abbreviation: "MCA",
    description:
      "Jeu d'escarmouche sci-fi futuriste sur Mars.",
    logoUrl: null,
  },
  {
    name: "ShadowSea",
    slug: "shadowsea",
    abbreviation: "ShSea",
    description:
      "Jeu d'escarmouche sous-marin dans un univers fantastique.",
    logoUrl: null,
  },
  {
    name: "DeepWars",
    slug: "deepwars",
    abbreviation: "Deep",
    description:
      "Jeu d'escarmouche sous-marin dans un univers lovecraftien.",
    logoUrl: null,
  },
  {
    name: "Human Interface Proxy War",
    slug: "human-interface-proxy-war",
    abbreviation: "HIPW",
    description:
      "Jeu d'escarmouche cyberpunk avec des proxies robotiques.",
    logoUrl: null,
  },
  {
    name: "MechWarrior: Dark Age",
    slug: "mechwarrior-dark-age",
    abbreviation: "MW",
    description:
      "Jeu de figurines collectibles de mechas dans l'univers BattleTech, à l'ère Dark Age.",
    logoUrl: null,
  },
  // ── Fantasy Skirmish ──────────────────────────────────────────
  {
    name: "Frostgrave",
    slug: "frostgrave",
    abbreviation: "FG",
    description:
      "Jeu d'escarmouche fantastique par Osprey Games. Des mages concurrents explorent la cité gelée de Frostgrave à la recherche de trésors magiques.",
    logoUrl: T3_LOGO("frostgrave"),
  },
  {
    name: "Moonstone",
    slug: "moonstone",
    abbreviation: "MS",
    description:
      "Jeu d'escarmouche féerique et whimsical. Des factions de créatures fantastiques s'affrontent dans un univers enchanteur.",
    logoUrl: T3_LOGO("moonstone"),
  },
  {
    name: "Conquest - The Last Argument of Kings",
    slug: "conquest-last-argument-of-kings",
    abbreviation: "CLAK",
    description:
      "Jeu de bataille fantastique massif par Para Bellum Wargames. Des armées imposantes s'affrontent dans un univers dark fantasy original.",
    logoUrl: T3_LOGO("conquest-the-last-argument-of-kings"),
  },
  {
    name: "Conquest: First Blood",
    slug: "conquest-first-blood",
    abbreviation: "CFB",
    description:
      "Version escarmouche de Conquest TLAOK pour des parties rapides avec de petites bandes.",
    logoUrl: null,
  },
  {
    name: "A Song of Ice & Fire",
    slug: "a-song-of-ice-and-fire",
    abbreviation: "ASoIF",
    description:
      "Jeu de bataille dans l'univers de Game of Thrones par CMON. Des grandes maisons de Westeros s'affrontent pour le Trône de Fer.",
    logoUrl: T3_LOGO("a-song-of-ice-fire"),
  },
  {
    name: "Wrath of Kings",
    slug: "wrath-of-kings",
    abbreviation: "WoK",
    description:
      "Jeu de bataille fantastique par CMON avec cinq royaumes uniques s'affrontant.",
    logoUrl: null,
  },
  {
    name: "Bushido",
    slug: "bushido",
    abbreviation: "BSO",
    description:
      "Jeu d'escarmouche dans le Japon médiéval fantastique par GCT Studios. Des clans et factions de créatures mythologiques s'affrontent.",
    logoUrl: T3_LOGO("bushido"),
  },
  {
    name: "Alkemy",
    slug: "alkemy",
    abbreviation: "Alk",
    description:
      "Jeu d'escarmouche fantastique français par Kraken Editions. Un univers original d'alchimie et de factions diverses.",
    logoUrl: T3_LOGO("alkemy"),
  },
  {
    name: "Briskars",
    slug: "briskars",
    abbreviation: "Brsk",
    description:
      "Jeu d'escarmouche dans un univers steampunk fantastique par Briskars Studio.",
    logoUrl: null,
  },
  {
    name: "Godtear",
    slug: "godtear",
    abbreviation: "GT",
    description:
      "Jeu d'escarmouche stratégique par Steamforged Games autour des larmes des dieux tombés.",
    logoUrl: null,
  },
  {
    name: "Drakerys",
    slug: "drakerys",
    abbreviation: "Drak",
    description:
      "Jeu de bataille fantastique français par Don't Panic Games, avec des dragons et créatures épiques.",
    logoUrl: null,
  },
  {
    name: "Ascending Fate",
    slug: "ascending-fate",
    abbreviation: "AF",
    description:
      "Jeu d'escarmouche fantastique avec un système de progression unique.",
    logoUrl: null,
  },
  {
    name: "Dark Age",
    slug: "dark-age",
    abbreviation: "DA",
    description:
      "Jeu d'escarmouche post-apocalyptique fantastique par CMON, sur une planète alien hostile.",
    logoUrl: null,
  },
  {
    name: "Pulp City",
    slug: "pulp-city",
    abbreviation: "PC",
    description:
      "Jeu d'escarmouche de super-héros et super-vilains dans un univers pulp.",
    logoUrl: null,
  },
  {
    name: "Super Fantasy Brawl",
    slug: "super-fantasy-brawl",
    abbreviation: "SFB",
    description:
      "Jeu d'arène fantastique rapide par Mythic Games.",
    logoUrl: null,
  },
  {
    name: "Mortem et Gloriam",
    slug: "mortem-et-gloriam",
    abbreviation: "MeG",
    description:
      "Jeu de bataille historique de l'Antiquité et du Moyen Âge, avec un système de commandement innovant.",
    logoUrl: null,
  },
  {
    name: "Mythic Battles: Pantheon",
    slug: "mythic-battles-pantheon",
    abbreviation: "MBP",
    description:
      "Jeu de bataille mythologique grecque par Monolith. Des dieux, héros et créatures de la mythologie s'affrontent.",
    logoUrl: T3_LOGO("mythic-battles-pantheon"),
  },
  {
    name: "Mortal Gods",
    slug: "mortal-gods",
    abbreviation: "MG",
    description:
      "Jeu d'escarmouche dans la Grèce antique, entre cités-états et créatures mythologiques.",
    logoUrl: null,
  },
  {
    name: "The Drowned Earth",
    slug: "the-drowned-earth",
    abbreviation: "TDE",
    description:
      "Jeu d'escarmouche dans un monde post-apocalyptique inondé, entre explorateurs et tribus.",
    logoUrl: null,
  },
  {
    name: "Godslayer",
    slug: "godslayer",
    abbreviation: "GS",
    description:
      "Jeu d'escarmouche dans un univers fantasy ancienne, entre peuples d'une époque mythologique.",
    logoUrl: null,
  },
  {
    name: "WarGods",
    slug: "wargods",
    abbreviation: "WG",
    description:
      "Jeu d'escarmouche dans l'Égypte mythologique et les civilisations antiques.",
    logoUrl: null,
  },
  {
    name: "Arcane Legions",
    slug: "arcane-legions",
    abbreviation: "AL",
    description:
      "Jeu de bataille de masse dans l'Antiquité avec des éléments fantastiques.",
    logoUrl: null,
  },
  {
    name: "Arena Rex",
    slug: "arena-rex",
    abbreviation: "AR",
    description:
      "Jeu d'arène dans la Rome antique fantastique par Red Republic Games.",
    logoUrl: null,
  },
  {
    name: "Rapture",
    slug: "rapture",
    abbreviation: "R",
    description:
      "Jeu d'escarmouche fantastique avec des mécaniques de cartes.",
    logoUrl: null,
  },
  {
    name: "Caeris",
    slug: "caeris",
    abbreviation: "Crs",
    description:
      "Jeu d'escarmouche fantastique de niche.",
    logoUrl: null,
  },
  {
    name: "Demonworld",
    slug: "demonworld",
    abbreviation: "DW",
    description:
      "Jeu de bataille fantastique en 15mm par RAL PARTHA Europe.",
    logoUrl: null,
  },
  {
    name: "Warlord",
    slug: "warlord",
    abbreviation: "WL",
    description:
      "Jeu de bataille fantastique par Reaper Miniatures.",
    logoUrl: null,
  },
  {
    name: "Chronopia",
    slug: "chronopia",
    abbreviation: "Chr",
    description:
      "Jeu d'escarmouche dark fantasy par Target Games, dans un univers primitif et brutal.",
    logoUrl: null,
  },
  {
    name: "Elves and Fantasy Warriors",
    slug: "fantasy-warriors",
    abbreviation: "FW",
    description:
      "Jeu de bataille fantastique ancien en rangs serrés.",
    logoUrl: null,
  },
  {
    name: "Celtos",
    slug: "celtos",
    abbreviation: "Celt",
    description:
      "Jeu d'escarmouche fantastique celtique par Brigade Models.",
    logoUrl: null,
  },
  {
    name: "Relic Knights",
    slug: "relic-knights",
    abbreviation: "RK",
    description:
      "Jeu d'escarmouche anime-styled sci-fantasy par Soda Pop Miniatures.",
    logoUrl: null,
  },
  {
    name: "Sol Braynïa",
    slug: "sol-braynia",
    abbreviation: "SB",
    description:
      "Jeu de bataille fantastique français.",
    logoUrl: null,
  },
  {
    name: "Le Retour des Dieux",
    slug: "le-retour-des-dieux",
    abbreviation: "RdR",
    description:
      "Jeu d'escarmouche fantastique français dans un univers mythologique original.",
    logoUrl: null,
  },
  {
    name: "Khârn-Âges",
    slug: "kharn-ages",
    abbreviation: "KA",
    description:
      "Jeu de bataille fantastique français.",
    logoUrl: null,
  },
  {
    name: "Mortebrume",
    slug: "mortebrume",
    abbreviation: "MB",
    description:
      "Jeu d'escarmouche fantastique français dans un univers de brumes mortelles.",
    logoUrl: null,
  },
  {
    name: "Âge des Escarmouches",
    slug: "age-des-escarmouches",
    abbreviation: "AdEs",
    description:
      "Jeu d'escarmouche fantastique français.",
    logoUrl: null,
  },
  {
    name: "Malediction",
    slug: "malediction",
    abbreviation: "MD",
    description:
      "Jeu d'escarmouche dark fantasy avec des mécaniques de malédictions.",
    logoUrl: null,
  },
  {
    name: "Bloodfields",
    slug: "bloodfields",
    abbreviation: "Bfs",
    description:
      "Jeu de bataille fantastique massif par Archon Studio.",
    logoUrl: null,
  },
  {
    name: "Goetterdaemmerung",
    slug: "goetterdaemmerung",
    abbreviation: "GD",
    description:
      "Jeu de bataille dans la mythologie nordique au crépuscule des dieux.",
    logoUrl: null,
  },
  {
    name: "Deathmatch",
    slug: "deathmatch",
    abbreviation: "DM",
    description:
      "Jeu d'arène de combat fantastique.",
    logoUrl: null,
  },
  {
    name: "Eldfall Chronicles",
    slug: "eldfall-chronicles",
    abbreviation: "EC",
    description:
      "Jeu d'escarmouche fantastique dans un univers original mêlant magie et technologie.",
    logoUrl: null,
  },
  {
    name: "Warthrone",
    slug: "warthrone",
    abbreviation: "WT",
    description:
      "Jeu de bataille fantastique en rangs serrés compatible avec les figurines Warhammer.",
    logoUrl: null,
  },
  {
    name: "Forbidden Psalm",
    slug: "forbidden-psalm",
    abbreviation: "FP2",
    description:
      "Jeu d'escarmouche grimdark-fantasy solo/coopératif inspiré des métaux extrêmes.",
    logoUrl: null,
  },
  {
    name: "Argatoria",
    slug: "argatoria",
    abbreviation: "Arga",
    description:
      "Jeu de bataille fantastique en rangs serrés par Wargames Support.",
    logoUrl: null,
  },
  {
    name: "A Fantastic Saga",
    slug: "a-fantastic-saga",
    abbreviation: "AFS",
    description:
      "Jeu de bataille fantastique rapide utilisant le système SAGA.",
    logoUrl: null,
  },
  {
    name: "The Exalted Ones",
    slug: "the-exalted-ones",
    abbreviation: "TEO",
    description:
      "Jeu d'escarmouche fantastique compétitif.",
    logoUrl: null,
  },
  {
    name: "Judgement",
    slug: "judgement",
    abbreviation: "JM",
    description:
      "Jeu d'arène fantastique australien avec des héros et créatures uniques.",
    logoUrl: null,
  },
  {
    name: "Skytear",
    slug: "skytear",
    abbreviation: "ST",
    description:
      "Jeu d'arène MOBA-style avec des figurines par PvP Geek.",
    logoUrl: null,
  },
  {
    name: "Nemesis",
    slug: "nemesis",
    abbreviation: "NEM",
    description:
      "Jeu de survival spatial coopératif/semi-coopératif par Awaken Realms, jouable en escarmouche PvP.",
    logoUrl: null,
  },
  {
    name: "Furie",
    slug: "furie",
    abbreviation: "Fur",
    description:
      "Jeu d'escarmouche fantastique français.",
    logoUrl: null,
  },
  {
    name: "Carnevale",
    slug: "carnevale",
    abbreviation: "CV",
    description:
      "Jeu d'escarmouche dans la Venise baroque et terrifiante par TTCombat. Des factions mystérieuses s'affrontent dans les canaux.",
    logoUrl: null,
  },
  // ── Historical ────────────────────────────────────────────────
  {
    name: "SAGA",
    slug: "saga",
    abbreviation: "SAGA",
    description:
      "Jeu d'escarmouche médiéval par Studio Tomahawk, de l'Antiquité tardive aux Croisades. Des warlords et leurs comitatus s'affrontent dans des batailles asymétriques.",
    logoUrl: T3_LOGO("saga"),
  },
  {
    name: "Flames of War: Great War",
    slug: "flames-of-war-great-war",
    abbreviation: "FoWGW",
    description:
      "Extension de Flames of War couvrant la Première Guerre mondiale.",
    logoUrl: null,
  },
  {
    name: "Hail Caesar",
    slug: "hail-caesar",
    abbreviation: "HC",
    description:
      "Jeu de bataille historique de l'Antiquité par Warlord Games. Des légions romaines, phalanges grecques et hordes barbares s'affrontent.",
    logoUrl: null,
  },
  {
    name: "L'Art de la Guerre",
    slug: "l-art-de-la-guerre",
    abbreviation: "AdlG",
    description:
      "Règles de wargame historique de l'Antiquité et du Moyen Âge, inspirées de Sun Tzu.",
    logoUrl: T3_LOGO("l-art-de-la-guerre"),
  },
  {
    name: "De Bellis Antiquitatis",
    slug: "de-bellis-antiquitatis",
    abbreviation: "DBA",
    description:
      "Jeu de bataille historique minimal (12 éléments) pour toutes les périodes de l'Antiquité et du Moyen Âge.",
    logoUrl: null,
  },
  {
    name: "De Bellis Multitudinis",
    slug: "de-bellis-multitudinis",
    abbreviation: "DBM",
    description:
      "Version à grande échelle de DBA, pour des armées plus importantes.",
    logoUrl: null,
  },
  {
    name: "De Bellis Magistrorum Militum",
    slug: "de-bellis-magistrorum-militum",
    abbreviation: "DBMM",
    description:
      "Successeur de DBM, avec des règles révisées par Phil Barker.",
    logoUrl: null,
  },
  {
    name: "Hordes of the Things",
    slug: "hordes-of-the-things",
    abbreviation: "HOTT",
    description:
      "Adaptation fantastique de DBA, simple et accessible pour créer des armées originales.",
    logoUrl: null,
  },
  {
    name: "Field of Glory",
    slug: "field-of-glory",
    abbreviation: "FoG",
    description:
      "Jeu de bataille historique de l'Antiquité et du Moyen Âge par Osprey Publishing.",
    logoUrl: T3_LOGO("field-of-glory"),
  },
  {
    name: "Field of Glory - Ancient and Medieval",
    slug: "field-of-glory-ancient-medieval",
    abbreviation: "FoG-A",
    description:
      "Déclinaison de Field of Glory pour les périodes Antique et Médiévale.",
    logoUrl: null,
  },
  {
    name: "Field of Glory - Renaissance",
    slug: "field-of-glory-renaissance",
    abbreviation: "FoG-R",
    description:
      "Déclinaison de Field of Glory pour la période de la Renaissance.",
    logoUrl: null,
  },
  {
    name: "Field of Glory - Napoleonic",
    slug: "field-of-glory-napoleonic",
    abbreviation: "FoG-N",
    description:
      "Déclinaison de Field of Glory pour les guerres napoléoniennes.",
    logoUrl: null,
  },
  {
    name: "Impetus",
    slug: "impetus",
    abbreviation: "Imp",
    description:
      "Jeu de bataille historique de l'Antiquité au XVIIe siècle par Dadi & Piombo.",
    logoUrl: null,
  },
  {
    name: "Blücher",
    slug: "blucher",
    abbreviation: "Blu",
    description:
      "Jeu de bataille napoléonienne à grande échelle par Sam Mustafa.",
    logoUrl: null,
  },
  {
    name: "Fire and Fury",
    slug: "fire-and-fury",
    abbreviation: "FaF",
    description:
      "Jeu de bataille de la Guerre de Sécession américaine, classique du wargame historique.",
    logoUrl: null,
  },
  {
    name: "Victory at Sea",
    slug: "victory-at-sea",
    abbreviation: "VaS",
    description:
      "Jeu de batailles navales WWII par Warlord Games, de l'Atlantique au Pacifique.",
    logoUrl: null,
  },
  {
    name: "Black Seas - The Age Of Sail",
    slug: "black-seas",
    abbreviation: "BSAS",
    description:
      "Jeu de batailles navales à voile de l'ère napoléonienne par Warlord Games.",
    logoUrl: null,
  },
  {
    name: "Blood & Plunder",
    slug: "blood-and-plunder",
    abbreviation: "BaP",
    description:
      "Jeu de pirates et de flibustiers des Caraïbes au XVIIe siècle par Firelock Games.",
    logoUrl: null,
  },
  {
    name: "Pirates of the Spanish Main",
    slug: "pirates-of-the-spanish-main",
    abbreviation: "PoSM",
    description:
      "Jeu de pirates avec des figurines collectibles dans les Caraïbes coloniales.",
    logoUrl: null,
  },
  {
    name: "Muskets & Tomahawks",
    slug: "muskets-and-tomahawks",
    abbreviation: "MaT",
    description:
      "Jeu d'escarmouche dans l'Amérique du Nord coloniale du XVIIIe siècle par Studio Tomahawk.",
    logoUrl: T3_LOGO("muskets-tomahawks"),
  },
  {
    name: "By Fire and Sword",
    slug: "by-fire-and-sword",
    abbreviation: "BFaS",
    description:
      "Jeu de bataille historique de l'Europe centrale du XVIIe siècle, entre Pologne, Suède et Cosaques.",
    logoUrl: null,
  },
  {
    name: "Test of Honour",
    slug: "test-of-honour",
    abbreviation: "ToH",
    description:
      "Jeu d'escarmouche dans le Japon féodal par Warlord Games. Des samouraïs et ashigaru s'affrontent pour l'honneur.",
    logoUrl: null,
  },
  {
    name: "Congo",
    slug: "congo",
    abbreviation: "Cg",
    description:
      "Jeu d'escarmouche en Afrique coloniale du XIXe siècle par Studio Tomahawk.",
    logoUrl: null,
  },
  {
    name: "Dracula's America",
    slug: "draculas-america",
    abbreviation: "DracA",
    description:
      "Jeu d'escarmouche dans un Far West fantastique où Dracula règne sur l'Amérique.",
    logoUrl: null,
  },
  {
    name: "Dead Man's Hand",
    slug: "dead-mans-hand",
    abbreviation: "DMH",
    description:
      "Jeu d'escarmouche Far West par Great Escape Games, avec des fusillades dans les rues poussiéreuses.",
    logoUrl: T3_LOGO("dead-man-s-hand"),
  },
  {
    name: "Legends of the Old West",
    slug: "legends-of-the-old-west",
    abbreviation: "LotOW",
    description:
      "Jeu d'escarmouche Far West de Games Workshop.",
    logoUrl: T3_LOGO("legends-of-the-old-west"),
  },
  {
    name: "Legends of the High Seas",
    slug: "legends-of-the-high-seas",
    abbreviation: "LotHS",
    description:
      "Jeu d'escarmouche de pirates des mers par Games Workshop.",
    logoUrl: null,
  },
  {
    name: "Warhammer Historical: WRG-6th",
    slug: "historical-wrg-6th",
    abbreviation: "WRG6",
    description:
      "Règles historiques anciennes WRG 6ème édition pour les batailles antiques.",
    logoUrl: null,
  },
  {
    name: "Tercios",
    slug: "tercios",
    abbreviation: "TC",
    description:
      "Jeu de bataille pour la période de la Renaissance et du XVIe siècle.",
    logoUrl: null,
  },
  {
    name: "Clash of Empires",
    slug: "clash-of-empires",
    abbreviation: "CoE",
    description:
      "Jeu de bataille historique de l'Antiquité par Great Escape Games.",
    logoUrl: null,
  },
  {
    name: "War in the Middle Ages",
    slug: "war-in-the-middle-ages",
    abbreviation: "WitMA",
    description:
      "Jeu de bataille médiéval pour les périodes de la Guerre de Cent Ans et au-delà.",
    logoUrl: null,
  },
  {
    name: "Time of Legends: Joan of Arc",
    slug: "time-of-legends-joan-of-arc",
    abbreviation: "TLJoA",
    description:
      "Jeu de plateau semi-coopératif dans la France médiévale fantastique.",
    logoUrl: null,
  },
  {
    name: "Frères d'Armes",
    slug: "freres-d-armes",
    abbreviation: "FdA",
    description:
      "Jeu de bataille médiéval français.",
    logoUrl: null,
  },
  {
    name: "Flintloque",
    slug: "flintloque",
    abbreviation: "FL",
    description:
      "Jeu d'escarmouche napoléonien fantastique avec des elfes, orcs et autres races.",
    logoUrl: null,
  },
  {
    name: "Schicksalspfade",
    slug: "schicksalspfade",
    abbreviation: "SP",
    description:
      "Jeu de rôle/escarmouche médiéval-fantastique allemand.",
    logoUrl: null,
  },
  {
    name: "Gangs of Rome",
    slug: "gangs-of-rome",
    abbreviation: "GoR",
    description:
      "Jeu d'escarmouche dans les ruelles de la Rome antique. Des gangs politiques s'affrontent pour le contrôle des quartiers.",
    logoUrl: null,
  },
  {
    name: "Gangs of Mega-City One",
    slug: "gangs-of-mega-city-one",
    abbreviation: "GoMCO",
    description:
      "Jeu d'escarmouche dans l'univers de Judge Dredd par Warlord Games.",
    logoUrl: null,
  },
  {
    name: "Ex Illis",
    slug: "ex-illis",
    abbreviation: "Exi",
    description:
      "Jeu de bataille médiéval fantastique avec composants numériques.",
    logoUrl: null,
  },
  {
    name: "NetEpic",
    slug: "netepic",
    abbreviation: "NetEp",
    description:
      "Version communautaire et gratuite d'Epic Space Marine (40k épique) maintenue par des fans.",
    logoUrl: null,
  },
  // ── Sport / Arène ─────────────────────────────────────────────
  {
    name: "Guild Ball",
    slug: "guild-ball",
    abbreviation: "GB",
    description:
      "Football médiéval fantastique par Steamforged Games. Des guildes professionnelles s'affrontent dans un sport violent et tactique.",
    logoUrl: T3_LOGO("guild-ball"),
  },
  {
    name: "Rumbleslam",
    slug: "rumbleslam",
    abbreviation: "RS",
    description:
      "Jeu de catch fantastique sur ring par TTCombat. Des créatures improbables s'affrontent dans des matchs de lutte délirants.",
    logoUrl: null,
  },
  // ── Jeux de Cartes / Hybrides ─────────────────────────────────
  {
    name: "Freebooter's Fate",
    slug: "freebooters-fate",
    abbreviation: "FF",
    description:
      "Jeu d'escarmouche de pirates fantastiques par Freebooter Miniatures. Utilise des cartes pour le combat.",
    logoUrl: T3_LOGO("freebooters-fate"),
  },
  {
    name: "Okko, Era of the Asagiri",
    slug: "okko",
    abbreviation: "Okko",
    description:
      "Jeu d'escarmouche dans le Japon fantastique d'Okko, chasseur de démons.",
    logoUrl: null,
  },
  {
    name: "Summoners",
    slug: "summoners",
    abbreviation: "Smr",
    description:
      "Jeu d'arène fantastique avec des mécaniques d'invocation de créatures.",
    logoUrl: null,
  },
  {
    name: "Wolsung SSG",
    slug: "wolsung-ssg",
    abbreviation: "WSSG",
    description:
      "Jeu d'escarmouche steampunk-fantastique dans un univers de clubs d'élite.",
    logoUrl: null,
  },
  {
    name: "World of Warcraft Miniatures Game",
    slug: "world-of-warcraft-miniatures",
    abbreviation: "WoWMG",
    description:
      "Jeu de figurines collectibles dans l'univers de World of Warcraft.",
    logoUrl: null,
  },
  {
    name: "D&D Attack Wing",
    slug: "dnd-attack-wing",
    abbreviation: "DnDAW",
    description:
      "Jeu de manœuvres aériennes de dragons dans l'univers de Donjons & Dragons.",
    logoUrl: null,
  },
  {
    name: "Street Fighter: The Miniatures Game",
    slug: "street-fighter-miniatures",
    abbreviation: "SF",
    description:
      "Jeu d'arène de combat dans l'univers de Street Fighter par Jasco Games.",
    logoUrl: null,
  },
  {
    name: "Masters of The Universe: Battleground",
    slug: "masters-of-the-universe-battleground",
    abbreviation: "MoTUB",
    description:
      "Jeu d'escarmouche dans l'univers de He-Man et les Maîtres de l'Univers.",
    logoUrl: null,
  },
  {
    name: "Riot Quest",
    slug: "riot-quest",
    abbreviation: "RQ",
    description:
      "Jeu d'arène compétitif et loufoque dans l'univers de Warmachine/Hordes par Privateer Press.",
    logoUrl: null,
  },
  {
    name: "Marvel Universe Miniature Game",
    slug: "marvel-universe-miniature-game",
    abbreviation: "MUMG",
    description:
      "Jeu d'escarmouche Marvel par Knight Models.",
    logoUrl: null,
  },
  {
    name: "Dockfighters",
    slug: "dockfighters",
    abbreviation: "DF",
    description:
      "Jeu d'escarmouche dans les docks d'un port fantastique.",
    logoUrl: null,
  },
  {
    name: "Armalion",
    slug: "armalion",
    abbreviation: "Armal",
    description:
      "Jeu d'escarmouche fantastique français.",
    logoUrl: null,
  },
  {
    name: "Rezolution",
    slug: "rezolution",
    abbreviation: "Rez",
    description:
      "Jeu d'escarmouche cyberpunk sci-fi.",
    logoUrl: null,
  },
  {
    name: "Olomoc",
    slug: "olomoc",
    abbreviation: "Olo",
    description:
      "Jeu d'escarmouche de niche.",
    logoUrl: null,
  },
  {
    name: "Metropolis",
    slug: "metropolis",
    abbreviation: "Metro",
    description:
      "Jeu d'escarmouche dans une ville futuriste.",
    logoUrl: null,
  },
  {
    name: "Fleet Commander",
    slug: "fleet-commander",
    abbreviation: "FC",
    description:
      "Jeu de batailles de flottes spatiales.",
    logoUrl: null,
  },
  {
    name: "Wings of Glory",
    slug: "wings-of-glory",
    abbreviation: "WoG",
    description:
      "Jeu de dogfighting aérien de la Première et Seconde Guerre mondiale avec des figurines pré-peintes.",
    logoUrl: T3_LOGO("wings-of-glory"),
  },
  {
    name: "Anima Tactics",
    slug: "anima-tactics",
    abbreviation: "Ani",
    description:
      "Jeu d'escarmouche anime-styled dans l'univers de Anima: Beyond Fantasy.",
    logoUrl: T3_LOGO("anima-tactics"),
  },
  {
    name: "Eden",
    slug: "eden",
    abbreviation: "Eden",
    description:
      "Jeu d'escarmouche post-apocalyptique par Happy Games Factory.",
    logoUrl: T3_LOGO("eden"),
  },
  {
    name: "Hell Dorado",
    slug: "hell-dorado",
    abbreviation: "HD",
    description:
      "Jeu d'escarmouche dans les enfers du Nouveau Monde colonial par Cipher Studios.",
    logoUrl: T3_LOGO("hell-dorado"),
  },
  {
    name: "Pulp Alley",
    slug: "pulp-alley",
    abbreviation: "PA",
    description:
      "Jeu d'escarmouche pulp aventure des années 30-40, entre espions, explorateurs et vilains.",
    logoUrl: null,
  },
  {
    name: "Warcanto",
    slug: "warcanto",
    abbreviation: "WARC",
    description:
      "Jeu d'escarmouche fantastique.",
    logoUrl: null,
  },
  {
    name: "Fearless",
    slug: "fearless",
    abbreviation: "Fls",
    description:
      "Jeu d'escarmouche historique moderne.",
    logoUrl: null,
  },
  {
    name: "Golgotha",
    slug: "golgotha",
    abbreviation: "Gol",
    description:
      "Jeu d'escarmouche dark fantasy dans un univers post-apocalyptique religieux.",
    logoUrl: null,
  },
  {
    name: "Armageddon",
    slug: "armageddon-magora",
    abbreviation: "Arma",
    description:
      "Jeu de bataille fantastique massif.",
    logoUrl: null,
  },
  {
    name: "Wild West Exodus",
    slug: "wild-west-exodus",
    abbreviation: "WWX",
    description:
      "Jeu d'escarmouche Far West sci-fi par Warcradle Studios. Cowboys et aliens dans un Ouest alternatif.",
    logoUrl: T3_LOGO("wild-west-exodus"),
  },
  {
    name: "Mars Attacks - The Miniatures Game",
    slug: "mars-attacks",
    abbreviation: "MA",
    description:
      "Jeu d'escarmouche satirique d'invasion martienne basé sur la franchise Mars Attacks.",
    logoUrl: null,
  },
  {
    name: "Fantasy Commander",
    slug: "fantasy-commander",
    abbreviation: "FaCom",
    description:
      "Jeu de bataille fantastique en rangs.",
    logoUrl: null,
  },
  {
    name: "Heroscape",
    slug: "heroscape",
    abbreviation: "HS",
    description:
      "Jeu de plateau d'escarmouche avec des tuiles hexagonales modulaires par Hasbro/Hasbro.",
    logoUrl: null,
  },
  {
    name: "Darklands",
    slug: "darklands",
    abbreviation: "DARK",
    description:
      "Jeu de bataille fantastique dans un Dark Age mythologique par Mierce Miniatures.",
    logoUrl: null,
  },
  {
    name: "Astrahys",
    slug: "astrahys",
    abbreviation: "AH",
    description:
      "Jeu d'escarmouche fantastique.",
    logoUrl: null,
  },
  {
    name: "Arena Deathmatch",
    slug: "arena-deathmatch",
    abbreviation: "AD",
    description:
      "Jeu d'arène compétitif de combat.",
    logoUrl: null,
  },
  {
    name: "Clan War",
    slug: "clan-war",
    abbreviation: "CW",
    description:
      "Jeu d'escarmouche dans l'univers de Legend of the Five Rings.",
    logoUrl: null,
  },
  {
    name: "Battlefield Evolution",
    slug: "battlefield-evolution",
    abbreviation: "BEvo",
    description:
      "Jeu de bataille militaire moderne par Mongoose Publishing.",
    logoUrl: null,
  },
  {
    name: "Blackwater Gulch",
    slug: "blackwater-gulch",
    abbreviation: "BGGOW",
    description:
      "Jeu d'escarmouche Far West avec des éléments surnaturels.",
    logoUrl: null,
  },
  {
    name: "Operation Squad: Evo",
    slug: "operation-squad-evo",
    abbreviation: "OSE",
    description:
      "Version évoluée d'Operation Squad pour des batailles WWII plus complexes.",
    logoUrl: null,
  },
  {
    name: "Conflict of Heroes",
    slug: "conflict-of-heroes",
    abbreviation: "CoH",
    description:
      "Jeu de wargame WWII tactique par Academy Games.",
    logoUrl: null,
  },
  {
    name: "Urban War",
    slug: "urban-war",
    abbreviation: "UW",
    description:
      "Jeu d'escarmouche sci-fi dans un univers de batailles urbaines futuristes.",
    logoUrl: T3_LOGO("urban-war"),
  },
  {
    name: "Confrontation 3/3.5",
    slug: "confrontation-3",
    abbreviation: "CO3",
    description:
      "Le classique jeu d'escarmouche dark fantasy français par Rackham, dans le monde de Rag'Narok.",
    logoUrl: T3_LOGO("confrontation-3-3.5"),
  },
  {
    name: "Confrontation: Age of Rag'Narok",
    slug: "confrontation-age-of-ragnarok",
    abbreviation: "Conf",
    description:
      "Version ultime de Confrontation avec de nouvelles mécaniques, dans l'ère du Rag'Narok.",
    logoUrl: null,
  },
  {
    name: "V for Victory",
    slug: "v-for-victory",
    abbreviation: "V",
    description:
      "Jeu de wargame WWII.",
    logoUrl: null,
  },
  {
    name: "Warcradle",
    slug: "warcradle",
    abbreviation: "Wcr",
    description: "Jeu de wargame alternatif par Warcradle Studios.",
    logoUrl: null,
  },
];

// ─────────────────────────────────────────────────────────────
// FACTIONS PAR JEU
// ─────────────────────────────────────────────────────────────

const factionsByGame: Record<
  string,
  Array<{ name: string; slug: string; group?: string }>
> = {
  "warhammer-40k": [
    // Imperium
    { name: "Space Marines", slug: "space-marines", group: "Imperium" },
    { name: "Blood Angels", slug: "blood-angels", group: "Imperium" },
    { name: "Dark Angels", slug: "dark-angels", group: "Imperium" },
    { name: "Space Wolves", slug: "space-wolves", group: "Imperium" },
    { name: "Deathwatch", slug: "deathwatch", group: "Imperium" },
    { name: "Grey Knights", slug: "grey-knights", group: "Imperium" },
    { name: "Adeptus Custodes", slug: "adeptus-custodes", group: "Imperium" },
    { name: "Adepta Sororitas", slug: "adepta-sororitas", group: "Imperium" },
    { name: "Adeptus Mechanicus", slug: "adeptus-mechanicus", group: "Imperium" },
    { name: "Astra Militarum", slug: "astra-militarum", group: "Imperium" },
    { name: "Imperial Knights", slug: "imperial-knights", group: "Imperium" },
    { name: "Imperial Agents", slug: "imperial-agents", group: "Imperium" },
    { name: "Leagues of Votann", slug: "leagues-of-votann", group: "Imperium" },
    // Chaos
    { name: "Chaos Space Marines", slug: "chaos-space-marines", group: "Chaos" },
    { name: "Death Guard", slug: "death-guard", group: "Chaos" },
    { name: "Thousand Sons", slug: "thousand-sons", group: "Chaos" },
    { name: "World Eaters", slug: "world-eaters", group: "Chaos" },
    { name: "Emperor's Children", slug: "emperors-children", group: "Chaos" },
    { name: "Chaos Daemons", slug: "chaos-daemons", group: "Chaos" },
    { name: "Chaos Knights", slug: "chaos-knights", group: "Chaos" },
    // Xenos
    { name: "Aeldari", slug: "aeldari", group: "Xenos" },
    { name: "Drukhari", slug: "drukhari", group: "Xenos" },
    { name: "Ynnari", slug: "ynnari", group: "Xenos" },
    { name: "Harlequins", slug: "harlequins", group: "Xenos" },
    { name: "T'au Empire", slug: "tau-empire", group: "Xenos" },
    { name: "Necrons", slug: "necrons", group: "Xenos" },
    { name: "Tyranids", slug: "tyranids", group: "Xenos" },
    { name: "Genestealer Cults", slug: "genestealer-cults", group: "Xenos" },
    { name: "Orks", slug: "orks", group: "Xenos" },
  ],

  "age-of-sigmar": [
    // Grand Alliance Order
    { name: "Stormcast Eternals", slug: "stormcast-eternals", group: "Grand Alliance Order" },
    { name: "Cities of Sigmar", slug: "cities-of-sigmar", group: "Grand Alliance Order" },
    { name: "Daughters of Khaine", slug: "daughters-of-khaine", group: "Grand Alliance Order" },
    { name: "Fyreslayers", slug: "fyreslayers", group: "Grand Alliance Order" },
    { name: "Idoneth Deepkin", slug: "idoneth-deepkin", group: "Grand Alliance Order" },
    { name: "Kharadron Overlords", slug: "kharadron-overlords", group: "Grand Alliance Order" },
    { name: "Lumineth Realm-Lords", slug: "lumineth-realm-lords", group: "Grand Alliance Order" },
    { name: "Seraphon", slug: "seraphon", group: "Grand Alliance Order" },
    { name: "Sylvaneth", slug: "sylvaneth", group: "Grand Alliance Order" },
    // Grand Alliance Chaos
    { name: "Blades of Khorne", slug: "blades-of-khorne", group: "Grand Alliance Chaos" },
    { name: "Disciples of Tzeentch", slug: "disciples-of-tzeentch", group: "Grand Alliance Chaos" },
    { name: "Hedonites of Slaanesh", slug: "hedonites-of-slaanesh", group: "Grand Alliance Chaos" },
    { name: "Maggotkin of Nurgle", slug: "maggotkin-of-nurgle", group: "Grand Alliance Chaos" },
    { name: "Slaves to Darkness", slug: "slaves-to-darkness", group: "Grand Alliance Chaos" },
    { name: "Beasts of Chaos", slug: "beasts-of-chaos", group: "Grand Alliance Chaos" },
    { name: "Skaven", slug: "skaven", group: "Grand Alliance Chaos" },
    { name: "Tamurkhan's Horde", slug: "tamurkhans-horde", group: "Grand Alliance Chaos" },
    { name: "Legion of Azgorh", slug: "legion-of-azgorh", group: "Grand Alliance Chaos" },
    // Grand Alliance Death
    { name: "Nighthaunt", slug: "nighthaunt", group: "Grand Alliance Death" },
    { name: "Ossiarch Bonereapers", slug: "ossiarch-bonereapers", group: "Grand Alliance Death" },
    { name: "Soulblight Gravelords", slug: "soulblight-gravelords", group: "Grand Alliance Death" },
    { name: "Flesh-eater Courts", slug: "flesh-eater-courts", group: "Grand Alliance Death" },
    { name: "Legions of Nagash", slug: "legions-of-nagash", group: "Grand Alliance Death" },
    // Grand Alliance Destruction
    { name: "Orruk Warclans", slug: "orruk-warclans", group: "Grand Alliance Destruction" },
    { name: "Gloomspite Gitz", slug: "gloomspite-gitz", group: "Grand Alliance Destruction" },
    { name: "Ogor Mawtribes", slug: "ogor-mawtribes", group: "Grand Alliance Destruction" },
    { name: "Sons of Behemat", slug: "sons-of-behemat", group: "Grand Alliance Destruction" },
  ],

  "warhammer-fantasy-battles": [
    { name: "Beastmen", slug: "beastmen" },
    { name: "Bretonnia", slug: "bretonnia" },
    { name: "Chaos Dwarfs", slug: "chaos-dwarfs" },
    { name: "Chaos Warriors", slug: "chaos-warriors" },
    { name: "Daemons of Chaos", slug: "daemons-of-chaos" },
    { name: "Dark Elves", slug: "dark-elves" },
    { name: "Dogs of War", slug: "dogs-of-war" },
    { name: "Dwarfs", slug: "dwarfs" },
    { name: "Empire", slug: "empire" },
    { name: "High Elves", slug: "high-elves" },
    { name: "Lizardmen", slug: "lizardmen" },
    { name: "Ogre Kingdoms", slug: "ogre-kingdoms" },
    { name: "Orcs & Goblins", slug: "orcs-and-goblins" },
    { name: "Skaven", slug: "skaven" },
    { name: "Tomb Kings", slug: "tomb-kings" },
    { name: "Vampire Counts", slug: "vampire-counts" },
    { name: "Wood Elves", slug: "wood-elves" },
    { name: "Hobgoblin Tribes", slug: "hobgoblin-tribes" },
    { name: "Great Hosts of Chaos", slug: "great-hosts-of-chaos" },
  ],

  "the-old-world": [
    { name: "Empire of Man", slug: "empire-of-man", group: "Order" },
    { name: "Kingdom of Bretonnia", slug: "kingdom-of-bretonnia", group: "Order" },
    { name: "Dwarfen Mountain Holds", slug: "dwarfen-mountain-holds", group: "Order" },
    { name: "High Elf Realms", slug: "high-elf-realms", group: "Order" },
    { name: "Wood Elf Realms", slug: "wood-elf-realms", group: "Order" },
    { name: "Tomb Kings of Khemri", slug: "tomb-kings-of-khemri", group: "Death" },
    { name: "Vampire Counts", slug: "vampire-counts", group: "Death" },
    { name: "Warriors of Chaos", slug: "warriors-of-chaos", group: "Chaos" },
    { name: "Daemons of Chaos", slug: "daemons-of-chaos", group: "Chaos" },
    { name: "Beastmen", slug: "beastmen", group: "Chaos" },
    { name: "Chaos Dwarfs", slug: "chaos-dwarfs", group: "Chaos" },
    { name: "Orc & Goblin Tribes", slug: "orc-goblin-tribes", group: "Destruction" },
    { name: "Dark Elf Raiders", slug: "dark-elf-raiders", group: "Destruction" },
    { name: "Skaven Clans", slug: "skaven-clans", group: "Destruction" },
    { name: "Ogre Kingdoms", slug: "ogre-kingdoms", group: "Destruction" },
    { name: "Lizardmen", slug: "lizardmen", group: "Order" },
  ],

  "blood-bowl": [
    { name: "Amazons", slug: "amazons" },
    { name: "Black Orcs", slug: "black-orcs" },
    { name: "Chaos", slug: "chaos" },
    { name: "Chaos Dwarfs", slug: "chaos-dwarfs" },
    { name: "Chaos Pact", slug: "chaos-pact" },
    { name: "Dark Elves", slug: "dark-elves" },
    { name: "Dwarves", slug: "dwarves" },
    { name: "Elves (Pro)", slug: "elves-pro" },
    { name: "Goblins", slug: "goblins" },
    { name: "Halflings", slug: "halflings" },
    { name: "High Elves", slug: "high-elves" },
    { name: "Humans", slug: "humans" },
    { name: "Imperial Nobility", slug: "imperial-nobility" },
    { name: "Khemri", slug: "khemri" },
    { name: "Lizardmen", slug: "lizardmen" },
    { name: "Necromancers", slug: "necromancers" },
    { name: "Necromantic Horror", slug: "necromantic-horror" },
    { name: "Norse", slug: "norse" },
    { name: "Nurgle's Rotters", slug: "nurgles-rotters" },
    { name: "Ogres", slug: "ogres" },
    { name: "Orcs", slug: "orcs" },
    { name: "Skaven", slug: "skaven" },
    { name: "Slann", slug: "slann" },
    { name: "Snotlings", slug: "snotlings" },
    { name: "Undead", slug: "undead" },
    { name: "Underworld Denizens", slug: "underworld-denizens" },
    { name: "Vampires", slug: "vampires" },
    { name: "Wood Elves", slug: "wood-elves" },
  ],

  infinity: [
    { name: "PanOceania", slug: "panoceania", group: "Human Sphere" },
    { name: "Yu Jing", slug: "yu-jing", group: "Human Sphere" },
    { name: "Ariadna", slug: "ariadna", group: "Human Sphere" },
    { name: "Haqqislam", slug: "haqqislam", group: "Human Sphere" },
    { name: "Nomads", slug: "nomads", group: "Human Sphere" },
    { name: "ALEPH", slug: "aleph", group: "Human Sphere" },
    { name: "Tohaa", slug: "tohaa", group: "Human Sphere" },
    { name: "O-12", slug: "o-12", group: "Human Sphere" },
    { name: "Japanese Secessionist Army", slug: "japanese-secessionist-army", group: "Sectorial" },
    { name: "Military Orders", slug: "military-orders", group: "Sectorial" },
    { name: "NA2", slug: "na2", group: "Non-Aligned Armies" },
    { name: "Combined Army", slug: "combined-army", group: "EI" },
  ],

  "kings-of-war": [
    { name: "Abyssal Dwarfs", slug: "abyssal-dwarfs", group: "Forces of Evil" },
    { name: "Basileans", slug: "basileans", group: "Forces of Good" },
    { name: "Dwarfs", slug: "dwarfs", group: "Forces of Good" },
    { name: "Elves", slug: "elves", group: "Forces of Good" },
    { name: "Empire of Dust", slug: "empire-of-dust", group: "Forces of Evil" },
    { name: "Forces of Nature", slug: "forces-of-nature", group: "Forces of Good" },
    { name: "Forces of the Abyss", slug: "forces-of-the-abyss", group: "Forces of Evil" },
    { name: "Free Dwarfs", slug: "free-dwarfs", group: "Forces of Good" },
    { name: "Goblins", slug: "goblins", group: "Forces of Evil" },
    { name: "Halflings", slug: "halflings", group: "Forces of Good" },
    { name: "Kingdoms of Men", slug: "kingdoms-of-men", group: "Forces of Good" },
    { name: "League of Rhordia", slug: "league-of-rhordia", group: "Forces of Good" },
    { name: "Nightstalkers", slug: "nightstalkers", group: "Forces of Evil" },
    { name: "Northern Alliance", slug: "northern-alliance", group: "Forces of Good" },
    { name: "Ogres", slug: "ogres", group: "Forces of Good" },
    { name: "Orcs", slug: "orcs", group: "Forces of Evil" },
    { name: "Order of the Brothermark", slug: "order-of-the-brothermark", group: "Forces of Good" },
    { name: "Order of the Green Lady", slug: "order-of-the-green-lady", group: "Forces of Good" },
    { name: "Ratkin", slug: "ratkin", group: "Forces of Evil" },
    { name: "Riftforged Orcs", slug: "riftforged-orcs", group: "Forces of Evil" },
    { name: "Salamanders", slug: "salamanders", group: "Forces of Good" },
    { name: "Sylvan Kin", slug: "sylvan-kin", group: "Forces of Good" },
    { name: "The Herd", slug: "the-herd", group: "Forces of Nature" },
    { name: "Trident Realms of Neritica", slug: "trident-realms", group: "Forces of Good" },
    { name: "Twilight Kin", slug: "twilight-kin", group: "Forces of Evil" },
    { name: "Undead", slug: "undead", group: "Forces of Evil" },
    { name: "Varangur", slug: "varangur", group: "Forces of Evil" },
    { name: "Gladewalker Druids", slug: "gladewalker-druids", group: "Forces of Nature" },
  ],

  "star-wars-legion": [
    { name: "Galactic Republic", slug: "galactic-republic", group: "Light Side" },
    { name: "Rebel Alliance", slug: "rebel-alliance", group: "Light Side" },
    { name: "Separatist Alliance", slug: "separatist-alliance", group: "Dark Side" },
    { name: "Galactic Empire", slug: "galactic-empire", group: "Dark Side" },
    { name: "Mercenaries", slug: "mercenaries", group: "Neutral" },
  ],

  "star-wars-xwing": [
    { name: "Rebel Alliance", slug: "rebel-alliance", group: "Light Side" },
    { name: "Galactic Empire", slug: "galactic-empire", group: "Dark Side" },
    { name: "Scum and Villainy", slug: "scum-and-villainy", group: "Neutral" },
    { name: "Resistance", slug: "resistance", group: "Light Side" },
    { name: "First Order", slug: "first-order", group: "Dark Side" },
    { name: "Separatist Alliance", slug: "separatist-alliance", group: "Dark Side" },
    { name: "Galactic Republic", slug: "galactic-republic", group: "Light Side" },
  ],

  "marvel-crisis-protocol": [
    { name: "Avengers", slug: "avengers", group: "Heroes" },
    { name: "X-Men", slug: "x-men", group: "Heroes" },
    { name: "Guardians of the Galaxy", slug: "guardians-of-the-galaxy", group: "Heroes" },
    { name: "Spider-Verse", slug: "spider-verse", group: "Heroes" },
    { name: "Cabal", slug: "cabal", group: "Villains" },
    { name: "Hydra", slug: "hydra", group: "Villains" },
    { name: "Asgard", slug: "asgard", group: "Mixed" },
    { name: "Inhumans", slug: "inhumans", group: "Mixed" },
    { name: "Wakanda", slug: "wakanda", group: "Heroes" },
    { name: "Web Warriors", slug: "web-warriors", group: "Heroes" },
    { name: "Brotherhood of Mutants", slug: "brotherhood-of-mutants", group: "Villains" },
    { name: "S.H.I.E.L.D.", slug: "shield", group: "Heroes" },
  ],

  "a-song-of-ice-and-fire": [
    { name: "House Stark", slug: "house-stark", group: "The North" },
    { name: "House Lannister", slug: "house-lannister", group: "The Westerlands" },
    { name: "House Baratheon", slug: "house-baratheon", group: "The Stormlands" },
    { name: "House Targaryen", slug: "house-targaryen", group: "Exiles" },
    { name: "Night's Watch", slug: "nights-watch", group: "The Wall" },
    { name: "Free Folk", slug: "free-folk", group: "Beyond the Wall" },
    { name: "House Greyjoy", slug: "house-greyjoy", group: "The Iron Islands" },
    { name: "House Martell", slug: "house-martell", group: "Dorne" },
    { name: "Neutral", slug: "neutral", group: "Neutral" },
  ],

  "conquest-last-argument-of-kings": [
    { name: "Hundred Kingdoms", slug: "hundred-kingdoms", group: "Nords" },
    { name: "Nords", slug: "nords", group: "Nords" },
    { name: "Spires", slug: "spires", group: "Spires" },
    { name: "Dweghom", slug: "dweghom", group: "Dweghom" },
    { name: "Old Dominion", slug: "old-dominion", group: "Old Dominion" },
    { name: "W'adrhŭn", slug: "wadhrun", group: "W'adrhŭn" },
    { name: "City States", slug: "city-states", group: "City States" },
    { name: "Sorcerer Kings", slug: "sorcerer-kings", group: "Sorcerer Kings" },
  ],

  "middle-earth-sbg": [
    { name: "The Fellowship", slug: "the-fellowship", group: "Good" },
    { name: "Rohan", slug: "rohan", group: "Good" },
    { name: "Gondor", slug: "gondor", group: "Good" },
    { name: "Rivendell", slug: "rivendell", group: "Good" },
    { name: "Lothlórien", slug: "lothlorien", group: "Good" },
    { name: "Khazad-dûm", slug: "khazad-dum", group: "Good" },
    { name: "The Shire", slug: "the-shire", group: "Good" },
    { name: "Mordor", slug: "mordor", group: "Evil" },
    { name: "Isengard", slug: "isengard", group: "Evil" },
    { name: "Angmar", slug: "angmar", group: "Evil" },
    { name: "Easterlings", slug: "easterlings", group: "Evil" },
    { name: "Harad", slug: "harad", group: "Evil" },
    { name: "Moria", slug: "moria", group: "Evil" },
    { name: "Far Harad", slug: "far-harad", group: "Evil" },
  ],

  malifaux: [
    { name: "Guild", slug: "guild" },
    { name: "Resurrectionist", slug: "resurrectionist" },
    { name: "Arcanist", slug: "arcanist" },
    { name: "Neverborn", slug: "neverborn" },
    { name: "Outcast", slug: "outcast" },
    { name: "Gremlins", slug: "gremlins" },
    { name: "Ten Thunders", slug: "ten-thunders" },
    { name: "Explorer's Society", slug: "explorers-society" },
  ],
};

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  // Clear data in FK-safe order
  await prisma.match.deleteMany();
  await prisma.round.deleteMany();
  await prisma.tournamentPlayer.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.faction.deleteMany();
  await prisma.game.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleared existing data");

  // ── Users ────────────────────────────────────────────────────
  const demo = await prisma.user.create({
    data: {
      email: "demo@example.com",
      keycloakId: "demo-user-id",
      name: "Demo Player",
      role: "PLAYER",
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: "organizer@example.com",
      keycloakId: "organizer-user-id",
      name: "Tournament Organizer",
      role: "ORGANIZER",
    },
  });

  console.log(`✅ Created users: ${demo.email}, ${organizer.email}`);

  // ── Games ────────────────────────────────────────────────────
  // Deduplicate on slug (safety net)
  const uniqueGames = games.filter(
    (g, i, arr) => arr.findIndex((x) => x.slug === g.slug) === i
  );

  for (const gameData of uniqueGames) {
    await prisma.game.create({ data: gameData });
  }

  console.log(`✅ Created ${uniqueGames.length} games`);

  // ── Factions ─────────────────────────────────────────────────
  let factionCount = 0;
  for (const [gameSlug, factions] of Object.entries(factionsByGame)) {
    const game = await prisma.game.findUnique({ where: { slug: gameSlug } });
    if (!game) {
      console.warn(`⚠️  Game not found for factions: ${gameSlug}`);
      continue;
    }
    for (const f of factions) {
      await prisma.faction.create({
        data: { ...f, gameId: game.id },
      });
      factionCount++;
    }
  }

  console.log(`✅ Created ${factionCount} factions`);

  // ── Test tournaments ─────────────────────────────────────────
  const w40k = await prisma.game.findUnique({ where: { slug: "warhammer-40k" } });
  const aos = await prisma.game.findUnique({ where: { slug: "age-of-sigmar" } });
  const kow = await prisma.game.findUnique({ where: { slug: "kings-of-war" } });

  if (w40k && aos && kow) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    await prisma.tournament.create({
      data: {
        name: "Grand Tournoi W40K - Paris Open",
        slug: "grand-tournoi-w40k-paris-open",
        description:
          "Le plus grand tournoi Warhammer 40,000 de la région parisienne. Format matched play 2000 points, 5 rondes suisses.",
        date: tomorrow,
        location: "Paris, Espace Champerret",
        maxPlayers: 32,
        status: "OPEN",
        format: "SWISS",
        pointsLimit: 2000,
        gameId: w40k.id,
        organizerId: organizer.id,
      },
    });

    await prisma.tournament.create({
      data: {
        name: "Age of Sigmar - Clash des Royaumes",
        slug: "age-of-sigmar-clash-des-royaumes",
        description:
          "Tournoi Age of Sigmar compétitif en format Pitched Battle. 2000 points, règles matched play saison en cours.",
        date: tomorrow,
        location: "Lyon, Salle des Fêtes de Vaise",
        maxPlayers: 24,
        status: "OPEN",
        format: "SWISS",
        pointsLimit: 2000,
        gameId: aos.id,
        organizerId: organizer.id,
      },
    });

    await prisma.tournament.create({
      data: {
        name: "Kings of War - La Bataille des Glaces",
        slug: "kings-of-war-bataille-des-glaces",
        description:
          "Tournoi Kings of War 3ème édition. 2300 points, 4 rondes, scénarios officiels.",
        date: nextWeek,
        location: "Bordeaux, Association Les Guerriers du Médoc",
        maxPlayers: 16,
        status: "OPEN",
        format: "SWISS",
        pointsLimit: 2300,
        gameId: kow.id,
        organizerId: organizer.id,
      },
    });

    await prisma.tournament.create({
      data: {
        name: "Mega-Tournoi W40K - Convention Wargame Nantes",
        slug: "mega-tournoi-w40k-convention-nantes",
        description:
          "Tournoi 40k intégré à la convention Wargame de Nantes. 3 rondes, format accessible pour nouveaux joueurs.",
        date: nextMonth,
        location: "Nantes, Parc des Expositions",
        maxPlayers: 64,
        status: "OPEN",
        format: "SWISS",
        pointsLimit: 1500,
        gameId: w40k.id,
        organizerId: organizer.id,
      },
    });

    // ── Tournoi terminé avec stats ────────────────────────────────
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);

    const completedTournament = await prisma.tournament.create({
      data: {
        name: "Paris W40K Open — Hiver 2026",
        slug: "paris-w40k-open-hiver-2026",
        description: "Tournoi Warhammer 40K hivernal — 3 rondes suisses, 2000 pts. Résultats archivés.",
        date: lastMonth,
        location: "Paris, Espace Champerret",
        maxPlayers: 8,
        status: "COMPLETED",
        format: "SWISS",
        pointsLimit: 2000,
        gameId: w40k.id,
        organizerId: organizer.id,
      },
    });

    // Joueurs de test
    const testPlayers = await Promise.all([
      prisma.user.upsert({ where: { email: "joueur1@test.com" }, update: {}, create: { keycloakId: "test-k-1", email: "joueur1@test.com", name: "Jean Dupont", role: "PLAYER" } }),
      prisma.user.upsert({ where: { email: "joueur2@test.com" }, update: {}, create: { keycloakId: "test-k-2", email: "joueur2@test.com", name: "Marie Martin", role: "PLAYER" } }),
      prisma.user.upsert({ where: { email: "joueur3@test.com" }, update: {}, create: { keycloakId: "test-k-3", email: "joueur3@test.com", name: "Pierre Bernard", role: "PLAYER" } }),
      prisma.user.upsert({ where: { email: "joueur4@test.com" }, update: {}, create: { keycloakId: "test-k-4", email: "joueur4@test.com", name: "Sophie Leroy", role: "PLAYER" } }),
      prisma.user.upsert({ where: { email: "joueur5@test.com" }, update: {}, create: { keycloakId: "test-k-5", email: "joueur5@test.com", name: "Lucas Moreau", role: "PLAYER" } }),
      prisma.user.upsert({ where: { email: "joueur6@test.com" }, update: {}, create: { keycloakId: "test-k-6", email: "joueur6@test.com", name: "Emma Petit", role: "PLAYER" } }),
      prisma.user.upsert({ where: { email: "joueur7@test.com" }, update: {}, create: { keycloakId: "test-k-7", email: "joueur7@test.com", name: "Thomas Roux", role: "PLAYER" } }),
      prisma.user.upsert({ where: { email: "joueur8@test.com" }, update: {}, create: { keycloakId: "test-k-8", email: "joueur8@test.com", name: "Camille Girard", role: "PLAYER" } }),
    ]);

    // Factions W40K
    const factionSlugs = ["space-marines", "necrons", "aeldari", "chaos-space-marines", "death-guard", "orks", "tau-empire", "tyranids"];
    const factions40k = await Promise.all(
      factionSlugs.map((slug) => prisma.faction.findFirst({ where: { slug, gameId: w40k.id } }))
    );

    // Stats finales prévues : SM 3W, Necrons 2W1D, Aeldari 1W1D1L, CSM 2W1L, DG 2W1L, Orks 1W2L, Tau 1W2L, Tyranids 0W3L
    const statsMap: Record<string, { wins: number; losses: number; draws: number; points: number }> = {
      "space-marines":       { wins: 3, losses: 0, draws: 0, points: 9 },
      "necrons":             { wins: 2, losses: 0, draws: 1, points: 7 },
      "aeldari":             { wins: 1, losses: 1, draws: 1, points: 4 },
      "chaos-space-marines": { wins: 2, losses: 1, draws: 0, points: 6 },
      "death-guard":         { wins: 2, losses: 1, draws: 0, points: 6 },
      "orks":                { wins: 1, losses: 2, draws: 0, points: 3 },
      "tau-empire":          { wins: 1, losses: 2, draws: 0, points: 3 },
      "tyranids":            { wins: 0, losses: 3, draws: 0, points: 0 },
    };

    const registrations = await Promise.all(
      testPlayers.map((player, i) => {
        const slug = factionSlugs[i];
        const faction = factions40k[i];
        const stats = statsMap[slug!] ?? { wins: 0, losses: 0, draws: 0, points: 0 };
        return prisma.tournamentPlayer.create({
          data: {
            tournamentId: completedTournament.id,
            userId: player.id,
            factionId: faction?.id ?? null,
            wins: stats.wins,
            losses: stats.losses,
            draws: stats.draws,
            points: stats.points,
          },
        });
      })
    );

    // Rondes et matchs (3 rondes × 4 matchs)
    const [p0, p1, p2, p3, p4, p5, p6, p7] = registrations; // SM, Necr, Eld, CSM, DG, Orks, Tau, Tyra

    const round1 = await prisma.round.create({ data: { tournamentId: completedTournament.id, number: 1, status: "COMPLETED" } });
    await Promise.all([
      prisma.match.create({ data: { roundId: round1.id, player1Id: p0.id, player2Id: p7.id, player1Score: 80, player2Score: 20, winnerId: p0.id, status: "COMPLETED" } }), // SM bat Tyra
      prisma.match.create({ data: { roundId: round1.id, player1Id: p1.id, player2Id: p5.id, player1Score: 70, player2Score: 40, winnerId: p1.id, status: "COMPLETED" } }), // Necr bat Orks
      prisma.match.create({ data: { roundId: round1.id, player1Id: p3.id, player2Id: p6.id, player1Score: 60, player2Score: 50, winnerId: p3.id, status: "COMPLETED" } }), // CSM bat Tau
      prisma.match.create({ data: { roundId: round1.id, player1Id: p4.id, player2Id: p2.id, player1Score: 55, player2Score: 55, winnerId: null,   status: "COMPLETED" } }), // DG = Eld (nul)
    ]);

    const round2 = await prisma.round.create({ data: { tournamentId: completedTournament.id, number: 2, status: "COMPLETED" } });
    await Promise.all([
      prisma.match.create({ data: { roundId: round2.id, player1Id: p0.id, player2Id: p3.id, player1Score: 75, player2Score: 35, winnerId: p0.id, status: "COMPLETED" } }), // SM bat CSM
      prisma.match.create({ data: { roundId: round2.id, player1Id: p1.id, player2Id: p2.id, player1Score: 60, player2Score: 60, winnerId: null,   status: "COMPLETED" } }), // Necr = Eld (nul)
      prisma.match.create({ data: { roundId: round2.id, player1Id: p4.id, player2Id: p6.id, player1Score: 65, player2Score: 45, winnerId: p4.id, status: "COMPLETED" } }), // DG bat Tau
      prisma.match.create({ data: { roundId: round2.id, player1Id: p7.id, player2Id: p5.id, player1Score: 30, player2Score: 60, winnerId: p5.id, status: "COMPLETED" } }), // Orks bat Tyra
    ]);

    const round3 = await prisma.round.create({ data: { tournamentId: completedTournament.id, number: 3, status: "COMPLETED" } });
    await Promise.all([
      prisma.match.create({ data: { roundId: round3.id, player1Id: p0.id, player2Id: p1.id, player1Score: 80, player2Score: 50, winnerId: p0.id, status: "COMPLETED" } }), // SM bat Necr
      prisma.match.create({ data: { roundId: round3.id, player1Id: p4.id, player2Id: p3.id, player1Score: 70, player2Score: 40, winnerId: p4.id, status: "COMPLETED" } }), // DG bat CSM
      prisma.match.create({ data: { roundId: round3.id, player1Id: p2.id, player2Id: p6.id, player1Score: 65, player2Score: 50, winnerId: p2.id, status: "COMPLETED" } }), // Eld bat Tau
      prisma.match.create({ data: { roundId: round3.id, player1Id: p5.id, player2Id: p7.id, player1Score: 55, player2Score: 25, winnerId: p5.id, status: "COMPLETED" } }), // Orks bat Tyra
    ]);

    console.log("✅ Created 5 test tournaments (incl. 1 completed with match results)");
  }

  console.log("🎉 Database seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
