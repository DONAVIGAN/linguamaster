/* Test de parcours LinguaMaster — vérifie le flow réel dans un DOM simulé.
   Prérequis : npm install jsdom  (hors repo, aucune dépendance livrée)
   Usage     : node tests/smoke.js index.html                          */
const fs = require("fs");
const { JSDOM } = require("jsdom");

const file = process.argv[2];
const html = fs.readFileSync(file, "utf8");

let pass = 0, fail = 0;
const t = (name, cond, extra) => {
  cond ? pass++ : fail++;
  console.log((cond ? "  ✅ " : "  ❌ ") + name + (cond || !extra ? "" : "  → " + extra));
};

const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://donavigan.github.io/linguamaster/",
  beforeParse(w) {
    w.speechSynthesis = { cancel(){}, speak(){}, getVoices:()=>[], addEventListener(){} };
    w.SpeechSynthesisUtterance = function(){};
    w.addEventListener("error", e => errors.push(e.error || e.message));
    w.scrollTo = () => {};
    w.Element.prototype.scrollIntoView = () => {};
  },
});
const w = dom.window, d = w.document;

const visible = id => d.getElementById(id).classList.contains("active");
const activeScreen = () => [...d.querySelectorAll(".screen")].find(s => s.classList.contains("active"))?.id;
const txt = () => d.querySelector(".content").textContent.replace(/\s+/g, " ");

console.log("\n════ 1. DÉMARRAGE ════");
t("aucune erreur JS à l'init", errors.length === 0, JSON.stringify(errors));
t("la landing est l'écran d'entrée", visible("screen-landing"), "écran actif = " + activeScreen());
t("l'écran d'activation n'est PAS affiché", d.getElementById("license-overlay").style.display === "none");
t("les stats 🔥/⭐ sont masquées", d.getElementById("h-stats").style.display === "none");

console.log("\n════ 2. CONTENU DE LA LANDING ════");
const lp = d.getElementById("screen-landing").textContent.replace(/\s+/g, " ");
t("annonce 6 langues", /6 langues/i.test(lp));
t("les 6 langues sont nommées",
  ["Anglais","Espagnol","Chinois","Russe","Arabe","Haoussa"].every(l => lp.includes(l)));
t("aucune mention de « 5 langues »", !/5\s*langues/i.test(html));
t("le code DEMO-2025 n'apparaît plus", !/DEMO-2025/.test(html));
const SECRET_KEY = "LM#SPHINX#2025#NIGER";
// STATE/quizData sont déclarés en `let` : invisibles depuis window.
// On lit donc l'état réel via localStorage, comme le fait l'app.
const state = () => JSON.parse(w.localStorage.getItem("linguamaster_v1") || "{}");
const setState = o => w.localStorage.setItem("linguamaster_v1", JSON.stringify(o));
t("CTA essai gratuit présent", /ESSAYEZ GRATUITEMENT/i.test(lp));
t("les deux formules sont affichées", lp.includes("2 000 FCFA") && lp.includes("8 000 FCFA"));
t("badge MEILLEURE OFFRE sur le bundle",
  d.querySelector(".price-hero .price-badge")?.textContent.includes("MEILLEURE OFFRE"));

console.log("\n════ 3. LIENS WHATSAPP PRÉREMPLIS ════");
const waAll = d.getElementById("lp-wa-all").href;
t("wa.me + numéro Bénin", waAll.startsWith("https://wa.me/2290196049800?text="));
const msg = decodeURIComponent(waAll.split("?text=")[1]);
t("message prérempli correct : « " + msg + " »",
  msg === "Bonjour, je souhaite acheter LinguaMaster — Toutes les langues à 8 000 FCFA.");
t("lien secondaire vers le Niger", d.getElementById("lp-wa-alt").href.includes("wa.me/22786997142"));
t("lien question distinct de l'achat",
  decodeURIComponent(d.getElementById("lp-wa-q").href).includes("j'ai une question"));

console.log("\n════ 4. ESSAI GRATUIT SANS CODE ════");
w.startTrial();
t("on arrive sur le choix de la langue", visible("screen-home"), activeScreen());
t("consigne affichée", /choisissez la langue/i.test(d.getElementById("home-status").textContent));
t("aucun cadenas pendant le choix", d.querySelectorAll(".lang-card.is-locked").length === 0);

w.openLang("en");
t("l'anglais s'ouvre sans aucun code saisi", visible("screen-lang"), activeScreen());
t("essai enregistré sur l'anglais", state().trial && state().trial.lang === "en");
t("bandeau d'essai visible", /Essai gratuit/i.test(d.getElementById("lang-notice").textContent));
t("vocabulaire limité à 5 cartes", d.querySelectorAll(".vcard").length === 5,
  d.querySelectorAll(".vcard").length + " cartes");
t("invitation à débloquer en bas de liste", !!d.querySelector(".lock-note"));

console.log("\n════ 5. PÉRIMÈTRE DE L'ESSAI ════");
w.switchMod("grammar");
const rows = d.querySelectorAll(".lesson-row");
t("1 seule leçon ouverte, les autres cadenassées",
  rows.length > 1 && [...rows].filter(r => r.textContent.includes("🔒")).length === rows.length - 1);
w.switchMod("quiz");
const qOpts = d.querySelectorAll(".opt").length;
t("quiz raccourci à 3 questions", /1\/3/.test(txt()) && qOpts > 0, "compteur = " + (txt().match(/\d\/\d+/) || ["?"])[0]);
w.switchMod("dialogue");
t("dialogue verrouillé (cœur de l'offre)", /Réservé aux licences/i.test(txt()));
w.switchMod("pron");
t("1 seule règle de prononciation", d.querySelectorAll(".pron-card").length === 1);

console.log("\n════ 6. LANGUE NON INCLUSE → ÉCRAN D'OFFRE ════");
w.showHome();
t("les 5 autres langues sont cadenassées", d.querySelectorAll(".lang-card.is-locked").length === 5,
  d.querySelectorAll(".lang-card.is-locked").length + " cadenas");
w.openLang("ha");
t("le haoussa mène à l'offre, pas au contenu", visible("screen-offer"), activeScreen());
t("l'offre nomme la langue demandée", /Haoussa/i.test(d.getElementById("offer-lead").textContent));
const oneLink = d.querySelector("#offer-prices a.wa-btn-sm");
t("bouton d'achat 1 langue prérempli avec la langue demandée",
  oneLink && decodeURIComponent(oneLink.href).includes("Haoussa à 2 000 FCFA"),
  oneLink ? decodeURIComponent(oneLink.href.split("text=")[1]) : "pas de bouton");
t("économie du bundle annoncée", /économisez 4 000 FCFA/i.test(d.getElementById("offer-prices").textContent));

console.log("\n════ 7. ACTIVATION APRÈS ACHAT ════");
w.openActivation();
t("la modale d'activation s'ouvre à la demande",
  d.getElementById("license-overlay").style.display === "flex");

// Code haoussa 30 jours, fabriqué avec l'algorithme de l'app
const exp = Math.floor(Date.now() / 86400000) + 30;
const b36 = exp.toString(36).toUpperCase();
const codeHA = "LM-QW7KHA-" + b36 + w.codeChecksum("QW7K" + b36 + "HA" + SECRET_KEY);
d.getElementById("code-input").value = codeHA;
w.validateCode();
t("code haoussa accepté (" + codeHA + ")", state().license && state().license.lang === "HA");
t("l'essai est remplacé par la licence", state().trial === null);
t("le haoussa est maintenant accessible", w.accessFor("ha") === "full");
t("l'anglais redevient verrouillé (licence 1 langue)", w.accessFor("en") === "none");

w.openLang("ha");
t("le contenu haoussa s'ouvre", visible("screen-lang"), activeScreen());
t("icône du haoussa correcte (pas « undefined »)",
  !d.getElementById("lang-header").innerHTML.includes("undefined"));
t("vocabulaire complet, plus de limite d'essai",
  d.querySelectorAll(".vcard").length > 5, d.querySelectorAll(".vcard").length + " cartes");
t("dialogue haoussa débloqué", (w.switchMod("dialogue"), !/Réservé aux licences/i.test(txt())));

console.log("\n════ 8. CODE INVALIDE ════");
w.openActivation();
d.getElementById("code-input").value = "LM-AAAAEN-ZZZZ99";
w.validateCode();
t("code falsifié refusé avec un message",
  d.getElementById("license-overlay").style.display === "flex" &&
  d.getElementById("code-error").style.display === "block");
t("message d'erreur explicite : « " + d.getElementById("code-error").textContent.trim() + " »",
  /falsifi|invalide/i.test(d.getElementById("code-error").textContent));
w.closeActivation();

console.log("\n════ 9. LICENCE EXPIRÉE ════");
setState({ ...state(), license: { code: "LM-TEST", lang: "ALL", expiryDays: Math.floor(Date.now()/86400000) - 1 }, trial: null });
w.loadState();
t("accès refusé après expiration", w.accessFor("en") === "none");
w.showHome();
t("message de renouvellement affiché",
  /expiré/i.test(d.getElementById("home-status").textContent));

console.log("\n════ 10. RAPPELS D'EXPIRATION (P1) ════");
const setLeft = n => {
  const s2 = state(); s2.license.expiryDays = Math.floor(Date.now()/86400000) + n;
  setState(s2); w.loadState(); w.showHome();
};
setLeft(7); t("J-7 annoncé", /expire dans 7 jours/i.test(d.getElementById("home-status").textContent));
setLeft(1); t("J-1 annoncé", /expire demain/i.test(d.getElementById("home-status").textContent));
setLeft(0); t("Jour J annoncé", /aujourd'hui/i.test(d.getElementById("home-status").textContent));

console.log("\n════ 11. BOUTON RETOUR DU TÉLÉPHONE ════");
setState({ ...state(), license: null, trial: null }); w.loadState();
w.showLanding();
const before = w.history.length;
w.startTrial();
w.openLang("en");
w.switchMod("quiz");
t("l'historique s'empile (retour ne quitte pas l'app)", w.history.length > before,
  before + " → " + w.history.length);
t("aucune erreur JS pendant tout le parcours", errors.length === 0, JSON.stringify(errors.slice(0,3)));

console.log("\n" + "═".repeat(46));
console.log(fail === 0 ? `✅ TOUT PASSE — ${pass} vérifications` : `❌ ${fail} ÉCHEC(S) sur ${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
