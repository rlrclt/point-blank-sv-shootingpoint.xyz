#!/usr/bin/env node
/**
 * Extract a browsable item catalog from pbrecon/asset-map.json.
 *
 * Usage:
 *   node site/build-items.mjs
 *   node site/build-items.mjs <repo-root>
 *
 * Writes site/data/items.json and site/data/items.js (window.PB_INDEX).
 * The web app loads items.js directly, so it also works from file://.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, ".."));
const MAP_FILE = path.join(ROOT, "pbrecon", "asset-map.json");
const OUT_DIR = path.join(ROOT, "site", "data");

const raw = JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
const dirs = raw.dirs ?? {};

/* ------------------------------------------------------------------ */
/* naming                                                              */
/* ------------------------------------------------------------------ */

const DISPLAY = {
  // rifles / carbines
  ak: "AK", ak47: "AK-47", aug: "AUG", oa: "OA", sc: "SC", as: "AS",
  as_val: "AS-Val", bora: "BORA", mts: "MTS", gh5007: "GH5007",
  k413: "K413", k479: "K479", sig: "SIG", vz52: "VZ52", honey: "Honey",
  taclite: "Taclite", rngmaster: "RNG Master", sc2010: "SC-2010",
  hk: "HK", christmas2016: "Christmas 2016", deadlyhydra: "Deadly Hydra",
  mercury: "Mercury", viking: "Viking", mars: "Mars",
  snow: "Snow", snowball: "Snowball", tornado: "Tornado",
  zombie: "Zombie", cerberus: "Cerberus",
  t77: "T77", pindad: "Pindad", msbs: "MSBS", famas: "FAMAS",
  m4a1: "M4A1", m4: "M4", m16: "M16", xm7: "XM7", xm8: "XM8",
  hk416: "HK416", hk417: "HK417", hk33: "HK33", k2c: "K2C", k2: "K2",
  k3: "K3", k201: "K201", k400: "K400", noveske: "Noveske",
  f2000: "F2000", g36c: "G36C", groza: "Groza", sg550: "SG550",
  tar: "TAR-21", stg44: "STG44", g11: "G11", an94: "AN-94",
  aks74u: "AKS-74U", fg42: "FG42", m14: "M14", scar: "SCAR",
  sks: "SKS", mpt: "MPT", lss: "LSS", taurus: "Taurus",
  // smg
  krisssuperv: "Kriss Super V", kriss: "Kriss", p90: "P90", p90mc: "P90 MC",
  mp5k: "MP5K", mp7: "MP7", mp9: "MP9", mp40: "MP40", spectre: "Spectre",
  uzi: "UZI", thompson: "Thompson", ump45: "UMP45", scorpion: "Scorpion",
  pp19: "PP-19", apc9: "APC9", mx4: "MX4", k1: "K1",
  // shotguns
  m1887: "M1887", saiga: "Saiga", spas15: "SPAS-15", spas: "SPAS",
  "870mcs": "870MCS", m1014: "M1014", uts: "UTS",
  supershorty870: "Super Shorty 870", kel: "Kel-Tec", jackhammer: "Jackhammer",
  // snipers
  cheytac: "CheyTac", tactilite: "Tactilite", tactililte: "Tactilite",
  barrett: "Barrett", l115a1: "L115A1", svd: "SVD", svu: "SVU",
  ssg69: "SSG69", dsr: "DSR", pgm: "PGM", mk13: "MK13", awp: "AWP",
  xm2010: "XM2010", kar98k: "Kar98k", m70: "M70", remington: "Remington",
  vsk94: "VSK94", m24: "M24", cheytacm200: "CheyTac M200",
  // pistols
  coltpython: "Colt Python", deserteagle: "Desert Eagle", glock18: "Glock 18",
  hk45: "HK45", luger: "Luger", mk23: "MK23", p99: "P99", tec: "TEC-9",
  u22: "U22", walther: "Walther", colt45: "Colt 45", k5: "K5",
  duckpistol: "Duck Pistol", pirategun: "Pirate Gun", watergun: "Water Gun",
  watergun2016: "Water Gun 2016", penguingun: "Penguin Gun", m: "M",
  // machine guns
  bb: "BB", ultimax: "Ultimax", l86: "L86", mk46: "MK46", pkm: "PKM",
  rpd: "RPD", mini: "Mini",
  // melee
  fangblade: "Fang Blade", boneknife: "Bone Knife", karambit: "Karambit",
  butterfly: "Butterfly", kukri: "Kukri", keris: "Keris", kunai: "Kunai",
  katana: "Katana", axe: "Axe", crowbar: "Crowbar", cutlass: "Cutlass",
  deathscythe: "Death Scythe", fieldshovel: "Field Shovel",
  fryingpan: "Frying Pan", hammer: "Hammer", hwando: "Hwando",
  ninjato: "Ninjato", nunchaku: "Nunchaku", shuriken: "Shuriken",
  spiked: "Spiked", trenchknife: "Trench Knife", baseball: "Baseball",
  badmintonracket: "Badminton Racket", bottle: "Bottle",
  candycane: "Candy Cane", chinesecleaver: "Chinese Cleaver",
  diploma: "Diploma", icecream: "Ice Cream", ladle: "Ladle",
  maracas: "Maracas", tambourine: "Tambourine", ukulele: "Ukulele",
  knuckle: "Knuckle", assassinknuckle: "Assassin Knuckle",
  ballockknuckle: "Ballock Knuckle", garenaknuckle: "Garena Knuckle",
  pumpkinknuckle: "Pumpkin Knuckle", silverknuckle: "Silver Knuckle",
  hunter: "Hunter", ice: "Ice", death: "Death", fang: "Fang",
  knight: "Knight", shamantools: "Shaman Tools", sorceresswand: "Sorceress Wand",
  stick: "Stick", football: "Football", beachball: "Beach Ball", beach: "Beach",
  bamboo: "Bamboo", ballisticknife: "Ballistic Knife",
  // throwables / launchers
  c4: "C4", c5: "C5", bomb: "Bomb", flashbang: "Flashbang",
  flashbangplus: "Flashbang Plus", smokegrenade: "Smoke Grenade", smoke: "Smoke",
  gasbomb: "Gas Bomb", m18: "M18", decoy: "Decoy",
  chocolategrenade: "Chocolate Grenade", candygrenade: "Candy Grenade",
  bundlegrenade: "Bundle Grenade", poisongrenade: "Poison Grenade",
  cakebomb: "Cake Bomb", grenadelauncher: "Grenade Launcher", m32: "M32",
  m79: "M79", rpg7: "RPG-7", gl: "GL",
  // equipment / misc
  medical: "Medical", medicalkit: "Medical Kit", supply: "Supply",
  skill: "Skill", shuttlex: "Shuttle X", chocolate: "Chocolate",
  halloween: "Halloween", wp: "WP",
};

const ACRONYMS = new Set([
  "ace", "led", "fbi", "sas", "sasr", "grs", "ctf", "fr", "br", "se", "sl",
  "pbic", "pbtc", "pbwc", "pbnc", "cny", "wc", "u20", "gsl", "id", "npc",
  "ai", "rng", "op", "iv", "ii", "iii",
]);

const VARIANTS = {
  anniv: "Anniversary",
  anniversary: "Anniversary",
  aniversary: "Anniversary",
  "10anniv": "10th Anniversary",
  brmode: "BR Mode",
  recamo: "ReCamo",
  sopmod: "SOPMOD",
  dualmag: "Dual Mag",
  a3: "A3",
  a2: "A2",
  "1st": "1st",
  "2nd": "2nd",
  "3rd": "3rd",
  "4th": "4th",
  "5th": "5th",
  "6th": "6th",
  "7th": "7th",
  "9th": "9th",
  "10th": "10th",
  "11th": "11th",
  "12th": "12th",
  "13th": "13th",
  "14th": "14th",
  "15th": "15th",
  "16th": "16th",
  "17th": "17th",
};

function cap(w) {
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function word(w) {
  if (!w) return "";
  const lw = w.toLowerCase();
  if (VARIANTS[lw]) return VARIANTS[lw];
  if (DISPLAY[lw]) return DISPLAY[lw];
  if (/^\d+$/.test(w)) return w;

  // 2022anniversary -> "2022 Anniversary"
  let m = /^(\d{2,4})([a-z]+)$/i.exec(lw);
  if (m) return `${m[1]} ${word(m[2])}`;

  // m4a1, m82a1, 870mcs, t77, u22, m200, k2c, xm7, pbic2013
  if (/^[a-z]/i.test(w) && /\d/.test(w) && w.length <= 8) return w.toUpperCase();
  if (/^[a-z]{1,6}\d{1,4}[a-z]?$/i.test(w)) return w.toUpperCase();
  if (/^\d{2,4}[a-z]{1,6}$/i.test(w)) return w.toUpperCase();

  if (ACRONYMS.has(lw)) return w.toUpperCase();
  if (w === w.toUpperCase() && w.length <= 6) return w;
  return cap(w);
}

function words(tokens) {
  return tokens.filter(Boolean).map(word).join(" ").replace(/\s+/g, " ").trim();
}

/** Split an all-lower or mixed slug into display tokens. */
function slugTokens(slug) {
  return slug
    .replace(/^sea3123_/, "")
    .split(/[_\s]+/)
    .filter(Boolean);
}

/* family = the stable weapon model, variant = everything after it */
const FAMILY_CONSUME = {
  oa: 1, sc: 1, as: 1, gl: 1, bora: 1, mts: 1, k: 1, m: 1, ak: 1,
  cheytac: 1, tactilite: 1, tactililte: 1, pindad: 2,
  sig: 2, honey: 1, rngmaster: 1, taclite: 1, cerberus: 1, zombie: 1,
  hk: 1, mercury: 1, viking: 1, mars: 1, tornado: 1,
  cheytacm200: 0,
};
const FAMILY_SEP = { oa: "-", sc: "-", as: "-", gl: "-", bora: "-", mts: "-", ak: "-", k: "", m: "" };

const SPECIAL_SLUGS = {
  m_7knife: { family: "M7 Knife", rest: [] },
};

function describeWeapon(slug) {
  const tokens = slugTokens(slug);
  let family;
  let rest;

  if (SPECIAL_SLUGS[slug]) {
    ({ family, rest } = SPECIAL_SLUGS[slug]);
  } else {
    const t0 = tokens[0] ?? slug;
    const consume = FAMILY_CONSUME[t0] ?? 0;
    const extra = consume ? tokens.slice(1, 1 + consume) : [];
    const sep = FAMILY_SEP[t0] ?? " ";
    const base = DISPLAY[t0] ?? word(t0);
    family = extra.length ? `${base}${sep}${words(extra)}` : base;
    rest = tokens.slice(1 + extra.length);
  }

  const variant = words(rest);
  const name = [family, variant].filter(Boolean).join(" ");
  return { name, family, variant, cls: classifyWeapon(slug, tokens), tokens };
}

const RIFLES = new Set([
  "aug", "oa", "sc", "sc2010", "pindad", "msbs", "famas", "m4a1", "ak", "ak47",
  "xm7", "xm8", "hk416", "hk417", "hk33", "k2", "k2c", "k3", "k201", "k400",
  "k413", "k479", "gh5007", "sig", "vz52", "sc2010",
  "noveske", "f2000", "g36c", "groza", "sg550", "tar", "stg44", "g11", "an94",
  "aks74u", "fg42", "m14", "scar", "m4", "m16", "sks", "mpt", "lss",
]);
const SMGS = new Set([
  "p90", "p90mc", "krisssuperv", "kriss", "mp5k", "mp7", "mp9", "mp40",
  "spectre", "uzi", "thompson", "ump45", "scorpion", "pp19", "apc9", "mx4", "k1",
  "honey", "t77",
]);
const SHOTGUNS = new Set([
  "m1887", "saiga", "spas15", "spas", "870mcs", "m1014", "uts",
  "supershorty870", "kel", "jackhammer",
]);
const SNIPERS = new Set([
  "cheytac", "cheytacm200", "tactilite", "tactililte", "barrett", "l115a1",
  "svd", "svu", "ssg69", "dsr", "pgm", "mk13", "awp", "xm2010", "kar98k",
  "m70", "remington", "vsk94", "m24", "as", "bora", "taclite", "rngmaster", "mts",
]);
const PISTOLS = new Set([
  "coltpython", "deserteagle", "glock18", "hk45", "luger", "mk23", "p99",
  "tec", "u22", "walther", "colt45", "k5", "duckpistol", "pirategun",
  "watergun", "watergun2016", "penguingun", "m", "taurus",
]);
const MGS = new Set(["bb", "ultimax", "l86", "mk46", "pkm", "rpd", "mini"]);
const MELEE = new Set([
  "fangblade", "boneknife", "karambit", "butterfly", "kukri", "keris", "kunai",
  "katana", "axe", "crowbar", "cutlass", "deathscythe", "fieldshovel",
  "fryingpan", "hammer", "hwando", "ninjato", "nunchaku", "shuriken", "spiked",
  "trenchknife", "baseball", "badmintonracket", "bottle", "candycane",
  "chinesecleaver", "diploma", "icecream", "ladle", "maracas", "tambourine",
  "ukulele", "knuckle", "assassinknuckle", "ballockknuckle", "garenaknuckle",
  "pumpkinknuckle", "silverknuckle", "hunter", "ice", "death", "fang",
  "knight", "shamantools", "sorceresswand", "stick", "football", "beachball",
  "beach", "bamboo", "ballisticknife",
]);
const THROWABLES = new Set([
  "c4", "c5", "bomb", "flashbang", "flashbangplus", "smokegrenade", "smoke",
  "gasbomb", "m18", "decoy", "chocolategrenade", "candygrenade",
  "bundlegrenade", "poisongrenade", "cakebomb", "wp",
]);
const LAUNCHERS = new Set(["grenadelauncher", "m32", "m79", "rpg7", "gl"]);
const EQUIPMENT = new Set([
  "medical", "medicalkit", "supply", "skill", "shuttlex", "chocolate",
  "halloween", "2023",
]);

function classifyWeapon(slug, tokens) {
  const t0 = tokens[0] ?? "";
  if (slug.startsWith("as_val")) return "Rifle";
  if (/psg1/.test(slug)) return "Sniper";
  if (/shotgun|caneshotgun/.test(slug)) return "Shotgun";
  if (/hk69|m197/.test(slug)) return "Launcher";
  if (/snow.?ball/.test(slug)) return "Throwable";
  if (/zombie_?slayer/.test(slug)) return "Shotgun";
  if (/canegun|caneshotgun/.test(slug)) return "Shotgun";
  if (/chocolate_lollipop|lance|potato/.test(slug)) return "Melee";
  if (/saber|spear|syringe|icicle|dalgona/.test(slug)) return "Melee";
  if (/knife|blade|scythe|katana|karambit|kukri|keris|kunai|shuriken|nunchaku|axe|crowbar|cutlass|shovel|fryingpan|hammer|hwando|ninjato|cleaver|candycane|diploma|icecream|ladle|maracas|tambourine|ukulele|baseball|badminton|bottle|knuckle|sword|wand|tools|fork|stick|baton/.test(slug)) return "Melee";
  if (/grenade|bomb|flashbang|(^|_)c4(_|$)|(^|_)c5(_|$)|smoke|mine|decoy/.test(slug)) return "Throwable";
  if (/launcher|rpg7|m32|m79|(^|_)gl(_|$)/.test(slug)) return "Launcher";

  if (t0 === "m" && (tokens[1] === "1" || tokens[1] === "2" || tokens[1] === "3" || tokens[1] === "4")) return "SMG";
  if (t0 === "m" && tokens[1] === "9") return "Pistol";
  if (t0 === "m" && tokens[1] === "7") return "Pistol";
  if (t0 === "k" && tokens[1] === "1") return "SMG";
  if (t0 === "k" && tokens[1] === "5") return "Pistol";
  if (t0 === "k" && (tokens[1] === "2" || tokens[1] === "3" || tokens[1] === "201" || tokens[1] === "400" || tokens[1] === "413" || tokens[1] === "479")) return "Rifle";
  if (t0 === "bb") {
    if (slug.includes("gatling")) return "MG";
    if (slug.includes("l115a1")) return "Sniper";
    if (slug.includes("oa93")) return "Rifle";
  }

  if (MELEE.has(t0)) return "Melee";
  if (THROWABLES.has(t0)) return "Throwable";
  if (LAUNCHERS.has(t0)) return "Launcher";
  if (EQUIPMENT.has(t0)) return "Equipment";
  if (MGS.has(t0)) return "MG";
  if (SNIPERS.has(t0)) return "Sniper";
  if (SHOTGUNS.has(t0)) return "Shotgun";
  if (PISTOLS.has(t0)) return "Pistol";
  if (SMGS.has(t0)) return "SMG";
  if (RIFLES.has(t0)) return "Rifle";
  return "Other";
}

/* ------------------------------------------------------------------ */
/* cosmetics                                                           */
/* ------------------------------------------------------------------ */

const COSMETIC_PREFIX = {
  A_F: "Face",
  A_H: "Head",
  A_E: "Headgear",
  IF_H: "Hair",
  IF_S: "Hair",
  O_H: "Head",
  O_G: "Gloves",
  O_F: "Face",
  O_B: "Back",
  O_R: "Accessory",
  O_U: "Upper",
  O_L: "Lower",
  O_S: "Set",
  F_G: "Gloves",
  M_G: "Gloves",
  F_M: "Mask",
  M_M: "Mask",
  F_U: "Upper",
  M_U: "Upper",
  F_L: "Lower",
  M_L: "Lower",
  F_S: "Suit",
  M_S: "Suit",
  S_S: "Set",
  S_M: "Set",
};

function splitCamel(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

function describeCosmetic(part) {
  const bits = part.split("_");
  const prefix = bits.slice(0, 2).join("_");
  const slot = COSMETIC_PREFIX[prefix] ?? "Other";
  let rest = bits.slice(2);

  // Drop 2-letter series codes (AA, AB, ...) from the display name only.
  let series = "";
  if (rest.length > 1 && /^[A-Z]{2}$/.test(rest[0])) {
    rest = rest.slice(1);
  }
  if (rest.length) series = splitCamel(rest[0]).replace(/-.*$/, "");

  const pretty = splitCamel(rest.join("_")).replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const variantToken = rest.length > 1 ? rest[rest.length - 1] : "";
  const variant = variantToken && !/^[A-Z]{2}$/.test(variantToken) ? splitCamel(variantToken) : "";

  return {
    name: pretty || part,
    slot,
    series,
    variant,
    tokens: rest,
  };
}

/* ------------------------------------------------------------------ */
/* maps                                                                */
/* ------------------------------------------------------------------ */

const MAP_NAMES = {
  airport: "Airport", angkorruins: "Angkor Ruins", ballistic: "Ballistic",
  battleship: "Battleship", blackmamba: "Black Mamba", blackpanther: "Black Panther",
  blowcity: "Blow City", breakdown: "Breakdown", breedingnest: "Breeding Nest",
  burninghall: "Burning Hall", cargoport: "Cargo Port", cargoship: "Cargo Ship",
  construction: "Construction", construction2: "Construction 2", crackdown: "Crackdown",
  d_breakdown: "D-Breakdown", deadtown: "Dead Town", desertcamp: "Desert Camp",
  dinolab: "Dino Lab", downtown: "Downtown", downtown2: "Downtown 2",
  dragonalley: "Dragon Alley", dsquad: "D-Squad", d_uptown: "D-Uptown",
  easternroad: "Eastern Road", facerock: "Face Rock", fallucity: "Fallu City",
  fatalzone: "Fatal Zone", ghosttown: "Ghost Town", giran2: "Giran 2",
  grandbazaar: "Grand Bazaar", hardrock: "Hard Rock", helispot: "Heli Spot",
  hindrance: "Hindrance", hospital: "Hospital", hotelcamouflage: "Hotel Camouflage",
  housemuseum: "House Museum", kickpoint: "Kick Point", library: "Library",
  luxville: "Luxville", machupichu: "Machu Picchu", marinewave: "Marine Wave",
  metro: "Metro", new_library: "New Library", nport: "N-Port",
  nstation: "M. Station", outpost: "Outpost", pumpkinhollow: "Pumpkin Hollow",
  ramparttown: "Rampart Town", rothenvillage: "Rothen Village", rushhour: "Rush Hour",
  safari: "Safari", safari2: "Safari 2", safehouse: "Safe House",
  saintmansion: "Saint Mansion", sandstorm: "Sandstorm", sentrybase: "Sentry Base",
  sewerage: "Sewerage", shoppingcenter: "Shopping Center", slumarea: "Slum Area",
  stormtube: "Storm Tube", supplybase: "Supply Base",
  taipeicitymall: "Taipei City Mall", trainingcamp: "Training Camp",
  tutorial: "Tutorial", twotowers: "Two Towers", under23: "Under 23",
  uptown: "Uptown", watercomplex: "Water Complex", weststation: "West Station",
  a_blowcity: "A-Blow City", ampera: "Ampera", bankhall: "Bank Hall",
  biolab: "Bio Lab", brokenalley: "Broken Alley", cemetery: "Cemetery",
  c_point: "C-Point", desertcanyon: "Desert Canyon", dinoruins: "Dino Ruins",
  draintunnel: "Drain Tunnel", fishmarket: "Fish Market",
  fortsantiago: "Fort Santiago", f_uptown: "F-Uptown", glass_lab: "Glass Lab",
  glass_updown: "Glass Updown", gustav: "Gustav", hawkeye: "Hawkeye",
  historic_site: "Historic Site", holiday: "Holiday", holiday2: "Holiday 2",
  infection_airport: "Infection Airport", junkyard: "Junkyard",
  khaosarn: "Khaosarn", lostvalley: "Lost Valley", mansion: "Mansion",
  m_bridge: "M-Bridge", mihawk: "Mihawk", new_crackdown: "New Crackdown",
  new_downtown2: "New Downtown 2", octagon: "Octagon", olddock: "Old Dock",
  provence: "Provence", relic: "Relic", roadside: "Roadside",
  ruinedvillage: "Ruined Village", secretmansion: "Secret Mansion",
  shootingrange: "Shooting Range", spaceport: "Space Port", stillraid: "Still Raid",
  s_twotowers: "S-Two Towers", sweetcrackdown: "Sweet Crackdown",
  thaistadium: "Thai Stadium", tinytown: "Tiny Town", tower11: "Tower 11",
  tunafactory: "Tuna Factory", valentine_ramparttown: "Valentine Rampart Town",
  villa: "Villa", waterpark: "Water Park", wilderness: "Wilderness",
  wildwestexpress: "Wild West Express", winterdowntown: "Winter Downtown",
  xinyiplaza: "Xinyi Plaza", xmas_burninghall: "Xmas Burning Hall",
  xmas_library: "Xmas Library", xmas_luxville: "Xmas Luxville",
  xmas_saintmansion: "Xmas Saint Mansion",
};

function mapName(slug) {
  return MAP_NAMES[slug] ?? slug.split("_").map(cap).join(" ");
}

/* ------------------------------------------------------------------ */
/* remote manifests (optional cache from site/fetch-remote.mjs)        */
/* ------------------------------------------------------------------ */

const REMOTE_DIR = path.join(ROOT, "site", "data", "remote");

function readRemote(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(REMOTE_DIR, name), "utf8"));
  } catch {
    return null;
  }
}

const weaponIndex = readRemote("weapons-models.json");
const itemNames = readRemote("items.en.json")?.names ?? {};
const crossIndex = readRemote("cross-icons.json")?.icons ?? {};

const modelByFile = new Map();
for (const w of weaponIndex?.weapons ?? []) modelByFile.set(w.file, w);

/** Existence check against the extracted asset map (path relative to /assets/ui/). */
function uiExists(rel) {
  const key = `assets/ui/${rel}`;
  const i = key.lastIndexOf("/");
  return !!(dirs[key.slice(0, i)]?.[key.slice(i + 1)]);
}

function mapExists(slug, file) {
  return !!dirs[`assets/pc3123/maps/${slug}`]?.[file];
}

const normName = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* pack name -> item id, from the localized equipment name table */
const packToItemId = new Map();
for (const [id, rec] of Object.entries(itemNames)) {
  const m = /Equipment\\([^\\]+)\\([^\\]+)\\/.exec(rec?.src ?? "");
  if (!m) continue;
  for (const pack of m[2].split("+")) {
    const key = normName(pack);
    if (!packToItemId.has(key)) packToItemId.set(key, id);
  }
}

/* pack name -> icon record, from the cross icon index */
const nameToIcon = new Map();
for (const [id, rec] of Object.entries(crossIndex)) {
  if (rec?.name) {
    const key = normName(rec.name);
    if (!nameToIcon.has(key)) nameToIcon.set(key, { id, ...rec });
  }
}

function spriteFor(rec) {
  if (!rec?.sheet || !uiExists(rec.sheet)) return null;
  return { u: `/assets/ui/${rec.sheet}`, x: rec.x ?? 0, y: rec.y ?? 0, w: rec.w, h: rec.h };
}

function standaloneIcon(id) {
  for (const d of ["sea3123/icons/items", "sea3123/icons/weapons", "sea3123/icons/chars"]) {
    const rel = `${d}/${id}.png`;
    if (uiExists(rel)) return { u: `/assets/ui/${rel}` };
  }
  return null;
}

/** Resolve an icon for an item id, preferring a cropped sheet entry. */
function iconForId(id) {
  if (!id) return null;
  const rec = crossIndex[id];
  return (rec && spriteFor(rec)) || standaloneIcon(id);
}

function officialName(id) {
  return id ? itemNames[id]?.name ?? null : null;
}

/* ------------------------------------------------------------------ */
/* build                                                               */
/* ------------------------------------------------------------------ */

const items = [];

// 1. weapon / equipment models
const weaponModels = dirs["assets/weapons/models"] ?? {};
for (const [file, hash] of Object.entries(weaponModels)) {
  if (!file.toLowerCase().endsWith(".glb")) continue;
  const slug = file.slice(0, -4);
  const d = describeWeapon(slug);
  const tags = [];
  if (d.variant) tags.push(...d.variant.split(" ").slice(0, 2));

  const meta = modelByFile.get(file);
  const spawnIds = [...new Set([meta?.itemId, ...(meta?.itemIds ?? [])]
    .filter((v) => v != null && v !== "")
    .map(Number)
    .filter((v) => Number.isFinite(v) && v > 0))];
  const ids = spawnIds;
  let img = null;
  let official = null;
  for (const id of ids) {
    official ??= officialName(id);
    img = iconForId(id);
    if (img) break;
  }

  items.push({
    k: "w",
    id: `w:${slug}`,
    cat: "weapons",
    name: d.name,
    official,
    cls: d.cls,
    family: d.family,
    variant: d.variant,
    tags,
    path: `/assets/weapons/models/${file}`,
    hash,
    slug,
    ...(spawnIds.length ? { itemId: spawnIds[0], itemIds: spawnIds } : {}),
    ...(img ? { img } : {}),
  });
}

// 2. avatar / cosmetic parts
const partKeys = Object.keys(dirs).filter((k) => /^assets\/avatar\/parts\/[^/]+$/.test(k));
for (const key of partKeys) {
  const part = key.split("/").pop();
  const files = dirs[key] ?? {};
  const modelName =
    Object.keys(files).find((f) => f.toLowerCase() === `${part.toLowerCase()}.glb`) ??
    Object.keys(files).find((f) => f.toLowerCase().endsWith(".glb"));
  if (!modelName) continue;
  const d = describeCosmetic(part);
  const tags = [d.slot];
  if (d.variant) tags.push(d.variant);

  const key2 = normName(part);
  const iconRec = nameToIcon.get(key2);
  const candidates = [...new Set([packToItemId.get(key2), iconRec?.id].filter(Boolean))];
  let img = null;
  let official = null;
  for (const id of candidates) {
    official ??= officialName(id);
    img = iconForId(id);
    if (img) break;
  }

  items.push({
    k: "c",
    id: `c:${part}`,
    cat: "cosmetics",
    name: d.name,
    official,
    slot: d.slot,
    family: d.series || d.slot,
    variant: d.variant,
    tags,
    path: `/${key}/${modelName}`,
    hash: files[modelName],
    slug: part,
    ...(img ? { img } : {}),
  });
}

// 3. maps (classic + pc3123 editions)
const classicMaps = Object.keys(dirs)
  .filter((k) => k.startsWith("assets/maps/") && k.split("/").length === 3)
  .map((k) => k.split("/")[2]);
const pcMaps = Object.keys(dirs)
  .filter((k) => k.startsWith("assets/pc3123/maps/") && k.split("/").length === 4)
  .map((k) => k.split("/")[3]);
const mapSlugs = [...new Set([...classicMaps, ...pcMaps])].sort();
for (const slug of mapSlugs) {
  const editions = [];
  const paths = [];
  if (classicMaps.includes(slug)) {
    editions.push("Classic");
    paths.push(`/assets/maps/${slug}`);
  }
  if (pcMaps.includes(slug)) {
    editions.push("PC3123");
    paths.push(`/assets/pc3123/maps/${slug}`);
  }
  const img = mapExists(slug, "thumbnail.png")
    ? { u: `/assets/pc3123/maps/${slug}/thumbnail.png` }
    : null;
  items.push({
    k: "m",
    id: `m:${slug}`,
    cat: "maps",
    name: mapName(slug),
    family: editions.join(" / "),
    variant: "",
    tags: editions,
    path: paths[0],
    paths,
    slug,
    ...(img ? { img } : {}),
  });
}

// 4. weapon accessories (numeric attachments)
const accessories = dirs["assets/weapons/accessories"] ?? {};
for (const [file, hash] of Object.entries(accessories)) {
  if (!file.toLowerCase().endsWith(".glb")) continue;
  const slug = file.slice(0, -4);
  const num = /^acc_(\d+)$/.exec(slug)?.[1] ?? slug;
  const official = officialName(num);
  items.push({
    k: "a",
    id: `a:${num}`,
    cat: "attachments",
    name: official || `Attachment #${num}`,
    official,
    cls: "Attachment",
    family: "Accessories",
    variant: "",
    tags: ["Accessory"],
    path: `/assets/weapons/accessories/${file}`,
    hash,
    slug,
  });
}

// stable order: category, then name, then slug
const catOrder = { weapons: 0, cosmetics: 1, maps: 2, attachments: 3 };
items.sort(
  (a, b) =>
    (catOrder[a.cat] ?? 9) - (catOrder[b.cat] ?? 9) ||
    a.name.localeCompare(b.name, "en") ||
    a.slug.localeCompare(b.slug, "en"),
);

const counts = items.reduce((acc, it) => {
  acc[it.cat] = (acc[it.cat] ?? 0) + 1;
  return acc;
}, {});

const payload = {
  generated: new Date().toISOString(),
  source: "pbrecon/asset-map.json",
  assetBase: "https://shootingpoint.xyz",
  imagesFrom: "https://shootingpoint.xyz/assets/ui + /assets/pc3123/maps",
  counts,
  total: items.length,
  items,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "items.json"), JSON.stringify(payload));
fs.writeFileSync(
  path.join(OUT_DIR, "items.js"),
  `/* generated by site/build-items.mjs - ${payload.generated} */\nwindow.PB_INDEX = ${JSON.stringify(payload)};\n`,
);

console.log(`wrote ${items.length} items to ${path.relative(ROOT, OUT_DIR)}`);
console.log(counts);
if (!weaponIndex) {
  console.log("note: no remote cache found - run `node site/fetch-remote.mjs` for item images");
} else {
  console.log(
    `images: ${Object.entries(
      items.reduce((a, i) => {
        a[i.cat] = a[i.cat] ?? [0, 0];
        a[i.cat][1]++;
        if (i.img) a[i.cat][0]++;
        return a;
      }, {}),
    )
      .map(([k, [withImg, total]]) => `${k}=${withImg}/${total}`)
      .join(", ")}`,
  );
}
console.log(
  `weapon classes: ${Object.entries(
    items.filter((i) => i.cat === "weapons").reduce((a, i) => ((a[i.cls] = (a[i.cls] ?? 0) + 1), a), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}=${v}`)
    .join(", ")}`,
);
console.log(
  `cosmetic slots: ${Object.entries(
    items.filter((i) => i.cat === "cosmetics").reduce((a, i) => ((a[i.slot] = (a[i.slot] ?? 0) + 1), a), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}=${v}`)
    .join(", ")}`,
);
