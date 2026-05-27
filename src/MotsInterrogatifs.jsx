// MotsInterrogatifs.jsx
// Nouvelle page : Mots interrogatifs (Palavras interrogativas)
// Intégration : importer dans App.jsx et ajouter la route screen === "motsInterrogatifs"
// Dépendance audio : utilise window.__speakPortuguese (déjà défini dans App.jsx)

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────
//  DONNÉES
// ─────────────────────────────────────────────────────────────────
const MOTS = [
  {
    id: "o-que",
    word: "O que",
    fr: "Que / Qu'est-ce que",
    emoji: "🤔",
    color: "#f97316",
    gradient: "linear-gradient(135deg,#f97316,#ef4444)",
    explanation_fr:
      "Utilisé pour poser des questions sur des choses ou des actions. C'est l'équivalent de 'quoi' ou 'que' en français.",
    level: "Débutant",
    examples: [
      { pt: "O que você está fazendo?", fr: "Qu'est-ce que tu fais ?", register: null },
      { pt: "O que você quer comer?", fr: "Qu'est-ce que tu veux manger ?", register: null },
      { pt: "O que aconteceu?", fr: "Qu'est-ce qui s'est passé ?", register: null },
    ],
    formal: { pt: "O que o senhor deseja?", fr: "Que désirez-vous, Monsieur ?" },
    informal: { pt: "O que você tá querendo?", fr: "T'as envie de quoi ?" },
  },
  {
    id: "quem",
    word: "Quem",
    fr: "Qui",
    emoji: "👤",
    color: "#ec4899",
    gradient: "linear-gradient(135deg,#ec4899,#8b5cf6)",
    explanation_fr:
      "Utilisé pour poser des questions sur des personnes. Équivalent de 'qui' en français. Ne change pas avec le genre ou le nombre.",
    level: "Débutant",
    examples: [
      { pt: "Quem é você?", fr: "Qui êtes-vous / Qui es-tu ?", register: null },
      { pt: "Quem fez isso?", fr: "Qui a fait ça ?", register: null },
      { pt: "Quem você está chamando?", fr: "Qui tu appelles ?", register: null },
    ],
    formal: { pt: "Com quem eu falo?", fr: "À qui ai-je l'honneur ?" },
    informal: { pt: "Quem é esse cara?", fr: "C'est qui ce mec ?" },
  },
  {
    id: "onde",
    word: "Onde",
    fr: "Où",
    emoji: "📍",
    color: "#10b981",
    gradient: "linear-gradient(135deg,#10b981,#3b82f6)",
    explanation_fr:
      "Utilisé pour poser des questions sur un lieu. Équivalent direct de 'où' en français.",
    level: "Débutant",
    examples: [
      { pt: "Onde você mora?", fr: "Où est-ce que tu habites ?", register: null },
      { pt: "Onde fica o banheiro?", fr: "Où sont les toilettes ?", register: null },
      { pt: "Onde você comprou isso?", fr: "Tu as acheté ça où ?", register: null },
    ],
    formal: { pt: "Onde você está?", fr: "Où vous trouvez-vous ?" },
    informal: { pt: "Onde você tá?", fr: "T'es où ?" },
  },
  {
    id: "quando",
    word: "Quando",
    fr: "Quand",
    emoji: "📅",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)",
    explanation_fr:
      "Utilisé pour poser des questions sur le moment ou le temps. Équivalent direct de 'quand' en français.",
    level: "Débutant",
    examples: [
      { pt: "Quando você vai viajar?", fr: "Quand tu vas voyager ?", register: null },
      { pt: "Quando começa a festa?", fr: "Quand est-ce que la fête commence ?", register: null },
      { pt: "Quando você chegou?", fr: "Quand est-ce que tu es arrivé(e) ?", register: null },
    ],
    formal: { pt: "Quando seria possível nos encontrar?", fr: "Quand serait-il possible de nous rencontrer ?" },
    informal: { pt: "Quando você tá livre?", fr: "T'es libre quand ?" },
  },
  {
    id: "por-que",
    word: "Por que",
    fr: "Pourquoi",
    emoji: "💡",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg,#f59e0b,#f97316)",
    explanation_fr:
      "Utilisé pour demander une raison. Attention : 'por que' (question) s'écrit en deux mots, 'porque' (réponse) s'écrit en un seul mot !",
    level: "Débutant",
    examples: [
      { pt: "Por que você está triste?", fr: "Pourquoi tu es triste ?", register: null },
      { pt: "Por que você fez isso?", fr: "Pourquoi tu as fait ça ?", register: null },
      { pt: "Por que você não veio?", fr: "Pourquoi tu n'es pas venu(e) ?", register: null },
    ],
    formal: { pt: "Por que razão você se atrasou?", fr: "Pour quelle raison vous êtes-vous attardé(e) ?" },
    informal: { pt: "Por que você tá chateado?", fr: "T'es énervé pourquoi ?" },
  },
  {
    id: "como",
    word: "Como",
    fr: "Comment",
    emoji: "💬",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)",
    explanation_fr:
      "Utilisé pour demander la manière dont quelque chose se passe. Équivalent de 'comment' en français. Aussi utilisé pour se présenter : 'Como você se chama?' (Comment tu t'appelles ?).",
    level: "Débutant",
    examples: [
      { pt: "Como você se chama?", fr: "Comment tu t'appelles ?", register: null },
      { pt: "Como você está?", fr: "Comment tu vas ?", register: null },
      { pt: "Como se diz isso em português?", fr: "Comment dit-on ça en portugais ?", register: null },
    ],
    formal: { pt: "Como posso ajudá-lo?", fr: "Comment puis-je vous aider ?" },
    informal: { pt: "Como você tá?", fr: "Comment tu vas ?" },
  },
  {
    id: "quanto",
    word: "Quanto / Quantos / Quantas",
    fr: "Combien (de)",
    emoji: "🔢",
    color: "#06b6d4",
    gradient: "linear-gradient(135deg,#06b6d4,#3b82f6)",
    explanation_fr:
      "Utilisé pour poser des questions sur une quantité. S'accorde avec le genre : 'quanto' (masc. singulier), 'quantos' (masc. pluriel), 'quantas' (fém. pluriel).",
    level: "Débutant",
    examples: [
      { pt: "Quanto custa?", fr: "Combien ça coûte ?", register: null },
      { pt: "Quantos anos você tem?", fr: "Tu as quel âge ? (litt. Combien d'années tu as ?)", register: null },
      { pt: "Quantas pessoas vieram?", fr: "Combien de personnes sont venues ?", register: null },
    ],
    formal: { pt: "Qual é o valor deste produto?", fr: "Quel est le prix de ce produit ?" },
    informal: { pt: "Quanto tá isso?", fr: "C'est combien ça ?" },
  },
  {
    id: "qual",
    word: "Qual / Quais",
    fr: "Quel(le)(s) / Lequel / Laquelle",
    emoji: "🎯",
    color: "#ef4444",
    gradient: "linear-gradient(135deg,#ef4444,#f59e0b)",
    explanation_fr:
      "Utilisé pour choisir parmi plusieurs options. 'Qual' au singulier, 'quais' au pluriel. Peut remplacer 'o que' dans certains contextes formels.",
    level: "Débutant",
    examples: [
      { pt: "Qual é o seu nome?", fr: "Quel est ton nom ?", register: null },
      { pt: "Qual você prefere?", fr: "Lequel tu préfères ?", register: null },
      { pt: "Quais são seus hobbies?", fr: "Quels sont tes hobbies ?", register: null },
    ],
    formal: { pt: "Qual é o seu endereço?", fr: "Quelle est votre adresse ?" },
    informal: { pt: "Qual deles você curte mais?", fr: "T'aimes lequel le plus ?" },
  },
];

// ─────────────────────────────────────────────────────────────────
//  QUIZ
// ─────────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    q: "Comment dit-on 'Où est-ce que tu habites ?' en portugais ?",
    opts: ["Quando você mora?", "Onde você mora?", "Como você mora?", "Quem você mora?"],
    a: "Onde você mora?",
    explain: "'Onde' = où. On l'utilise pour parler d'un lieu.",
  },
  {
    q: "Quelle est la traduction de 'Quem fez isso?' ?",
    opts: ["Qu'est-ce que t'as fait ?", "Où t'as fait ça ?", "Qui a fait ça ?", "Quand t'as fait ça ?"],
    a: "Qui a fait ça ?",
    explain: "'Quem' = qui. C'est le mot pour parler d'une personne.",
  },
  {
    q: "Comment dit-on 'Combien ça coûte ?' en portugais (informel) ?",
    opts: ["Qual custa?", "Como custa?", "Quando custa?", "Quanto tá isso?"],
    a: "Quanto tá isso?",
    explain: "'Quanto tá isso?' est la façon informelle de demander le prix. 'Tá' est une contraction de 'está'.",
  },
  {
    q: "Quelle phrase signifie 'Comment tu t'appelles ?' ?",
    opts: ["Onde você se chama?", "Como você se chama?", "Qual você se chama?", "Quem você se chama?"],
    a: "Como você se chama?",
    explain: "'Como' = comment. Cette phrase est essentielle pour se présenter !",
  },
  {
    q: "Complète : '_____ você vai viajar?' (Quand tu vas voyager ?)",
    opts: ["Onde", "Como", "Quando", "Por que"],
    a: "Quando",
    explain: "'Quando' = quand. On l'utilise pour parler du temps.",
  },
  {
    q: "Traduis : 'Por que você está triste?'",
    opts: ["Où tu es triste ?", "Pourquoi tu es triste ?", "Comment tu es triste ?", "Quand tu es triste ?"],
    a: "Pourquoi tu es triste ?",
    explain: "'Por que' = pourquoi. Attention : s'écrit en deux mots dans une question !",
  },
  {
    q: "Quelle est la forme plurielle de 'qual' ?",
    opts: ["quals", "quales", "quais", "qualos"],
    a: "quais",
    explain: "'Qual' → 'quais' au pluriel. Exemple : 'Quais são seus hobbies?'",
  },
  {
    q: "Comment dit-on 'Qu'est-ce que tu veux manger ?' ?",
    opts: ["Quem você quer comer?", "Onde você quer comer?", "O que você quer comer?", "Qual você quer comer?"],
    a: "O que você quer comer?",
    explain: "'O que' = que / qu'est-ce que. Utilisé pour les choses et les actions.",
  },
  {
    q: "Laquelle est la forme FORMELLE de 'Onde você tá?' ?",
    opts: ["Onde você está?", "Onde você vai?", "Quando você está?", "Como você está?"],
    a: "Onde você está?",
    explain: "Au formel, on utilise 'está' à la place de 'tá' (qui est une contraction informelle).",
  },
  {
    q: "Traduis : 'Quantos anos você tem?'",
    opts: ["Combien tu es vieux ?", "Quel âge tu as ?", "Tu as quand l'âge ?", "Comment tu as des années ?"],
    a: "Quel âge tu as ?",
    explain: "'Quantos anos você tem?' = littéralement 'combien d'années tu as ?'. C'est la façon standard de demander l'âge en portugais.",
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────────────────────────
//  STYLES  (reprend exactement les tokens visuels de App.jsx)
// ─────────────────────────────────────────────────────────────────
const S = {
  page: {
    fontFamily: "'Georgia',serif",
    color: "#fff",
    minHeight: "100vh",
    background: "linear-gradient(160deg,#0f0c29,#302b63,#24243e)",
    paddingBottom: 56,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "rgba(0,0,0,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  backBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "'Georgia',serif",
  },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  heroBox: { textAlign: "center", padding: "28px 16px 20px" },
  heroEmoji: { fontSize: 52, display: "block", marginBottom: 10 },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    margin: "0 0 4px",
    background: "linear-gradient(90deg,#a78bfa,#60d9fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: { color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0, lineHeight: 1.5 },
  sectionTitle: {
    color: "#fbbf24",
    fontWeight: "bold",
    fontSize: 13,
    margin: "0 0 14px",
    textTransform: "uppercase",
    letterSpacing: 1,
    padding: "0 14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
    gap: 12,
    padding: "0 14px 24px",
    maxWidth: 760,
    margin: "0 auto",
  },
  card: {
    borderRadius: 18,
    padding: "18px 14px",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    transition: "transform .15s",
    userSelect: "none",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  cardEmoji: { fontSize: 30, display: "block", marginBottom: 8 },
  cardWord: { color: "#fff", fontSize: 16, fontWeight: "bold", margin: "0 0 2px" },
  cardFr: { color: "rgba(255,255,255,0.65)", fontSize: 12, margin: 0, fontStyle: "italic" },
  cardLevel: {
    display: "inline-block",
    marginTop: 8,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: "2px 10px",
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  // Detail panel
  detailWrap: {
    maxWidth: 540,
    margin: "0 auto",
    padding: "0 14px 32px",
  },
  detailHero: {
    borderRadius: 18,
    padding: "22px 18px",
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  detailWord: { color: "#fff", fontSize: 28, fontWeight: "bold", margin: "0 0 2px" },
  detailFr: { color: "rgba(255,255,255,0.75)", fontSize: 16, fontStyle: "italic", margin: "0 0 10px" },
  detailExplBox: {
    background: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    padding: "10px 14px",
    marginTop: 8,
  },
  detailExpl: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.6, margin: 0 },
  audioBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    borderRadius: 9999,
    padding: "7px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "'Georgia',serif",
    marginTop: 12,
  },
  badgeFormal: {
    display: "inline-block",
    background: "rgba(96,217,250,0.2)",
    border: "1px solid rgba(96,217,250,0.4)",
    color: "#60d9fa",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: "bold",
    marginRight: 6,
  },
  badgeInformal: {
    display: "inline-block",
    background: "rgba(251,191,36,0.2)",
    border: "1px solid rgba(251,191,36,0.4)",
    color: "#fbbf24",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: "bold",
    marginRight: 6,
  },
  subsectionTitle: {
    color: "#fbbf24",
    fontWeight: "bold",
    fontSize: 12,
    margin: "0 0 10px",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  exCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 8,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  exPt: { color: "#fff", fontSize: 14, fontWeight: "bold", margin: "0 0 2px" },
  exFr: { color: "#93c5fd", fontSize: 13, fontStyle: "italic", margin: 0 },
  exAudioBtn: {
    flexShrink: 0,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    borderRadius: 9999,
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "'Georgia',serif",
  },
  formalBox: {
    background: "rgba(96,217,250,0.07)",
    border: "1px solid rgba(96,217,250,0.2)",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 8,
  },
  informalBox: {
    background: "rgba(251,191,36,0.07)",
    border: "1px solid rgba(251,191,36,0.2)",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 8,
  },
  formalPt: { color: "#fff", fontSize: 14, fontWeight: "bold", margin: "0 0 2px" },
  formalFr: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontStyle: "italic", margin: 0 },
  section: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: "14px",
    marginBottom: 12,
  },
  // quiz
  quizWrap: { padding: "16px 14px", maxWidth: 480, margin: "0 auto" },
  quizTop: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  quizCounter: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
  quizPts: { background: "#fbbf24", color: "#1a1040", borderRadius: 20, padding: "2px 12px", fontWeight: "bold", fontSize: 13 },
  quizBar: { height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden", marginBottom: 16 },
  quizBarFill: { height: "100%", background: "linear-gradient(90deg,#a78bfa,#60d9fa)", borderRadius: 10, transition: "width .4s" },
  quizQ: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 14, lineHeight: 1.4 },
  quizOpts: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 },
  quizOpt: { padding: "13px 16px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, cursor: "pointer", textAlign: "left", fontFamily: "'Georgia',serif" },
  quizOptOk: { background: "rgba(46,204,113,0.2)", borderColor: "#2ecc71", color: "#b8ffd4" },
  quizOptBad: { background: "rgba(231,76,60,0.2)", borderColor: "#e74c3c", color: "#ffc0bb" },
  quizOptFade: { opacity: 0.35 },
  quizFb: { borderRadius: 10, padding: "11px 14px", fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  quizFbOk: { background: "rgba(46,204,113,0.15)", color: "#b8ffd4", border: "1px solid #2ecc71" },
  quizFbBad: { background: "rgba(231,76,60,0.15)", color: "#ffc0bb", border: "1px solid #e74c3c" },
  quizExplain: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontStyle: "italic", padding: "0 4px 10px" },
  quizNext: { width: "100%", padding: "13px", background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: "bold", cursor: "pointer" },
  quizResult: { padding: "20px 14px", maxWidth: 480, margin: "0 auto", textAlign: "center" },
  quizResTitle: { color: "#fbbf24", fontSize: 20, fontWeight: "bold", margin: "10px 0 6px" },
  quizResMsg: { color: "rgba(255,255,255,0.65)", fontSize: 14, marginBottom: 20 },
  quizDoneBtn: { width: "100%", padding: "14px", background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: "bold", cursor: "pointer" },
  quizStartBox: { textAlign: "center", padding: "32px 14px" },
  quizStartEmoji: { fontSize: 52, marginBottom: 10 },
  quizStartTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", margin: "0 0 8px" },
  quizStartSub: { color: "rgba(255,255,255,0.55)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 },
  quizStartBtn: { padding: "14px 32px", background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: "bold", cursor: "pointer" },
};

// ─────────────────────────────────────────────────────────────────
//  SOUS-COMPOSANTS
// ─────────────────────────────────────────────────────────────────

function speak(text) {
  if (typeof window !== "undefined" && window.__speakPortuguese) {
    window.__speakPortuguese(text);
  } else if (typeof window !== "undefined" && window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

function WordCard({ mot, onSelect }) {
  return (
    <div
      style={{ ...S.card, background: mot.gradient }}
      onClick={() => onSelect(mot)}
      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
    >
      <span style={S.cardEmoji}>{mot.emoji}</span>
      <p style={S.cardWord}>{mot.word}</p>
      <p style={S.cardFr}>{mot.fr}</p>
      <span style={S.cardLevel}>{mot.level}</span>
    </div>
  );
}

function WordDetail({ mot, onBack }) {
  const [playingIdx, setPlayingIdx] = useState(null);

  function playWord() {
    speak(mot.word.split("/")[0].trim());
  }

  function playExample(pt, idx) {
    setPlayingIdx(idx);
    speak(pt);
    setTimeout(() => setPlayingIdx(null), 2000);
  }

  return (
    <div style={S.detailWrap}>
      {/* Back */}
      <button style={{ ...S.backBtn, margin: "14px 0 16px", display: "inline-block" }} onClick={onBack}>
        ← Tous les mots
      </button>

      {/* Hero card */}
      <div style={{ ...S.detailHero, background: mot.gradient }}>
        <span style={{ fontSize: 36, display: "block", marginBottom: 6 }}>{mot.emoji}</span>
        <p style={S.detailWord}>{mot.word}</p>
        <p style={S.detailFr}>{mot.fr}</p>
        <button style={S.audioBtn} onClick={playWord}>
          🔊 Écouter
        </button>
        <div style={S.detailExplBox}>
          <p style={S.detailExpl}>{mot.explanation_fr}</p>
        </div>
      </div>

      {/* Examples */}
      <div style={S.section}>
        <p style={S.subsectionTitle}>💬 Exemples</p>
        {mot.examples.map((ex, i) => (
          <div key={i} style={S.exCard}>
            <div style={{ flex: 1 }}>
              <p style={S.exPt}>🇧🇷 {ex.pt}</p>
              <p style={S.exFr}>🇫🇷 {ex.fr}</p>
            </div>
            <button
              style={{
                ...S.exAudioBtn,
                background: playingIdx === i ? "rgba(167,139,250,0.3)" : undefined,
              }}
              onClick={() => playExample(ex.pt, i)}
            >
              {playingIdx === i ? "▶️" : "🔊"}
            </button>
          </div>
        ))}
      </div>

      {/* Formal / Informal */}
      {(mot.formal || mot.informal) && (
        <div style={S.section}>
          <p style={S.subsectionTitle}>⚖️ Formel vs Informel</p>
          {mot.formal && (
            <div style={S.formalBox}>
              <span style={S.badgeFormal}>Formel</span>
              <div style={{ marginTop: 8, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <p style={S.formalPt}>🇧🇷 {mot.formal.pt}</p>
                  <p style={S.formalFr}>🇫🇷 {mot.formal.fr}</p>
                </div>
                <button style={S.exAudioBtn} onClick={() => speak(mot.formal.pt)}>🔊</button>
              </div>
            </div>
          )}
          {mot.informal && (
            <div style={S.informalBox}>
              <span style={S.badgeInformal}>Informel</span>
              <div style={{ marginTop: 8, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <p style={S.formalPt}>🇧🇷 {mot.informal.pt}</p>
                  <p style={S.formalFr}>🇫🇷 {mot.informal.fr}</p>
                </div>
                <button style={S.exAudioBtn} onClick={() => speak(mot.informal.pt)}>🔊</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Quiz ──────────────────────────────────────────────────────
function QuizSection({ nome, onFinish }) {
  const [started, setStarted] = useState(false);
  const [questions] = useState(() => shuffle(QUIZ_QUESTIONS));
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState([]);
  const [finished, setFinished] = useState(false);
  const [opts] = useState(() => questions.map(q => shuffle(q.opts)));

  function pick(o) {
    if (sel !== null) return;
    setSel(o);
    if (o === questions[qi].a) setScore(s => s + 1);
    else setWrongs(w => [...w, { q: questions[qi].q, correct: questions[qi].a, given: o }]);
  }

  function next() {
    setSel(null);
    if (qi + 1 >= questions.length) setFinished(true);
    else setQi(i => i + 1);
  }

  if (!started) {
    return (
      <div style={S.quizStartBox}>
        <div style={S.quizStartEmoji}>❓</div>
        <p style={S.quizStartTitle}>Quiz — Mots interrogatifs</p>
        <p style={S.quizStartSub}>
          {questions.length} questions pour tester ta maîtrise des mots interrogatifs en portugais brésilien !
        </p>
        <button style={S.quizStartBtn} onClick={() => setStarted(true)}>
          Commencer le quiz 🚀
        </button>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const medal = pct === 100 ? "🏆" : pct >= 70 ? "🥈" : "🥉";
    return (
      <div style={S.quizResult}>
        <div style={{ fontSize: 56, textAlign: "center" }}>{medal}</div>
        <p style={S.quizResTitle}>
          {score}/{questions.length} correctes — {pct}%
        </p>
        <p style={S.quizResMsg}>
          {pct === 100
            ? `Parfait${nome ? ", " + nome : ""} ! Tu maîtrises tous les mots interrogatifs !`
            : pct >= 70
            ? `Très bien${nome ? ", " + nome : ""} ! Continue comme ça !`
            : `Relis les cartes et réessaie${nome ? ", " + nome : ""} !`}
        </p>
        {wrongs.length > 0 && (
          <div
            style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: 14,
              padding: 14,
              textAlign: "left",
              marginBottom: 16,
            }}
          >
            <p style={{ color: "#fbbf24", fontWeight: "bold", marginBottom: 8, fontSize: 13 }}>
              📝 À revoir :
            </p>
            {wrongs.map((w, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, display: "block" }}>
                  {w.q}
                </span>
                <span style={{ color: "#6ee7b7", fontSize: 13, fontWeight: "bold" }}>
                  ✅ {w.correct}
                </span>
              </div>
            ))}
          </div>
        )}
        <button style={S.quizDoneBtn} onClick={onFinish}>
          Terminer ✅
        </button>
      </div>
    );
  }

  const q = questions[qi];
  const isOk = sel === q.a;

  return (
    <div style={S.quizWrap}>
      <div style={S.quizTop}>
        <span style={S.quizCounter}>
          Question {qi + 1}/{questions.length}
        </span>
        <span style={S.quizPts}>⭐ {score}</span>
      </div>
      <div style={S.quizBar}>
        <div style={{ ...S.quizBarFill, width: `${(qi / questions.length) * 100}%` }} />
      </div>
      <p style={S.quizQ}>{q.q}</p>
      <div style={S.quizOpts}>
        {opts[qi].map((o, i) => {
          let st = { ...S.quizOpt };
          if (sel !== null) {
            if (o === q.a) st = { ...st, ...S.quizOptOk };
            else if (o === sel) st = { ...st, ...S.quizOptBad };
            else st = { ...st, ...S.quizOptFade };
          }
          return (
            <button key={i} style={st} onClick={() => pick(o)} disabled={sel !== null}>
              {sel !== null && o === q.a && "✅ "}
              {sel !== null && o === sel && o !== q.a && "❌ "}
              {o}
            </button>
          );
        })}
      </div>
      {sel !== null && (
        <>
          <div style={{ ...S.quizFb, ...(isOk ? S.quizFbOk : S.quizFbBad) }}>
            {isOk ? "🌟 Correct ! Très bien !" : `La bonne réponse était : "${q.a}"`}
          </div>
          {q.explain && <p style={S.quizExplain}>{q.explain}</p>}
          <button style={S.quizNext} onClick={next}>
            {qi + 1 < questions.length ? "Suivant ➡" : "Voir le résultat 🎉"}
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export default function MotsInterrogatifs({ onBack, nome }) {
  const [selected, setSelected] = useState(null); // mot sélectionné
  const [view, setView] = useState("cards");       // "cards" | "quiz"

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <button
          style={S.backBtn}
          onClick={() => {
            if (selected) { setSelected(null); return; }
            if (view === "quiz") { setView("cards"); return; }
            onBack();
          }}
        >
          ← {selected ? "Tous les mots" : view === "quiz" ? "Retour" : "Início"}
        </button>
        <span style={S.headerTitle}>❓ Mots interrogatifs</span>
        {view === "cards" && !selected ? (
          <button
            style={{
              ...S.backBtn,
              background: "linear-gradient(135deg,#7c3aed,#2563eb)",
              border: "none",
            }}
            onClick={() => setView("quiz")}
          >
            Quiz ❓
          </button>
        ) : (
          <span style={{ width: 60 }} />
        )}
      </div>

      {/* Vue quiz */}
      {view === "quiz" && (
        <QuizSection nome={nome} onFinish={() => setView("cards")} />
      )}

      {/* Vue détail d'un mot */}
      {view === "cards" && selected && (
        <WordDetail mot={selected} onBack={() => setSelected(null)} />
      )}

      {/* Vue grille de cartes */}
      {view === "cards" && !selected && (
        <>
          <div style={S.heroBox}>
            <span style={S.heroEmoji}>❓</span>
            <h1 style={S.heroTitle}>Mots interrogatifs</h1>
            <p style={S.heroSub}>
              Les mots essentiels pour poser des questions en portugais brésilien.
              <br />
              Appuie sur une carte pour voir les exemples et écouter la prononciation !
            </p>
          </div>

          <p style={S.sectionTitle}>📚 {MOTS.length} mots à apprendre</p>

          <div style={S.grid}>
            {MOTS.map(mot => (
              <WordCard key={mot.id} mot={mot} onSelect={setSelected} />
            ))}
          </div>

          {/* CTA Quiz */}
          <div style={{ textAlign: "center", padding: "0 14px 16px" }}>
            <button
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: "bold",
                cursor: "pointer",
                fontFamily: "'Georgia',serif",
              }}
              onClick={() => setView("quiz")}
            >
              🚀 Commencer le quiz
            </button>
          </div>
        </>
      )}
    </div>
  );
}
