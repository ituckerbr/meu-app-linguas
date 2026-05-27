import { useState, useEffect } from "react";
import { supabase, hasSupabase, signUpWithEmail, signInWithPassword, signOut as sbSignOut, getProfile, upsertProfile, getTopRanking, getSession, getUser, onAuthStateChange } from "./supabaseClient";
import MotsInterrogatifs from "./MotsInterrogatifs";

const AUDIO_VOICES = { ready:false, voices:[], preferred:null };
function loadPortugueseVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const all = window.speechSynthesis.getVoices() || [];
  // Keep any voice that mentions pt or has pt lang
  const candidates = all.filter(v => (v.lang && v.lang.toLowerCase().startsWith("pt")) || /pt|brasil|brazil/i.test(v.name));
  if (candidates.length) {
    // Prefer voices that look high-quality (browser providers / neural names)
    const priority = ["google","neural","microsoft","luciana","vitoria","daniel","brasil","brazil","pt-br","pt_pt","pt"];
    candidates.sort((a,b)=>{
      const an = a.name.toLowerCase(); const bn = b.name.toLowerCase();
      const ai = priority.findIndex(k => an.includes(k));
      const bi = priority.findIndex(k => bn.includes(k));
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    AUDIO_VOICES.voices = candidates;
    AUDIO_VOICES.preferred = candidates[0];
    AUDIO_VOICES.ready = true;
  } else if (all.length) {
    // no explicit pt voice but there are voices — try to pick by lang or fallback to first
    const fallback = all.find(v => v.lang && v.lang.toLowerCase().startsWith("pt")) || all[0];
    AUDIO_VOICES.voices = [fallback];
    AUDIO_VOICES.preferred = fallback;
    AUDIO_VOICES.ready = true;
  }
  // Debug helpful list in dev console
  if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development") {
    try { console.info("TTS voices:", AUDIO_VOICES.voices.map(v=>v.name + " ("+v.lang+")")); } catch(e){}
  }
}
if (typeof window !== "undefined") {
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadPortugueseVoices;
    loadPortugueseVoices();
  } else {
    console.warn('Web Speech API not available: speechSynthesis is undefined. TTS features will be disabled.');
  }
}
function speakPortuguese(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!AUDIO_VOICES.ready) loadPortugueseVoices();
  // If voices still not ready, wait briefly and try again once
  if (!AUDIO_VOICES.voices || AUDIO_VOICES.voices.length === 0) {
    setTimeout(() => {
      if (AUDIO_VOICES.voices && AUDIO_VOICES.voices.length) speakPortuguese(text);
      else {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "pt-BR";
        u.rate = 1.0; u.pitch = 1.0; u.volume = 1.0;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      }
    }, 220);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  // prefer explicitly selected preferred voice
  if (AUDIO_VOICES.preferred) utterance.voice = AUDIO_VOICES.preferred;
  else {
    const v = AUDIO_VOICES.voices.find(vv => vv.lang && vv.lang.toLowerCase().startsWith("pt"));
    if (v) utterance.voice = v;
  }
  // Adjust params to improve naturalness where possible
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// Remove emojis and other pictographs so TTS doesn't read them aloud
function sanitizeTextForTTS(input) {
  if (!input) return "";
  try {
    // Remove pictographic emoji characters (uses Unicode property Escape)
    let s = String(input).replace(/\p{Extended_Pictographic}/gu, "");
    // Remove variation selectors and zero-width joiners
    s = s.replace(/\uFE0F|\u200D/g, "");
    // Remove remaining miscellaneous symbols (flags, dingbats)
    s = s.replace(/[\u2600-\u26FF\u2700-\u27BF]/g, "");
    // Collapse whitespace and trim
    s = s.replace(/\s+/g, " ").trim();
    return s;
  } catch (e) {
    // If regex with Unicode properties isn't supported, fall back to a simpler removal
    return String(input).replace(/[:_*~`]/g, "").replace(/\s+/g, " ").trim();
  }
}

// Wrap speakPortuguese to sanitize input before speaking
const _origSpeakPortuguese = speakPortuguese;
function speakPortugueseSanitized(text) {
  const clean = sanitizeTextForTTS(text);
  if (!clean) return;
  return _origSpeakPortuguese(clean);
}

// Replace global reference (keeps existing callers intact)
window.__speakPortuguese = typeof window !== "undefined" ? window.__speakPortuguese || speakPortugueseSanitized : speakPortugueseSanitized;
// Ensure existing callers to `speakPortuguese` use the sanitized version
try { speakPortuguese = speakPortugueseSanitized; } catch (e) { /* ignore in environments where reassignment isn't allowed */ }

// ═══════════════════════════════════════════════════════════════
//  NOTA: versão preview (sem Supabase).
//  Para produção, veja o arquivo aria-cours-supabase.jsx
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  DATA — funções que recebem (nome, idade) e retornam as lições
// ═══════════════════════════════════════════════════════════════

function buildLessons(nome, idade) {
  const n = nome || "Ária";
  const a = idade || "10";

  return [
  // ─── LIÇÃO 1 ───────────────────────────────────────────────
  {
    id:1, title:"Olá! Me apresentando", emoji:"👋", color:"#f97316", topic:"Apresentação pessoal",
    conversation:[
      { who:"lucas", text:`Oi, ${n}! Tudo bem? Eu sou o Lucas, seu professor de português! 😄`, fr:`Salut, ${n} ! Ça va ? Je suis Lucas, ton prof de portugais !` },
      { who:"aluno", text:`Oi, Lucas! Tudo bem sim! Eu me chamo ${n} e tenho ${a} anos.`, fr:`Salut, Lucas ! Ça va bien ! Je m'appelle ${n} et j'ai ${a} ans.` },
      { who:"lucas", text:`Que legal! Quantos anos você tem mesmo, ${n}?`, fr:`Super ! Tu as quel âge exactement, ${n} ?` },
      { who:"aluno", text:`Tenho ${a} anos! E você mora onde, Lucas?`, fr:`J'ai ${a} ans ! Et toi, Lucas, tu habites où ?` },
      { who:"lucas", text:"Eu moro no Brasil! A gente está bem longe um do outro! 😄", fr:"J'habite au Brésil ! On est très loin l'un de l'autre !" },
      { who:"aluno", text:"Que incrível! Eu nunca fui ao Brasil. Como é lá?", fr:"C'est incroyable ! Je ne suis jamais allé(e) au Brésil. C'est comment là-bas ?" },
      { who:"lucas", text:"É muito quente e cheio de natureza! Tem praias lindas. 🌴", fr:"Il fait très chaud et il y a beaucoup de nature ! Il y a de belles plages." },
      { who:"aluno", text:"Nossa! Eu adoro praia! Obrigado(a), Lucas! Até logo!", fr:"Oh là là ! J'adore la plage ! Merci, Lucas ! À bientôt !" },
    ],
    expressions:[
      { pt:"Tudo bem?", fr:"Ça va ?", example:`Oi, ${n}! Tudo bem?` },
      { pt:`Eu me chamo ${n}.`, fr:`Je m'appelle ${n}.`, example:`Eu me chamo ${n} e tenho ${a} anos.` },
      { pt:"Eu moro em…", fr:"J'habite à/en…", example:"Eu moro no Brasil." },
      { pt:"Obrigado(a)!", fr:"Merci !", example:"Obrigado(a), Lucas!" },
      { pt:"Até logo!", fr:"À bientôt !", example:"Até logo, professor!" },
    ],
    quiz:[
      { q:`Como ${n} se apresentou para Lucas?`, q_fr:`Comment ${n} s'est présenté(e) à Lucas ?`, opts:[`Eu sou ${n}`,`Eu me chamo ${n}`,`Meu nome é ${n}`,`Chamo ${n}`], a:`Eu me chamo ${n}` },
      { q:`Quantos anos tem ${n}?`, q_fr:`Quel âge a ${n} ?`, opts:[`${Number(a)-2} anos`,`${Number(a)-1} anos`,`${a} anos`,`${Number(a)+1} anos`], a:`${a} anos` },
      { q:"Onde Lucas mora?", q_fr:"Où habite Lucas ?",opts:["Na França","Em Portugal","No Brasil","Na Espanha"], a:"No Brasil" },
      { q:"Como se diz 'au revoir' em português?", q_fr:"Comment dit-on 'au revoir' en portugais ?", opts:["Tchau!","Até logo!","Boa noite!","Adeus!"], a:"Até logo!" },
      { q:"Como se pergunta 'ça va ?' em português?", q_fr:"Comment demande-t-on 'ça va ?' en portugais ?", opts:["Como você se chama?","Onde você mora?","Tudo bem?","Quantos anos você tem?"], a:"Tudo bem?" },
    ],
    flashcards:[
      { pt:`Oi! Tudo bem, ${n}?`, fr:`Salut ! Ça va, ${n} ?` },
      { pt:"Tudo bem sim, obrigado(a)!", fr:"Ça va bien, merci !" },
      { pt:`Eu me chamo ${n}.`, fr:`Je m'appelle ${n}.` },
      { pt:`Eu tenho ${a} anos.`, fr:`J'ai ${a} ans.` },
      { pt:"Eu moro na França.", fr:"J'habite en France." },
      { pt:"Eu moro no Brasil.", fr:"J'habite au Brésil." },
      { pt:"Onde você mora?", fr:"Où est-ce que tu habites ?" },
      { pt:"Que incrível! Eu adoro praia!", fr:"C'est incroyable ! J'adore la plage !" },
      { pt:"Obrigado(a), Lucas!", fr:"Merci, Lucas !" },
      { pt:"Até logo! Tchau!", fr:"À bientôt ! Au revoir !" },
    ],
  },

  // ─── LIÇÃO 2 ───────────────────────────────────────────────
  {
    id:2, title:"Minha família", emoji:"👨‍👩‍👧‍👦", color:"#ec4899", topic:"Família e irmãos",
    conversation:[
      { who:"lucas", text:`${n}, você tem irmãos?`, fr:`${n}, tu as des frères et sœurs ?` },
      { who:"aluno", text:"Tenho sim! Eu tenho cinco irmãos! É muita gente em casa! 😄", fr:"Oui ! J'ai cinq frères et sœurs ! Il y a beaucoup de monde à la maison !" },
      { who:"lucas", text:"Cinco?! Uau! Eles são mais velhos ou mais novos que você?", fr:"Cinq ?! Waouh ! Ils sont plus grands ou plus petits que toi ?" },
      { who:"aluno", text:"Dois irmãos são mais velhos e três são mais novos. Eu sou do meio!", fr:"Deux frères et sœurs sont plus grands et trois sont plus petits. Je suis au milieu !" },
      { who:"lucas", text:"Que família grande! Como se chamam seus pais?", fr:"Quelle grande famille ! Comment s'appellent tes parents ?" },
      { who:"aluno", text:"Minha mãe se chama Marie e meu pai se chama Pierre.", fr:"Ma mère s'appelle Marie et mon père s'appelle Pierre." },
      { who:"lucas", text:`Bonito! Você brinca muito com seus irmãos, ${n}?`, fr:`C'est joli ! Tu joues beaucoup avec tes frères et sœurs, ${n} ?` },
      { who:"aluno", text:"Sim! A gente brinca de queimada no jardim todo fim de semana! 🎯", fr:"Oui ! On joue à la balle brûlée dans le jardin tous les week-ends !" },
      { who:"lucas", text:"Queimada é um jogo muito popular no Brasil também! Que coincidência! ⚽", fr:"La balle brûlée est très populaire au Brésil aussi ! Quelle coïncidence !" },
      { who:"aluno", text:"Sério? Que legal! A família é tudo! 💕", fr:"Vraiment ? C'est super ! La famille c'est tout !" },
    ],
    expressions:[
      { pt:"Eu tenho… irmãos.", fr:"J'ai… frères/sœurs.", example:"Eu tenho cinco irmãos." },
      { pt:"mais velho / mais novo", fr:"plus grand / plus petit", example:"Meu irmão é mais velho." },
      { pt:"Minha mãe / Meu pai", fr:"Ma mère / Mon père", example:"Minha mãe se chama Marie." },
      { pt:"fim de semana", fr:"week-end", example:"No fim de semana eu brinco." },
      { pt:"A família é tudo!", fr:"La famille c'est tout !", example:"Eu amo minha família!" },
    ],
    quiz:[
      { q:"Quantos irmãos a família tem no total?", q_fr:"Combien de frères et sœurs la famille a-t-elle au total ?", opts:["Três","Quatro","Cinco","Dois"], a:"Cinco" },
      { q:`${n} é do… da família?`, q_fr:`Où se situe ${n} dans la famille ?`, opts:["Início","Meio","Final","Não tem posição"], a:"Meio" },
      { q:"Como se chama a mãe?", q_fr:"Comment s'appelle la mère ?", opts:["Ária","Marie","Pierre","Lucas"], a:"Marie" },
      { q:"Qual brincadeira a família faz no jardim?", q_fr:"Quel jeu la famille fait-elle dans le jardin ?", opts:["Futebol","Roblox","Queimada","Natação"], a:"Queimada" },
      { q:"'Fim de semana' em francês é…", q_fr:"Comment dit-on 'fim de semana' en français ?", opts:["Vacances","Semaine","Week-end","Jour férié"], a:"Week-end" },
    ],
    flashcards:[
      { pt:"Eu tenho cinco irmãos.", fr:"J'ai cinq frères et sœurs." },
      { pt:"Eu sou do meio da família.", fr:"Je suis au milieu de la famille." },
      { pt:"Minha mãe se chama Marie.", fr:"Ma mère s'appelle Marie." },
      { pt:"Meu pai se chama Pierre.", fr:"Mon père s'appelle Pierre." },
      { pt:"Dois irmãos são mais velhos.", fr:"Deux frères et sœurs sont plus grands." },
      { pt:"Três irmãos são mais novos.", fr:"Trois frères et sœurs sont plus petits." },
      { pt:"A gente brinca no jardim.", fr:"On joue dans le jardin." },
      { pt:"A família é tudo!", fr:"La famille c'est tout !" },
      { pt:"No fim de semana eu brinco.", fr:"Le week-end je joue." },
      { pt:"A queimada é muito divertida!", fr:"La balle brûlée est très amusante !" },
    ],
  },

  // ─── LIÇÃO 3 ───────────────────────────────────────────────
  {
    id:3, title:"Minha casa", emoji:"🏠", color:"#10b981", topic:"Cômodos e objetos da casa",
    conversation:[
      { who:"lucas", text:`${n}, como é a sua casa?`, fr:`${n}, comment est ta maison ?` },
      { who:"aluno", text:"É grande! Tem sala, cozinha, três quartos e um jardim enorme! 🌱", fr:"Elle est grande ! Il y a un salon, une cuisine, trois chambres et un grand jardin !" },
      { who:"lucas", text:"Três quartos para seis filhos? Como é isso?", fr:"Trois chambres pour six enfants ? Comment ça se passe ?" },
      { who:"aluno", text:"Eu divido o quarto com um irmão. Às vezes é chato, mas é divertido! 😄", fr:"Je partage la chambre avec un frère ou une sœur. Parfois c'est ennuyeux, mais c'est amusant !" },
      { who:"lucas", text:"Entendo! Você tem um lugar favorito na casa?", fr:"Je comprends ! Tu as un endroit préféré dans la maison ?" },
      { who:"aluno", text:"Sim! O meu quarto! Lá eu jogo no celular e ouço música. 🎵", fr:"Oui ! Ma chambre ! Là je joue sur mon téléphone et j'écoute de la musique." },
      { who:"lucas", text:"E na cozinha? Você ajuda a cozinhar?", fr:"Et dans la cuisine ? Tu aides à cuisiner ?" },
      { who:"aluno", text:"Às vezes! Eu sei fazer crepe! É a comida favorita da minha mãe. 🥞", fr:"Parfois ! Je sais faire des crêpes ! C'est le plat préféré de ma mère." },
      { who:"lucas", text:"Uau! Crepe é delicioso! No Brasil a gente come muito também!", fr:"Waouh ! Les crêpes c'est délicieux ! Au Brésil on en mange beaucoup aussi !" },
      { who:"aluno", text:"Um dia vou te ensinar a receita! 👩‍🍳", fr:"Un jour je t'apprendrai la recette !" },
    ],
    expressions:[
      { pt:"sala", fr:"salon", example:"A sala é grande." },
      { pt:"quarto", fr:"chambre", example:"Meu quarto é pequeno." },
      { pt:"cozinha", fr:"cuisine", example:"A cozinha tem fogão." },
      { pt:"Às vezes…", fr:"Parfois…", example:"Às vezes é chato." },
      { pt:"lugar favorito", fr:"endroit préféré", example:"Meu lugar favorito é o quarto." },
    ],
    quiz:[
      { q:"Quantos quartos tem a casa?", q_fr:"Combien de chambres la maison a-t-elle ?", opts:["Dois","Três","Quatro","Cinco"], a:"Três" },
      { q:"Qual é o lugar favorito?", q_fr:"Quel est l'endroit préféré ?", opts:["A cozinha","O jardim","O quarto","A sala"], a:"O quarto" },
      { q:"O que se faz no quarto?", q_fr:"Que fait-on dans la chambre ?", opts:["Cozinha","Estuda só","Joga e ouve música","Assiste TV"], a:"Joga e ouve música" },
      { q:"O que se sabe cozinhar?", q_fr:"Que sait-on cuisiner ?", opts:["Bolo","Crepe","Pizza","Arroz"], a:"Crepe" },
      { q:"'Quarto' em francês é…", q_fr:"Comment dit-on 'quarto' en français ?", opts:["Salon","Cuisine","Jardin","Chambre"], a:"Chambre" },
    ],
    flashcards:[
      { pt:"A minha casa é grande.", fr:"Ma maison est grande." },
      { pt:"A sala tem sofá e televisão.", fr:"Le salon a un canapé et une télévision." },
      { pt:"Eu divido o quarto com um irmão.", fr:"Je partage la chambre avec un frère." },
      { pt:"A cozinha tem fogão e geladeira.", fr:"La cuisine a une cuisinière et un réfrigérateur." },
      { pt:"O jardim é enorme!", fr:"Le jardin est énorme !" },
      { pt:"O banheiro fica no corredor.", fr:"La salle de bain est dans le couloir." },
      { pt:"Minha janela tem vista para o jardim.", fr:"Ma fenêtre donne sur le jardin." },
      { pt:"Eu durmo na minha cama.", fr:"Je dors dans mon lit." },
      { pt:"A mesa é grande para a família.", fr:"La table est grande pour la famille." },
      { pt:"Eu sei fazer crepe!", fr:"Je sais faire des crêpes !" },
    ],
  },

  // ─── LIÇÃO 4 ───────────────────────────────────────────────
  {
    id:4, title:"Na escola", emoji:"🏫", color:"#3b82f6", topic:"Escola e matérias",
    conversation:[
      { who:"lucas", text:`${n}, você gosta da escola?`, fr:`${n}, tu aimes l'école ?` },
      { who:"aluno", text:"Mais ou menos! Eu gosto de algumas matérias e outras não tanto. 😅", fr:"Plus ou moins ! J'aime certaines matières et d'autres pas trop." },
      { who:"lucas", text:"Qual é a sua matéria favorita?", fr:"Quelle est ta matière préférée ?" },
      { who:"aluno", text:"Eu adoro Educação Física! A gente joga muito! E também gosto de Arte. 🎨", fr:"J'adore l'EPS ! On joue beaucoup ! Et j'aime aussi les Arts." },
      { who:"lucas", text:"E qual você não gosta tanto?", fr:"Et laquelle tu n'aimes pas trop ?" },
      { who:"aluno", text:"Matemática... os números são difíceis às vezes! 😬", fr:"Les maths... les chiffres sont difficiles parfois !" },
      { who:"lucas", text:`Haha! Mas você é inteligente, ${n}, vai aprender! Você tem amigos na escola?`, fr:`Haha ! Mais tu es intelligente, ${n}, tu vas apprendre ! Tu as des amis à l'école ?` },
      { who:"aluno", text:"Sim! Minha melhor amiga se chama Sofia. A gente senta junto na sala. 💛", fr:"Oui ! Ma meilleure amie s'appelle Sofia. On s'assoit ensemble en classe." },
      { who:"lucas", text:"Que legal! E como é o recreio?", fr:"Super ! Et comment est la récré ?" },
      { who:"aluno", text:"O recreio é o melhor! A gente corre, brinca e conversa muito! 🏃", fr:"La récré c'est le meilleur ! On court, on joue et on parle beaucoup !" },
    ],
    expressions:[
      { pt:"matéria favorita", fr:"matière préférée", example:"Minha matéria favorita é Arte." },
      { pt:"Educação Física", fr:"EPS (sport)", example:"Eu adoro Educação Física." },
      { pt:"melhor amigo(a)", fr:"meilleur(e) ami(e)", example:"Meu melhor amigo se chama…" },
      { pt:"recreio", fr:"récréation / récré", example:"O recreio é divertido." },
      { pt:"difícil / fácil", fr:"difficile / facile", example:"Matemática é difícil." },
    ],
    quiz:[
      { q:"Qual é a matéria favorita?", q_fr:"Quelle est la matière préférée ?", opts:["Matemática","Português","Educação Física","História"], a:"Educação Física" },
      { q:"O que é difícil às vezes?", q_fr:"Qu'est-ce qui est difficile parfois ?", opts:["Arte","Matemática","Educação Física","Recreio"], a:"Matemática" },
      { q:"Como se chama a melhor amiga?", q_fr:"Comment s'appelle la meilleure amie ?", opts:["Marie","Ana","Sofia","Léa"], a:"Sofia" },
      { q:"O que se faz no recreio?", q_fr:"Que fait-on à la récré ?", opts:["Estuda","Dorme","Corre e brinca","Fica sozinho"], a:"Corre e brinca" },
      { q:"'Recreio' em francês é…", q_fr:"Comment dit-on 'recreio' en français ?", opts:["Classe","Récréation","Matière","Cours"], a:"Récréation" },
    ],
    flashcards:[
      { pt:"Eu gosto da escola.", fr:"J'aime l'école." },
      { pt:"Minha matéria favorita é Educação Física.", fr:"Ma matière préférée c'est l'EPS." },
      { pt:"Matemática é difícil às vezes.", fr:"Les maths sont difficiles parfois." },
      { pt:"Meu(minha) melhor amigo(a) se chama Sofia.", fr:"Mon/Ma meilleur(e) ami(e) s'appelle Sofia." },
      { pt:"A gente senta junto na sala de aula.", fr:"On s'assoit ensemble en classe." },
      { pt:"O recreio é o melhor momento!", fr:"La récré c'est le meilleur moment !" },
      { pt:"A gente corre e brinca no recreio.", fr:"On court et on joue à la récré." },
      { pt:"O professor é muito legal.", fr:"Le professeur est très sympa." },
      { pt:"Eu adoro Arte!", fr:"J'adore les Arts !" },
      { pt:"Os números são difíceis para mim.", fr:"Les chiffres sont difficiles pour moi." },
    ],
  },

  // ─── LIÇÃO 5 ───────────────────────────────────────────────
  {
    id:5, title:"Roblox com amigos", emoji:"🎮", color:"#8b5cf6", topic:"Jogos — Roblox",
    conversation:[
      { who:"lucas", text:`${n}, você joga Roblox hoje?`, fr:`${n}, tu joues à Roblox aujourd'hui ?` },
      { who:"aluno", text:"Sim! Depois do jantar vou jogar com meus irmãos online! 🎮", fr:"Oui ! Après le dîner je vais jouer avec mes frères et sœurs en ligne !" },
      { who:"lucas", text:"Que jogo! Qual é o seu modo favorito no Roblox?", fr:"Super ! Quel est ton mode préféré sur Roblox ?" },
      { who:"aluno", text:"Eu adoro o Adopt Me! Cuido dos meus bichinhos e decoro a casinha. 🐶🏡", fr:"J'adore Adopt Me ! Je m'occupe de mes animaux et je décore ma petite maison." },
      { who:"lucas", text:"Que fofo! Seu personagem tem um nome especial?", fr:"C'est mignon ! Ton personnage a un nom spécial ?" },
      { who:"aluno", text:"Sim! Se chama StarAria! Tenho muitos itens raros! ⭐", fr:"Oui ! Il s'appelle StarAria ! J'ai plein d'objets rares !" },
      { who:"lucas", text:"Você gasta robux para comprar itens?", fr:"Tu dépenses des robux pour acheter des objets ?" },
      { who:"aluno", text:"Às vezes! Mas minha mãe controla quanto eu gasto. 😅", fr:"Parfois ! Mais ma mère contrôle combien je dépense." },
      { who:"lucas", text:`Isso é importante! Sua mãe é muito esperta, ${n}! 😄`, fr:`C'est important ! Ta mère est très intelligente, ${n} !` },
      { who:"aluno", text:"É sim! Ela diz: 'Primeiro dever de casa, depois jogo!' 😂", fr:"Oui ! Elle dit : 'D'abord les devoirs, ensuite les jeux !'" },
    ],
    expressions:[
      { pt:"depois de…", fr:"après…", example:"Depois do jantar, eu jogo." },
      { pt:"Eu adoro…", fr:"J'adore…", example:"Eu adoro Roblox!" },
      { pt:"Cuido de…", fr:"Je m'occupe de…", example:"Cuido dos meus bichinhos." },
      { pt:"primeiro… depois…", fr:"d'abord… ensuite…", example:"Primeiro dever, depois jogo." },
      { pt:"muito esperto(a)", fr:"très intelligent(e)", example:"Minha mãe é muito esperta." },
    ],
    quiz:[
      { q:"Quando se vai jogar Roblox?", q_fr:"Quand va-t-on jouer à Roblox ?", opts:["De manhã","Antes do almoço","Depois do jantar","Na escola"], a:"Depois do jantar" },
      { q:"Qual é o modo favorito no Roblox?", q_fr:"Quel est le mode préféré sur Roblox ?", opts:["Blox Fruits","Adopt Me","Natural Disaster","Tower of Hell"], a:"Adopt Me" },
      { q:"Como se chama o personagem?", q_fr:"Comment s'appelle le personnage ?", opts:["AriaStar","RobloxAria","StarAria","GameAria"], a:"StarAria" },
      { q:"Quem controla os gastos no jogo?", q_fr:"Qui contrôle les dépenses dans le jeu ?", opts:["O pai","O irmão mais velho","A mãe","A professora"], a:"A mãe" },
      { q:"O que a mãe diz antes de jogar?", q_fr:"Que dit la mère avant de jouer ?", opts:["Boa sorte!","Primeiro dever, depois jogo!","Cuidado!","Jogue bem!"], a:"Primeiro dever, depois jogo!" },
    ],
    flashcards:[
      { pt:"Depois do jantar, eu jogo Roblox.", fr:"Après le dîner, je joue à Roblox." },
      { pt:"Eu adoro o modo Adopt Me!", fr:"J'adore le mode Adopt Me !" },
      { pt:"Meu personagem se chama StarAria.", fr:"Mon personnage s'appelle StarAria." },
      { pt:"Eu cuido dos meus bichinhos.", fr:"Je m'occupe de mes animaux." },
      { pt:"Eu tenho muitos itens raros!", fr:"J'ai plein d'objets rares !" },
      { pt:"Minha mãe controla quanto eu gasto.", fr:"Ma mère contrôle combien je dépense." },
      { pt:"Primeiro o dever, depois o jogo!", fr:"D'abord les devoirs, ensuite les jeux !" },
      { pt:"A gente joga online juntos.", fr:"On joue en ligne ensemble." },
      { pt:"Eu jogo com meus irmãos.", fr:"Je joue avec mes frères et sœurs." },
      { pt:"O Roblox é muito divertido!", fr:"Roblox c'est très amusant !" },
    ],
  },

  // ─── LIÇÃO 6 ───────────────────────────────────────────────
  {
    id:6, title:"Fortnite e Competição", emoji:"🏆", color:"#f59e0b", topic:"Jogos — Fortnite",
    conversation:[
      { who:"lucas", text:`${n}, você também joga Fortnite, né?`, fr:`${n}, tu joues aussi à Fortnite, non ?` },
      { who:"aluno", text:"Sim! Fortnite é muito emocionante! Eu jogo com meu irmão mais velho. 🏆", fr:"Oui ! Fortnite c'est très excitant ! Je joue avec mon grand frère." },
      { who:"lucas", text:"Você é bom(boa) no jogo?", fr:"Tu es bon(ne) dans le jeu ?" },
      { who:"aluno", text:"Mais ou menos! Meu irmão é muito melhor que eu, mas estou melhorando! 💪", fr:"Plus ou moins ! Mon frère est bien meilleur que moi, mais je m'améliore !" },
      { who:"lucas", text:"Qual é a sua estratégia favorita?", fr:"Quelle est ta stratégie préférée ?" },
      { who:"aluno", text:"Eu gosto de ficar escondido(a) e atacar no final! Sou paciente! 😏", fr:"J'aime me cacher et attaquer à la fin ! Je suis patient(e) !" },
      { who:"lucas", text:`Boa estratégia, ${n}! Você já ganhou uma partida?`, fr:`Bonne stratégie, ${n} ! Tu as déjà gagné une partie ?` },
      { who:"aluno", text:"Já! Ganhei duas vezes com meu irmão! Ficamos super felizes! 🎉", fr:"Oui ! J'ai gagné deux fois avec mon frère ! On était super contents !" },
      { who:"lucas", text:"Que vitória! Como você comemorou?", fr:"Quelle victoire ! Comment vous avez fêté ça ?" },
      { who:"aluno", text:"A gente gritou muito e acordou minha mãe! Ela ficou brava! 😂", fr:"On a crié très fort et on a réveillé ma mère ! Elle était en colère !" },
    ],
    expressions:[
      { pt:"emocionante", fr:"excitant(e)", example:"Fortnite é muito emocionante!" },
      { pt:"estou melhorando", fr:"je m'améliore", example:"Estou melhorando no jogo." },
      { pt:"ficar escondido(a)", fr:"se cacher", example:"Eu gosto de ficar escondido." },
      { pt:"ganhar / perder", fr:"gagner / perdre", example:"Eu ganhei a partida!" },
      { pt:"ficar bravo(a)", fr:"être en colère", example:"Minha mãe ficou brava." },
    ],
    quiz:[
      { q:"Com quem se joga Fortnite?", q_fr:"Avec qui joue-t-on à Fortnite ?", opts:["Com a irmã","Com o pai","Com o irmão mais velho","Com a mãe"], a:"Com o irmão mais velho" },
      { q:"Qual é a estratégia favorita?", q_fr:"Quelle est la stratégie préférée ?", opts:["Atacar logo no início","Ficar escondido e atacar no final","Correr sempre","Construir muito"], a:"Ficar escondido e atacar no final" },
      { q:"Quantas vezes já ganhou?", q_fr:"Combien de fois a-t-on déjà gagné ?", opts:["Uma vez","Duas vezes","Três vezes","Nunca ganhou"], a:"Duas vezes" },
      { q:"O que aconteceu quando comemoraram?", q_fr:"Que s'est-il passé quand ils ont fêté ?", opts:["A vizinha reclamou","Acordaram a mãe","Quebraram o controle","Nada aconteceu"], a:"Acordaram a mãe" },
      { q:"'Ganhar' em francês é…", q_fr:"Comment dit-on 'ganhar' en français ?", opts:["Perdre","Jouer","Gagner","Tricher"], a:"Gagner" },
    ],
    flashcards:[
      { pt:"Fortnite é muito emocionante!", fr:"Fortnite c'est très excitant !" },
      { pt:"Eu jogo com meu irmão mais velho.", fr:"Je joue avec mon grand frère." },
      { pt:"Eu gosto de ficar escondido(a).", fr:"J'aime me cacher." },
      { pt:"Eu ataco no final da partida.", fr:"J'attaque à la fin de la partie." },
      { pt:"Eu já ganhei duas vezes!", fr:"J'ai déjà gagné deux fois !" },
      { pt:"A gente ficou super feliz!", fr:"On était super contents !" },
      { pt:"A gente gritou muito.", fr:"On a crié très fort." },
      { pt:"Minha mãe ficou brava.", fr:"Ma mère était en colère." },
      { pt:"Estou melhorando no jogo.", fr:"Je m'améliore dans le jeu." },
      { pt:"Meu irmão é melhor que eu.", fr:"Mon frère est meilleur que moi." },
    ],
  },

  // ─── LIÇÃO 7 ───────────────────────────────────────────────
  {
    id:7, title:"Jogos no celular", emoji:"📱", color:"#06b6d4", topic:"Celular e jogos mobile",
    conversation:[
      { who:"lucas", text:`Além de Roblox e Fortnite, você joga no celular também, ${n}?`, fr:`En dehors de Roblox et Fortnite, tu joues aussi sur téléphone, ${n} ?` },
      { who:"aluno", text:"Sim! Jogo muito no celular quando estou no carro ou esperando algo. 📱", fr:"Oui ! Je joue beaucoup sur téléphone quand je suis en voiture ou quand j'attends." },
      { who:"lucas", text:"Que jogos você tem no celular?", fr:"Quels jeux tu as sur ton téléphone ?" },
      { who:"aluno", text:"Tenho Subway Surfers, Among Us e alguns jogos de culinária! 🍳", fr:"J'ai Subway Surfers, Among Us et des jeux de cuisine !" },
      { who:"lucas", text:"Among Us! Você é o impostor ou o tripulante?", fr:"Among Us ! Tu es l'imposteur ou l'équipier ?" },
      { who:"aluno", text:"Eu prefiro ser o impostor! É mais divertido enganar todo mundo! 😈", fr:"Je préfère être l'imposteur ! C'est plus amusant de tromper tout le monde !" },
      { who:"lucas", text:`Haha! Você é esperto(a), ${n}! Seus irmãos jogam com você?`, fr:`Haha ! Tu es malin(e), ${n} ! Tes frères et sœurs jouent avec toi ?` },
      { who:"aluno", text:"Os menores não têm celular ainda. Mas minha irmã mais velha joga comigo! 👧", fr:"Les plus petits n'ont pas encore de téléphone. Mais ma grande sœur joue avec moi !" },
      { who:"lucas", text:"Legal! Quando você não pode jogar no celular?", fr:"Cool ! Quand est-ce que tu n'as pas le droit de jouer sur téléphone ?" },
      { who:"aluno", text:"Na hora do jantar e à noite. Minha mãe guarda o celular às 21h! 😴", fr:"Pendant le dîner et le soir. Ma mère garde le téléphone à 21h !" },
    ],
    expressions:[
      { pt:"quando estou…", fr:"quand je suis…", example:"Jogo quando estou no carro." },
      { pt:"Eu prefiro…", fr:"Je préfère…", example:"Eu prefiro ser o impostor." },
      { pt:"ainda não", fr:"pas encore", example:"Meu irmão não tem celular ainda." },
      { pt:"na hora de…", fr:"pendant / à l'heure de…", example:"Na hora do jantar, sem celular." },
      { pt:"guardar", fr:"garder / ranger", example:"Minha mãe guarda o celular." },
    ],
    quiz:[
      { q:"Quando se joga no celular?", q_fr:"Quand joue-t-on sur le téléphone ?", opts:["Na escola","No carro ou esperando algo","Só à noite","Nunca"], a:"No carro ou esperando algo" },
      { q:"Qual personagem é o favorito no Among Us?", q_fr:"Quel personnage est préféré dans Among Us ?", opts:["O tripulante","O chefe","O impostor","O médico"], a:"O impostor" },
      { q:"Quem joga celular junto?", q_fr:"Qui joue au téléphone ensemble ?", opts:["A irmã mais velha","O irmão mais novo","O pai","A mãe"], a:"A irmã mais velha" },
      { q:"Quando a mãe guarda o celular?", q_fr:"Quand la mère range le téléphone ?", opts:["Às 20h","Às 21h","Às 22h","Às 19h"], a:"Às 21h" },
      { q:"'Celular' em francês é…", q_fr:"Comment dit-on 'celular' en français ?", opts:["Ordinateur","Tablette","Téléphone portable","Console"], a:"Téléphone portable" },
    ],
    flashcards:[
      { pt:"Eu jogo no celular no carro.", fr:"Je joue sur téléphone dans la voiture." },
      { pt:"Eu prefiro ser o impostor!", fr:"Je préfère être l'imposteur !" },
      { pt:"É mais divertido enganar todo mundo.", fr:"C'est plus amusant de tromper tout le monde." },
      { pt:"Minha irmã mais velha joga comigo.", fr:"Ma grande sœur joue avec moi." },
      { pt:"Os menores não têm celular ainda.", fr:"Les plus petits n'ont pas encore de téléphone." },
      { pt:"Minha mãe guarda o celular às 21h.", fr:"Ma mère garde le téléphone à 21h." },
      { pt:"Na hora do jantar não tem celular.", fr:"Pendant le dîner, pas de téléphone." },
      { pt:"Eu jogo quando estou esperando.", fr:"Je joue quand j'attends." },
      { pt:"Eu tenho jogos de culinária no celular.", fr:"J'ai des jeux de cuisine sur mon téléphone." },
      { pt:"À noite eu não posso jogar.", fr:"Le soir je n'ai pas le droit de jouer." },
    ],
  },

  // ─── LIÇÃO 8 ───────────────────────────────────────────────
  {
    id:8, title:"Brincando de queimada", emoji:"🎯", color:"#ef4444", topic:"Brincar e esportes",
    conversation:[
      { who:"lucas", text:`${n}, me conta mais sobre a queimada! Como se joga?`, fr:`${n}, parle-moi plus de la balle brûlée ! Comment on joue ?` },
      { who:"aluno", text:"É um jogo em equipe! Tem dois times e uma bola. O objetivo é acertar o adversário! 🎯", fr:"C'est un jeu d'équipe ! Il y a deux équipes et une balle. Le but c'est de toucher l'adversaire !" },
      { who:"lucas", text:"E quando você é acertado(a), o que acontece?", fr:"Et quand tu es touché(e), qu'est-ce qui se passe ?" },
      { who:"aluno", text:"Você vai para o cemitério — fica fora do campo por um tempo! 😱", fr:"Tu vas au cimetière — tu restes en dehors du terrain pendant un moment !" },
      { who:"lucas", text:`Que nome engraçado, cemitério! Você é bom(boa) na queimada, ${n}?`, fr:`Quel nom drôle, cimetière ! Tu es bon(ne) à la balle brûlée, ${n} ?` },
      { who:"aluno", text:"Sou! Eu corro rápido e desvio bem! Meus irmãos odeiam jogar contra mim! 😂", fr:"Oui ! Je cours vite et j'esquive bien ! Mes frères et sœurs détestent jouer contre moi !" },
      { who:"lucas", text:"Haha! No Brasil a queimada também é muito jogada na escola!", fr:"Haha ! Au Brésil la balle brûlée se joue aussi beaucoup à l'école !" },
      { who:"aluno", text:"Sério? Eu achei que era uma brincadeira só da França!", fr:"Vraiment ? Je croyais que c'était un jeu seulement français !" },
      { who:"lucas", text:"Não! É popular no mundo inteiro. Você joga no jardim de casa?", fr:"Non ! C'est populaire dans le monde entier. Tu joues dans le jardin de ta maison ?" },
      { who:"aluno", text:"Sim! Todo sábado à tarde! É a minha brincadeira favorita! ❤️", fr:"Oui ! Tous les samedis après-midi ! C'est mon jeu préféré !" },
    ],
    expressions:[
      { pt:"em equipe", fr:"en équipe", example:"Queimada é jogada em equipe." },
      { pt:"adversário", fr:"adversaire", example:"Acertei o adversário!" },
      { pt:"correr rápido", fr:"courir vite", example:"Eu corro muito rápido." },
      { pt:"desviar", fr:"esquiver", example:"Eu sei desviar da bola." },
      { pt:"todo sábado", fr:"tous les samedis", example:"Jogo todo sábado." },
    ],
    quiz:[
      { q:"O que é o 'cemitério' na queimada?", q_fr:"Qu'est-ce que le 'cimetière' dans la balle brûlée ?", opts:["O nome do time","Ficar fora do campo","Um gol","Uma punição especial"], a:"Ficar fora do campo" },
      { q:"Por que os irmãos odeiam jogar contra?", q_fr:"Pourquoi les frères et sœurs détestent-ils jouer contre ?", opts:["Faz trapaça","É rápido(a) e desvia bem","Grita muito","Chora quando perde"], a:"É rápido(a) e desvia bem" },
      { q:"Quando se joga queimada?", q_fr:"Quand joue-t-on à la balle brûlée ?", opts:["Todo domingo","Todo sábado à tarde","Toda sexta","Todos os dias"], a:"Todo sábado à tarde" },
      { q:"Onde a queimada é popular?", q_fr:"Où la balle brûlée est-elle populaire ?", opts:["Só na França","Só no Brasil","No mundo inteiro","Só na Bretanha"], a:"No mundo inteiro" },
      { q:"'Equipe' em francês é…", q_fr:"Comment dit-on 'equipe' en français ?", opts:["Joueur","Adversaire","Équipe","Arbitre"], a:"Équipe" },
    ],
    flashcards:[
      { pt:"A queimada é um jogo em equipe.", fr:"La balle brûlée est un jeu d'équipe." },
      { pt:"O objetivo é acertar o adversário.", fr:"Le but c'est de toucher l'adversaire." },
      { pt:"Quando você é acertado(a), vai para o cemitério.", fr:"Quand tu es touché(e), tu vas au cimetière." },
      { pt:"Eu corro rápido e desvio da bola.", fr:"Je cours vite et j'esquive la balle." },
      { pt:"Meus irmãos odeiam jogar contra mim!", fr:"Mes frères et sœurs détestent jouer contre moi !" },
      { pt:"A queimada é popular no mundo inteiro.", fr:"La balle brûlée est populaire dans le monde entier." },
      { pt:"Todo sábado à tarde eu jogo queimada.", fr:"Tous les samedis après-midi je joue à la balle brûlée." },
      { pt:"É a minha brincadeira favorita!", fr:"C'est mon jeu préféré !" },
      { pt:"A gente joga no jardim de casa.", fr:"On joue dans le jardin de la maison." },
      { pt:"Eu sou muito bom(boa) na queimada!", fr:"Je suis très bon(ne) à la balle brûlée !" },
    ],
  },

  // ─── LIÇÃO 9 ───────────────────────────────────────────────
  {
    id:9, title:"O dia a dia em casa", emoji:"🌅", color:"#84cc16", topic:"Rotina diária",
    conversation:[
      { who:"lucas", text:`${n}, como é a sua rotina do dia a dia?`, fr:`${n}, comment est ta routine quotidienne ?` },
      { who:"aluno", text:"De manhã acordo às 7h, tomo café da manhã e vou para a escola. ☀️", fr:"Le matin je me réveille à 7h, je prends le petit-déjeuner et je vais à l'école." },
      { who:"lucas", text:"O que você come no café da manhã?", fr:"Qu'est-ce que tu manges au petit-déjeuner ?" },
      { who:"aluno", text:"Geralmente como torrada com manteiga e bebo chocolate quente! 🍫", fr:"En général je mange une tartine avec du beurre et je bois un chocolat chaud !" },
      { who:"lucas", text:"Que delícia! E depois da escola?", fr:"Que c'est bon ! Et après l'école ?" },
      { who:"aluno", text:"Chego em casa, almoço e faço o dever de casa. Depois brinco! 🏃", fr:"Je rentre à la maison, je déjeune et je fais mes devoirs. Ensuite je joue !" },
      { who:"lucas", text:"Você janta com toda a família?", fr:"Tu dînes avec toute la famille ?" },
      { who:"aluno", text:"Sim! Todo mundo junto na mesa. São oito pessoas! É barulhento! 😄", fr:"Oui ! Tout le monde ensemble à table. On est huit personnes ! C'est bruyant !" },
      { who:"lucas", text:"Oito pessoas! A mesa deve ser enorme!", fr:"Huit personnes ! La table doit être énorme !" },
      { who:"aluno", text:"É sim! E todo mundo fala ao mesmo tempo! Mas eu adoro! 💕", fr:"Oui ! Et tout le monde parle en même temps ! Mais j'adore ça !" },
    ],
    expressions:[
      { pt:"De manhã…", fr:"Le matin…", example:"De manhã eu acordo às 7h." },
      { pt:"Geralmente…", fr:"En général…", example:"Geralmente como torrada." },
      { pt:"depois de…", fr:"après…", example:"Depois da escola, brinco." },
      { pt:"todo mundo junto", fr:"tout le monde ensemble", example:"Jantamos todo mundo junto." },
      { pt:"ao mesmo tempo", fr:"en même temps", example:"Falamos ao mesmo tempo." },
    ],
    quiz:[
      { q:"Que horas se acorda de manhã?", q_fr:"À quelle heure se réveille-t-on le matin ?", opts:["6h","7h","8h","9h"], a:"7h" },
      { q:"O que se bebe no café da manhã?", q_fr:"Que boit-on au petit-déjeuner ?", opts:["Suco de laranja","Leite","Chocolate quente","Água"], a:"Chocolate quente" },
      { q:"O que se faz antes de brincar?", q_fr:"Que fait-on avant de jouer ?", opts:["Dorme","Faz o dever de casa","Joga videogame","Assiste TV"], a:"Faz o dever de casa" },
      { q:"Quantas pessoas jantam juntas?", q_fr:"Combien de personnes dînent ensemble ?", opts:["Seis","Sete","Oito","Nove"], a:"Oito" },
      { q:"'De manhã' em francês é…", q_fr:"Comment dit-on 'De manhã' en français ?", opts:["Le soir","L'après-midi","La nuit","Le matin"], a:"Le matin" },
    ],
    flashcards:[
      { pt:"De manhã eu acordo às 7 horas.", fr:"Le matin je me réveille à 7 heures." },
      { pt:"Eu tomo café da manhã todo dia.", fr:"Je prends le petit-déjeuner tous les jours." },
      { pt:"Geralmente como torrada com manteiga.", fr:"En général je mange une tartine avec du beurre." },
      { pt:"Eu bebo chocolate quente de manhã.", fr:"Je bois un chocolat chaud le matin." },
      { pt:"Depois da escola eu faço o dever.", fr:"Après l'école je fais mes devoirs." },
      { pt:"A gente almoça todo mundo junto.", fr:"On déjeune tous ensemble." },
      { pt:"À noite a gente janta em família.", fr:"Le soir on dîne en famille." },
      { pt:"São oito pessoas na mesa!", fr:"Il y a huit personnes à table !" },
      { pt:"Todo mundo fala ao mesmo tempo!", fr:"Tout le monde parle en même temps !" },
      { pt:"É barulhento, mas eu adoro!", fr:"C'est bruyant, mais j'adore ça !" },
    ],
  },

  // ─── LIÇÃO 10 ───────────────────────────────────────────────
  {
    id:10, title:"Sonhos e o futuro", emoji:"🌟", color:"#a855f7", topic:"Sonhos e o que quer ser",
    conversation:[
      { who:"lucas", text:`${n}, o que você quer ser quando crescer?`, fr:`${n}, qu'est-ce que tu veux être quand tu seras grand(e) ?` },
      { who:"aluno", text:"Hmm... quero ser game designer! Criar meus próprios jogos! 🎮✨", fr:"Hmm... je veux être game designer ! Créer mes propres jeux !" },
      { who:"lucas", text:"Que sonho incrível! Por que você escolheu isso?", fr:"Quel rêve incroyable ! Pourquoi tu as choisi ça ?" },
      { who:"aluno", text:"Porque eu amo jogos e quero criar mundos novos para as crianças explorarem! 🌍", fr:"Parce que j'adore les jeux et je veux créer de nouveaux mondes pour que les enfants explorent !" },
      { who:"lucas", text:"Isso é muito bonito! Você já criou algum jogo pequeno?", fr:"C'est très beau ! Tu as déjà créé un petit jeu ?" },
      { who:"aluno", text:"Ainda não, mas estudo como funciona o Roblox Studio! 💻", fr:"Pas encore, mais j'étudie comment fonctionne Roblox Studio !" },
      { who:"lucas", text:`Roblox Studio! Você está no caminho certo, ${n}!`, fr:`Roblox Studio ! Tu es sur la bonne voie, ${n} !` },
      { who:"aluno", text:"Espero que sim! E você, Lucas? O que você queria ser quando era pequeno?", fr:"J'espère que oui ! Et toi, Lucas ? Qu'est-ce que tu voulais être quand tu étais petit ?" },
      { who:"lucas", text:"Queria ser jogador de futebol! Mas virei professor. E estou muito feliz! ⚽😄", fr:"Je voulais être joueur de football ! Mais je suis devenu professeur. Et je suis très heureux !" },
      { who:"aluno", text:"Que legal! Um dia vou te mostrar meu jogo! Prometo! 🤞", fr:"C'est super ! Un jour je te montrerai mon jeu ! Je te le promets !" },
    ],
    expressions:[
      { pt:"Quero ser…", fr:"Je veux être…", example:"Quero ser game designer." },
      { pt:"Quando crescer…", fr:"Quand je serai grand(e)…", example:"Quando crescer, vou criar jogos." },
      { pt:"ainda não", fr:"pas encore", example:"Ainda não criei um jogo." },
      { pt:"estou no caminho certo", fr:"je suis sur la bonne voie", example:"Você está no caminho certo!" },
      { pt:"Prometo!", fr:"Je te le promets !", example:"Um dia te mostro. Prometo!" },
    ],
    quiz:[
      { q:`O que ${n} quer ser quando crescer?`, q_fr:`Que veut devenir ${n} quand il/elle sera grand(e) ?`, opts:["Professor(a)","Médico(a)","Game designer","Jogador(a) de futebol"], a:"Game designer" },
      { q:"Por que quer criar jogos?", q_fr:"Pourquoi veut-il/elle créer des jeux ?", opts:["Para ganhar dinheiro","Para criar mundos para crianças explorarem","Para competir com Roblox","Para ficar famoso(a)"], a:"Para criar mundos para crianças explorarem" },
      { q:"O que se estuda para aprender a criar jogos?", q_fr:"Qu'apprend-on pour apprendre à créer des jeux ?", opts:["Programação Python","Unity","Roblox Studio","Minecraft Editor"], a:"Roblox Studio" },
      { q:"O que Lucas queria ser quando pequeno?", q_fr:"Que voulait être Lucas quand il était petit ?", opts:["Médico","Professor","Jogador de futebol","Astronauta"], a:"Jogador de futebol" },
      { q:"O que foi prometido para Lucas?", q_fr:"Qu'est-ce qui a été promis à Lucas ?", opts:["Enviar crepe","Visitar o Brasil","Mostrar o jogo que criar","Ensinar queimada"], a:"Mostrar o jogo que criar" },
    ],
    flashcards:[
      { pt:`Quando crescer, quero ser game designer.`, fr:"Quand je serai grand(e), je veux être game designer." },
      { pt:"Eu quero criar meus próprios jogos.", fr:"Je veux créer mes propres jeux." },
      { pt:"Eu amo criar mundos novos.", fr:"J'adore créer de nouveaux mondes." },
      { pt:"Ainda não criei um jogo.", fr:"Je n'ai pas encore créé de jeu." },
      { pt:"Eu estudo o Roblox Studio.", fr:"J'étudie Roblox Studio." },
      { pt:"Você está no caminho certo!", fr:"Tu es sur la bonne voie !" },
      { pt:"Lucas queria ser jogador de futebol.", fr:"Lucas voulait être joueur de football." },
      { pt:"Ele virou professor e está feliz.", fr:"Il est devenu professeur et il est heureux." },
      { pt:"Um dia vou te mostrar meu jogo!", fr:"Un jour je te montrerai mon jeu !" },
      { pt:"Eu prometo, Lucas!", fr:"Je te le promets, Lucas !" },
    ],
  },
  ];
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
function shuffle(a){ return [...a].sort(()=>Math.random()-0.5); }

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════
const AVATARS = ["🐸","🦊","🐼","🦁","🐧","🦄","🐙","🐻","🦋","🐬"];

// Banco em memória — será substituído por Supabase na produção
const MOCK_DB = {
  users: {
    // Seeds de demonstração para o ranking global ficar interessante
    "alice@demo.com":  { id:"u1", email:"alice@demo.com",  password:"demo", name:"Alice",   avatar_id:1, friend_code:"ALIC-1001", stats:{ baguettes:320, correct_answers:32, time_spent_seconds:900  }, friends:[] },
    "bob@demo.com":    { id:"u2", email:"bob@demo.com",    password:"demo", name:"Bob",     avatar_id:3, friend_code:"BOBB-1002", stats:{ baguettes:210, correct_answers:21, time_spent_seconds:600  }, friends:[] },
    "camille@demo.com":{ id:"u3", email:"camille@demo.com",password:"demo", name:"Camille", avatar_id:6, friend_code:"CAMI-1003", stats:{ baguettes:180, correct_answers:18, time_spent_seconds:540  }, friends:[] },
    "diego@demo.com":  { id:"u4", email:"diego@demo.com",  password:"demo", name:"Diego",   avatar_id:0, friend_code:"DIEG-1004", stats:{ baguettes:150, correct_answers:15, time_spent_seconds:450  }, friends:[] },
    "emma@demo.com":   { id:"u5", email:"emma@demo.com",   password:"demo", name:"Emma",    avatar_id:8, friend_code:"EMMO-1005", stats:{ baguettes:120, correct_answers:12, time_spent_seconds:360  }, friends:[] },
    "felix@demo.com":  { id:"u6", email:"felix@demo.com",  password:"demo", name:"Félix",   avatar_id:2, friend_code:"FELI-1006", stats:{ baguettes:90,  correct_answers:9,  time_spent_seconds:270  }, friends:[] },
    "grace@demo.com":  { id:"u7", email:"grace@demo.com",  password:"demo", name:"Grace",   avatar_id:9, friend_code:"GRAC-1007", stats:{ baguettes:60,  correct_answers:6,  time_spent_seconds:180  }, friends:[] },
  }
};

function genFriendCode(name) {
  const prefix = (name || "USER").slice(0,4).toUpperCase().padEnd(4,"X");
  return prefix + "-" + Math.floor(1000 + Math.random() * 9000);
}

// ═══════════════════════════════════════════════════════════════
//  AUTH SCREEN
// ═══════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [avatarId, setAvatarId] = useState(0);
  const [lang, setLang]         = useState("pt");
  const [error, setError]       = useState("");

  function handleSubmit() {
    setError("");
    (async () => {
      try {
        if (mode === "signup") {
          if (!name.trim())  { setError("Digite seu nome."); return; }
          if (!email.trim()) { setError("Digite seu e-mail."); return; }
          if (password.length < 6) { setError("Senha: mínimo 6 caracteres."); return; }
          if (!hasSupabase) {
            setError("Supabase não está configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
            return;
          }
          // Supabase signup
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) {
            const message = error.message || "Erro no cadastro";
            if (/rate limit|too many requests|email limit|email rate/i.test(message)) {
              setError("Não foi possível enviar o e-mail agora. Tente novamente em breve.");
            } else {
              setError(message);
            }
            return;
          }
          const authUser = data?.user || data?.session?.user;
          const userId = authUser?.id || data?.user?.id || data?.session?.user?.id;
          if (!userId) {
            setError("Cadastro realizado. Verifique seu e-mail para confirmar a conta.");
            return;
          }
          const profile = { id: userId, email, name: name.trim(), avatar_id: avatarId, stats: { baguettes:0, correct_answers:0, time_spent_seconds:0 } };
          await upsertProfile(profile).catch(e => {
            console.warn('Falha ao criar profile no Supabase:', e);
          });
          onAuth(profile);
        } else {
          if (!email.trim() || !password) { setError("Preencha e-mail e senha."); return; }
          if (!hasSupabase) {
            setError("Supabase não está configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
            return;
          }
          const res = await signInWithPassword(email, password);
          const authUser = res?.user || res?.session?.user;
          if (!authUser) {
            setError("Falha ao autenticar. Tente novamente.");
            return;
          }
          const userId = authUser.id;
          const profile = await getProfile(userId) || { id: userId, email, name: authUser.user_metadata?.name || email, avatar_id: authUser.user_metadata?.avatar_id || 0, stats: { baguettes:0, correct_answers:0, time_spent_seconds:0 } };
          onAuth(profile);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      }
    })();
    return;
  }

  function handleGuestLogin() {
    setError("");
    const guestUser = {
      id: `guest-${Date.now()}`,
      email: "visitante@demo.local",
      password: "",
      name: "",
      avatar_id: 0,
      language_preference: lang,
      friend_code: "GUEST-0000",
      stats: { baguettes:0, correct_answers:0, time_spent_seconds:0 },
      friends: []
    };
    onAuth(guestUser);
  }

  return (
    <div style={ob.page}>
      <div style={ob.glow1}/><div style={ob.glow2}/>
      <div style={ob.card}>
        <div style={ob.emoji}>{mode === "login" ? "🔑" : "🌟"}</div>
        <h1 style={ob.title}>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p style={ob.sub}>{mode === "login" ? "Bem-vindo(a) de volta!" : "Vamos aprender português!"}</p>

        {mode === "signup" && (
          <div style={{width:"100%"}}>
            <p style={ob.label}>Seu nome</p>
            <input style={ob.input} placeholder="Ex: Ária"
              value={name} onChange={e => setName(e.target.value)} maxLength={30}/>
            <p style={ob.label}>Escolha seu avatar</p>
            <div style={au.avatarGrid}>
              {AVATARS.map((av, i) => (
                <button key={i} type="button"
                  style={{...au.avatarBtn, ...(avatarId === i ? au.avatarSel : {})}}
                  onClick={() => setAvatarId(i)}>{av}</button>
              ))}
            </div>
            <p style={ob.label}>Idioma preferido</p>
            <div style={au.langRow}>
              <button type="button" style={{...au.langBtn, ...(lang === "pt" ? au.langSel : {})}} onClick={() => setLang("pt")}>🇧🇷 Português</button>
              <button type="button" style={{...au.langBtn, ...(lang === "fr" ? au.langSel : {})}} onClick={() => setLang("fr")}>🇫🇷 Français</button>
            </div>
          </div>
        )}

        <div style={{width:"100%"}}>
          <p style={ob.label}>E-mail</p>
          <input style={ob.input} type="email" placeholder="seu@email.com"
            value={email} onChange={e => setEmail(e.target.value)}/>
          <p style={ob.label}>Senha</p>
          <input style={ob.input} type="password" placeholder="Mínimo 6 caracteres"
            value={password} onChange={e => setPassword(e.target.value)}/>
          {error && <p style={au.error}>⚠️ {error}</p>}
          <button
            style={ob.btn}
            onClick={handleSubmit}
          >
            {mode === "login" ? "Entrar →" : "Criar conta →"}
          </button>
          {mode === "login" && (
            <button style={ob.altBtn} type="button" onClick={handleGuestLogin}>
              Entrar como visitante / Entrer comme visiteur
            </button>
          )}
        </div>

        <button style={ob.back} onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); }}>
          {mode === "login" ? "Não tem conta? Criar agora" : "Já tenho conta → Entrar"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ONBOARDING
// ═══════════════════════════════════════════════════════════════
function OnboardingScreen({ user, onDone }) {
  const [nome, setNome]   = useState(user && user.name ? user.name : "");
  const [idade, setIdade] = useState("");
  const [step, setStep]   = useState(user && user.name ? 1 : 0);

  function submitNome()  { if (nome.trim()) setStep(1); }
  function submitIdade() {
    const v = parseInt(idade);
    if (!Number.isNaN(v) && v >= 0 && v <= 80) setStep(2);
  }

  return (
    <div style={ob.page}>
      <div style={ob.glow1}/><div style={ob.glow2}/>
      <div style={ob.card}>
        {step === 0 && (
          <div style={{width:"100%",textAlign:"center"}}>
            <div style={ob.emoji}>👋</div>
            <h1 style={ob.title}>Como posso te chamar?</h1>
            <p style={ob.sub}>Vou usar seu nome nas aulas com o Lucas!</p>
            <p style={ob.label}>Seu nome</p>
            <input style={ob.input} placeholder="Digite seu nome…"
              value={nome} onChange={e => setNome(e.target.value)} maxLength={30}/>
            <button style={{...ob.btn, opacity: nome.trim().length < 1 ? .5 : 1}}
              onClick={submitNome} disabled={nome.trim().length < 1}>Continuar →</button>
          </div>
        )}
        {step === 1 && (
          <div style={{width:"100%",textAlign:"center"}}>
            <div style={ob.emoji}>🎂</div>
            <h1 style={ob.title}>Oi, {nome}!</h1>
            <p style={ob.sub}>Quantos anos você tem?</p>
            <p style={ob.label}>Sua idade</p>
            <input style={ob.input} placeholder="Ex: 10"
              value={idade} onChange={e => setIdade(e.target.value.replace(/\D/g, ""))}
              maxLength={2} inputMode="numeric"/>
            <button style={{...ob.btn, opacity: idade === "" || parseInt(idade) < 0 || parseInt(idade) > 80 ? .5 : 1}}
              onClick={submitIdade} disabled={idade === "" || parseInt(idade) < 0 || parseInt(idade) > 80}>
              Continuar →</button>
            {!(user && user.name) && (
              <button style={ob.back} onClick={() => setStep(0)}>← Voltar</button>
            )}
          </div>
        )}
        {step === 2 && (
          <div style={{width:"100%",textAlign:"center"}}>
            <div style={ob.emoji}>🚀</div>
            <h1 style={ob.title}>Tudo pronto, {nome}!</h1>
            <div style={ob.profileCard}>
              <div style={ob.profileRow}><span style={ob.profileLabel}>👤 Nome:</span><span style={ob.profileVal}>{nome}</span></div>
              <div style={ob.profileRow}><span style={ob.profileLabel}>🎂 Idade:</span><span style={ob.profileVal}>{idade} anos</span></div>
              <div style={ob.profileRow}><span style={ob.profileLabel}>👨‍🏫 Professor:</span><span style={ob.profileVal}>Lucas 🇧🇷</span></div>
            </div>
            <button style={ob.btn} onClick={() => onDone(nome.trim(), idade)}>Começar as aulas! 🎮</button>
            <button style={ob.back} onClick={() => setStep(1)}>← Voltar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  RANKING SCREEN
// ═══════════════════════════════════════════════════════════════
const MEDALS = ["🥇","🥈","🥉"];
const TOP3_COLORS = ["#fbbf24","#94a3b8","#cd7f32"];
const TOP3_BG     = ["rgba(251,191,36,.15)","rgba(148,163,184,.1)","rgba(205,127,50,.12)"];

function RankingScreen({ currentUser, onBack }) {
  const [tab, setTab] = useState("global"); // global | amigos
  const [externalList, setExternalList] = useState(null);

  const allUsers   = Object.values(MOCK_DB.users);
  const globalList = externalList ? externalList : [...allUsers]
    .sort((a, b) => (b.stats?.baguettes || 0) - (a.stats?.baguettes || 0))
    .slice(0, 10);

  const friendIds  = new Set((currentUser?.friends || []).map(f => f.id));
  const friendList = [...allUsers]
    .filter(u => u.id === currentUser?.id || friendIds.has(u.id))
    .sort((a, b) => (b.stats?.baguettes || 0) - (a.stats?.baguettes || 0));

  const list = tab === "global" ? globalList : friendList;

  useEffect(() => {
    if (!hasSupabase) return;
    (async () => {
      try {
        const top = await getTopRanking(10);
        if (top && top.length) setExternalList(top.map((t,i)=>({ id:t.id, name:t.name, avatar_id:t.avatar_id||0, stats: t.stats || {} })));
      } catch(e) { console.warn('Failed to load ranking from Supabase', e); }
    })();
  }, []);

  function myRankGlobal() {
    const sorted = [...allUsers].sort((a,b)=>(b.stats?.baguettes||0)-(a.stats?.baguettes||0));
    return sorted.findIndex(u => u.id === currentUser?.id) + 1;
  }

  return (
    <div style={rk.page}>
      <div style={rk.header}>
        <button style={rk.backBtn} onClick={onBack}>← Voltar</button>
        <span style={rk.title}>🏆 Ranking</span>
        <span style={{width:60}}/>
      </div>

      <div style={rk.myBadge}>
        <span style={rk.myAv}>{AVATARS[currentUser?.avatar_id || 0]}</span>
        <div>
          <p style={rk.myName}>{currentUser?.name || "Você"}</p>
          <p style={rk.mySub}>🥖 {currentUser?.stats?.baguettes || 0} baguetes · #{myRankGlobal()}º global</p>
        </div>
      </div>

      <div style={rk.tabs}>
        {["global","amigos"].map(t => (
          <button key={t} style={{...rk.tab,...(tab===t?rk.tabActive:{})}} onClick={() => setTab(t)}>
            {t === "global" ? "🌍 Global" : "👥 Amigos"}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <p style={rk.empty}>Nenhum amigo ainda.<br/>Adicione amigos pelo seu código no Perfil!</p>
      )}

      <div style={rk.list}>
        {list.map((u, i) => {
          const isTop3   = i < 3;
          const isMe     = u.id === currentUser?.id;
          const baguettes = u.stats?.baguettes || 0;
          return (
            <div key={u.id} style={{
              ...rk.row,
              ...(isTop3 ? { background: TOP3_BG[i], border:`1px solid ${TOP3_COLORS[i]}44` } : {}),
              ...(isMe   ? rk.rowMe : {}),
            }}>
              <div style={rk.rankCol}>
                {isTop3
                  ? <span style={{...rk.medal, color: TOP3_COLORS[i]}}>{MEDALS[i]}</span>
                  : <span style={rk.rankNum}>#{i+1}</span>
                }
              </div>
              <span style={rk.avatar}>{AVATARS[u.avatar_id || 0]}</span>
              <div style={rk.info}>
                <span style={{...rk.name, ...(isMe ? rk.nameMe : {})}}>{u.name}{isMe ? " (você)" : ""}</span>
                <span style={rk.baguettes}>🥖 {baguettes.toLocaleString()}</span>
              </div>
              {isTop3 && (
                <div style={{...rk.crown, color: TOP3_COLORS[i]}}>
                  {i === 0 ? "👑" : i === 1 ? "⭐" : "✨"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════
function ProfileScreen({ user, student, stats, onBack, onLogout, onAvatarChange, availableVoices = [], selectedVoiceName, onSelectVoice }) {
  const [tab, setTab]         = useState("perfil");
  const [addCode, setAddCode] = useState("");
  const [addMsg, setAddMsg]   = useState("");
  const [avatarId, setAvatarId] = useState(user?.avatar_id || 0);

  function saveAvatar(id) {
    setAvatarId(id);
    if (user) { user.avatar_id = id; onAvatarChange(id); }
  }

  function sendFriendRequest() {
    setAddMsg("");
    const code = addCode.trim().toUpperCase();
    if (!code) return;
    const found = Object.values(MOCK_DB.users).find(u => u.friend_code === code);
    if (!found)             { setAddMsg("⚠️ Código não encontrado."); return; }
    if (found.id === user.id) { setAddMsg("⚠️ Não pode se adicionar."); return; }
    if (!user.friends) user.friends = [];
    if (user.friends.find(f => f.id === found.id)) { setAddMsg("⚠️ Já é seu amigo!"); return; }
    user.friends.push({ id:found.id, name:found.name, avatar_id:found.avatar_id });
    // Add reverse friendship too
    if (!found.friends) found.friends = [];
    if (!found.friends.find(f => f.id === user.id)) {
      found.friends.push({ id:user.id, name:user.name, avatar_id:user.avatar_id });
    }
    setAddMsg("✅ " + found.name + " adicionado(a)!");
    setAddCode("");
  }

  const friends = user?.friends || [];

  return (
    <div style={pr.page}>
      <div style={pr.header}>
        <button style={pr.backBtn} onClick={onBack}>← Voltar</button>
        <span style={pr.headerTitle}>Meu Perfil</span>
        <button style={pr.logoutBtn} onClick={onLogout}>Sair</button>
      </div>

      <div style={pr.hero}>
        <div style={pr.avatarBig}>{AVATARS[avatarId]}</div>
        <p style={pr.heroName}>{student?.nome || user?.name}</p>
        <p style={pr.heroEmail}>{user?.email}</p>
        <div style={pr.codeBox}>
          <span style={pr.codeLabel}>Seu código de amigo:</span>
          <span style={pr.codeVal}>{user?.friend_code || "—"}</span>
        </div>
      </div>

      <div style={pr.tabs}>
        {["perfil","avatar","amigos"].map(t => (
          <button key={t} style={{...pr.tab,...(tab===t?pr.tabActive:{})}} onClick={() => setTab(t)}>
            {t==="perfil" ? "📊 Stats" : t==="avatar" ? "🎨 Avatar" : "👥 Amigos"}
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <div style={pr.section}>
          <div style={pr.statGrid}>
            <div style={pr.statCard}><span style={pr.statBig}>🥖</span><span style={pr.statNum}>{stats?.baguettes||0}</span><span style={pr.statLbl}>Baguetes</span></div>
            <div style={pr.statCard}><span style={pr.statBig}>✅</span><span style={pr.statNum}>{stats?.correct_answers||0}</span><span style={pr.statLbl}>Acertos</span></div>
            <div style={pr.statCard}><span style={pr.statBig}>⏱️</span><span style={pr.statNum}>{Math.round((stats?.time_spent_seconds||0)/60)}</span><span style={pr.statLbl}>Minutos</span></div>
          </div>
          <div style={{marginTop:16}}>
            <p style={{color:"rgba(255,255,255,0.7)",fontSize:13,marginBottom:8}}>Voz TTS (Português)</p>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <select value={selectedVoiceName||""} onChange={e => onSelectVoice && onSelectVoice(e.target.value)} style={{flex:1,padding:10,borderRadius:8,background:"rgba(255,255,255,0.06)",color:"#fff",border:"1px solid rgba(255,255,255,0.12)"}}>
                <option value="">(padrão do sistema)</option>
                {availableVoices.map((v,i)=> (
                  <option key={i} value={v.name}>{v.name} — {v.lang}</option>
                ))}
              </select>
              <button style={{padding:"8px 12px",borderRadius:10,background:"rgba(255,255,255,0.06)",color:"#fff",border:"1px solid rgba(255,255,255,0.12)"}} onClick={() => {
                // quick test speak
                const speak = (window.__speakPortuguese || speakPortuguese);
                speak && speak("Teste de voz. Olá!");
              }}>▶ Testar</button>
            </div>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:12,marginTop:8}}>Dica: se a voz não agradar, instale vozes do sistema (macOS: Acessibilidade → Spoken Content → Voices).</p>
          </div>
        </div>
      )}

      {tab === "avatar" && (
        <div style={pr.section}>
          <p style={pr.addTitle}>Escolha seu avatar</p>
          <div style={au.avatarGridLarge}>
            {AVATARS.map((av, i) => (
              <button key={i} type="button"
                style={{...au.avatarBtnLarge,...(avatarId===i?au.avatarSelLarge:{})}}
                onClick={() => saveAvatar(i)}>
                <span style={{fontSize:36}}>{av}</span>
                {avatarId === i && <span style={au.avatarCheck}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "amigos" && (
        <div style={pr.section}>
          <div style={pr.addBox}>
            <p style={pr.addTitle}>➕ Adicionar amigo</p>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:12,margin:"0 0 10px"}}>
              Peça o código do amigo (ex: ARIA-4821) e cole abaixo
            </p>
            <div style={pr.addRow}>
              <input style={pr.addInput} placeholder="XXXX-0000"
                value={addCode} onChange={e => setAddCode(e.target.value.toUpperCase())} maxLength={9}/>
              <button style={pr.addBtn} onClick={sendFriendRequest}>Enviar</button>
            </div>
            {addMsg && <p style={pr.addMsg}>{addMsg}</p>}
          </div>
          {friends.length === 0
            ? <p style={pr.emptyFriends}>Nenhum amigo ainda. Compartilhe seu código! 👆</p>
            : friends.map((f, i) => (
              <div key={i} style={pr.friendRow}>
                <span style={pr.friendAv}>{AVATARS[f.avatar_id || 0]}</span>
                <span style={pr.friendName}>{f.name}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

function ConversationView({ lesson, nome, onDone }){
  const [shown, setShown] = useState(1);
  const [flipped, setFlipped] = useState({});
  const total = lesson.conversation.length;

  function reveal(){ if(shown < total) setShown(s=>s+1); }
  function toggleFlip(i){ setFlipped(f=>({...f,[i]:!f[i]})); }

  return (
    <div style={cv.wrap}>
      <div style={cv.expBox}>
        <p style={cv.expTitle}>💬 Expressões desta lição:</p>
        <div style={cv.expList}>
          {lesson.expressions.map((e,i)=>(
            <div key={i} style={cv.expItem}>
              <span style={cv.expPt}>{e.pt}</span>
              <span style={cv.expArrow}>→</span>
              <span style={cv.expFr}>{e.fr}</span>
              <span style={cv.expEg}>ex: {e.example}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={cv.bubbles}>
        {lesson.conversation.slice(0,shown).map((msg,i)=>{
          const isL = msg.who==="lucas";
          return (
            <div key={i} style={{...cv.row, justifyContent: isL?"flex-start":"flex-end"}}>
              {isL && <span style={cv.ava}>👨‍🏫</span>}
              <div style={{maxWidth:"75%"}}>
                <div style={{...cv.bubble, ...(isL?cv.bL:cv.bA)}} onClick={()=>toggleFlip(i)}>
                  <div style={cv.bubbleHeader}>
                    <span style={cv.bName}>{isL?`🇧🇷 Lucas`:`🌍 ${nome}`}</span>
                    <button
                      type="button"
                      style={cv.audioBtn}
                      onClick={e => { e.stopPropagation(); (window.__speakPortuguese || speakPortuguese)(msg.text); }}
                    >🔊</button>
                  </div>
                  <p style={cv.bText}>{msg.text}</p>
                  {flipped[i] && <p style={cv.bFr}>🇫🇷 {msg.fr}</p>}
                  <span style={cv.bHint}>{flipped[i]?"▲ esconder":"▼ ver em francês"}</span>
                </div>
              </div>
              {!isL && <span style={cv.ava}>🧑‍🎓</span>}
            </div>
          );
        })}
      </div>

      {shown < total
        ? <button style={cv.nextMsg} onClick={reveal}>Próxima fala ▶</button>
        : <button style={cv.doneBtn} onClick={onDone}>Ir para os Flashcards! 🃏</button>
      }
    </div>
  );
}

function FlashcardsView({ lesson, onDone }){
  const cards = lesson.flashcards;
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  function next(){
    setFlipped(false);
    setTimeout(()=>{ if(idx+1>=cards.length){ setDone(true); } else setIdx(i=>i+1); },120);
  }
  function prev(){
    if(idx===0) return;
    setFlipped(false);
    setTimeout(()=>setIdx(i=>i-1),120);
  }

  if(done) return (
    <div style={fc.doneWrap}>
      <div style={fc.doneEmoji}>🃏✨</div>
      <p style={fc.doneTxt}>Você estudou todos os {cards.length} flashcards!</p>
      <button style={fc.goQuiz} onClick={onDone}>Hora do Quiz! 🚀</button>
    </div>
  );

  const c = cards[idx];
  return (
    <div style={fc.wrap}>
      <p style={fc.counter}>{idx+1} / {cards.length}</p>
      <div style={fc.cardOuter} onClick={()=>setFlipped(f=>!f)}>
        <div style={{...fc.cardInner, transform: flipped?"rotateY(180deg)":"rotateY(0deg)"}}>
          <div style={fc.front}>
            <div style={fc.flashcardHeader}>
              <span style={fc.flag}>🇧🇷</span>
              <button
                type="button"
                style={fc.audioBtn}
                onClick={e => { e.stopPropagation(); (window.__speakPortuguese || speakPortuguese)(c.pt); }}
              >🔊</button>
            </div>
            <p style={fc.word}>{c.pt}</p>
            <span style={fc.tap}>Toque para ver em francês</span>
          </div>
          <div style={fc.back}>
            <span style={fc.flag}>🇫🇷</span>
            <p style={fc.word}>{c.fr}</p>
            <span style={fc.tap}>Toque para voltar</span>
          </div>
        </div>
      </div>
      <div style={fc.btns}>
        <button style={{...fc.nav, opacity: idx===0?.4:1}} onClick={prev} disabled={idx===0}>◀ Anterior</button>
        <button style={fc.nav} onClick={next}>{idx+1<cards.length?"Próxima ▶":"Terminar ✅"}</button>
      </div>
    </div>
  );
}

function QuizView({ lesson, nome, onDone }){
  const [questions] = useState(()=>shuffle(lesson.quiz));
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState([]);
  const [finished, setFinished] = useState(false);
  const [showFr, setShowFr] = useState(false);
  const [opts] = useState(()=>questions.map(q=>shuffle(q.opts)));

  function pick(o){
    if(sel!==null) return;
    setSel(o);
    if(o===questions[qi].a) setScore(s=>s+1);
    else setWrongs(w=>[...w,{q:questions[qi].q, correct:questions[qi].a, given:o}]);
  }
  function next(){
    setSel(null);
    setShowFr(false);
    if(qi+1>=questions.length) setFinished(true);
    else setQi(i=>i+1);
  }

  if(finished){
    const pct = Math.round(score/questions.length*100);
    const medal = pct===100?"🏆":pct>=70?"🥈":"🥉";
    return (
      <div style={qv.result}>
        <div style={{fontSize:56,textAlign:"center"}}>{medal}</div>
        <p style={qv.resTitle}>{score}/{questions.length} corretas — {pct}%</p>
        <p style={qv.resMsg}>{pct===100?`Perfeito, ${nome}! Você dominou esta lição!`:pct>=70?`Muito bem, ${nome}! Continue assim!`:`Releia a conversa e tente de novo, ${nome}!`}</p>
        {wrongs.length>0 && (
          <div style={qv.wrongBox}>
            <p style={qv.wrongTitle}>📝 Para revisar:</p>
            {wrongs.map((w,i)=>(
              <div key={i} style={qv.wrongItem}>
                <span style={qv.wrongQ}>{w.q}</span>
                <span style={qv.wrongA}>✅ {w.correct}</span>
              </div>
            ))}
          </div>
        )}
        <button style={qv.doneBtn} onClick={()=>onDone(score, questions.length)}>Concluir lição ✅</button>
      </div>
    );
  }

  const q = questions[qi];
  const isOk = sel===q.a;
  return (
    <div style={qv.wrap}>
      <div style={qv.top}>
        <span style={qv.counter}>Pergunta {qi+1}/{questions.length}</span>
        <span style={qv.pts}>⭐ {score}</span>
      </div>
      <div style={qv.bar}><div style={{...qv.barFill,width:`${(qi/questions.length)*100}%`}}/></div>
      <p style={qv.qText}>{q.q}</p>
      <div style={qv.translateRow}>
        <button type="button" style={qv.translateBtn} onClick={() => setShowFr(s => !s)}>
          {showFr ? "Ocultar pergunta em francês" : "Ver pergunta em francês"}
        </button>
      </div>
      {showFr && (
        <p style={qv.qFrText}>{q.q_fr || "Tradução não disponível."}</p>
      )}
      <div style={qv.opts}>
        {opts[qi].map((o,i)=>{
          let st = qv.opt;
          if(sel!==null){
            if(o===q.a) st={...qv.opt,...qv.optOk};
            else if(o===sel) st={...qv.opt,...qv.optBad};
            else st={...qv.opt,...qv.optFade};
          }
          return(
            <button key={i} style={st} onClick={()=>pick(o)} disabled={sel!==null}>
              {sel!==null && o===q.a && "✅ "}
              {sel!==null && o===sel && o!==q.a && "❌ "}
              {o}
            </button>
          );
        })}
      </div>
      {sel!==null && (
        <>
          <div style={{...qv.fb,...(isOk?qv.fbOk:qv.fbBad)}}>
            {isOk?`🌟 Correto! Muito bem, ${nome}!`:` A resposta certa era: "${q.a}"`}
          </div>
          <button style={qv.next} onClick={next}>
            {qi+1<questions.length?"Próxima ➡":"Ver resultado 🎉"}
          </button>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
//  GRAMMAIRE — injected below, component defined above App
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  GRAMMAIRE SCREEN — Gramática Portuguesa para franceses
// ═══════════════════════════════════════════════════════════════

const GRAM_MODULES = [
  { id:"present",  emoji:"⚡", title:"Presente",        fr:"Présent",           color:"#f97316", desc:"Verbos no presente do indicativo" },
  { id:"passe",    emoji:"⏳", title:"Passado",          fr:"Passé",             color:"#8b5cf6", desc:"Passado simples e imperfeito" },
  { id:"futur",    emoji:"🚀", title:"Futuro",           fr:"Futur",             color:"#3b82f6", desc:"Como falar sobre o futuro" },
  { id:"serstar",  emoji:"⚖️", title:"Ser vs Estar",     fr:"Être (deux formes)",color:"#ec4899", desc:"A diferença mais importante do português" },
  { id:"verbos",   emoji:"📚", title:"Verbos Essenciais",fr:"Verbes essentiels", color:"#10b981", desc:"Os verbos mais usados no dia a dia" },
  { id:"erros",    emoji:"🚫", title:"Erros Comuns",     fr:"Erreurs fréquentes",color:"#ef4444", desc:"Armadilhas para quem fala francês" },
  { id:"pronunc",  emoji:"🔊", title:"Pronúncia",        fr:"Prononciation",     color:"#fbbf24", desc:"Sons difíceis para franceses" },
];

// ── helpers ──────────────────────────────────────────────────
const G = {
  page:{fontFamily:"'Georgia',serif",color:"#fff",minHeight:"100vh",background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)",paddingBottom:48},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"rgba(0,0,0,0.3)",borderBottom:"1px solid rgba(255,255,255,0.08)"},
  backBtn:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13,fontFamily:"'Georgia',serif"},
  headerTitle:{color:"#fff",fontWeight:"bold",fontSize:17},
  heroBox:{textAlign:"center",padding:"24px 16px 16px"},
  heroEmoji:{fontSize:48,display:"block",marginBottom:8},
  heroTitle:{color:"#fff",fontSize:22,fontWeight:"bold",margin:"0 0 4px",background:"linear-gradient(90deg,#10b981,#3b82f6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  heroSub:{color:"rgba(255,255,255,0.5)",fontSize:13,margin:0},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:12,padding:"8px 14px"},
  card:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:18,padding:"18px 14px",cursor:"pointer",transition:"transform .15s",userSelect:"none"},
  cardEmoji:{fontSize:30,display:"block",marginBottom:8},
  cardTitle:{color:"#fff",fontSize:15,fontWeight:"bold",margin:"0 0 2px"},
  cardFr:{color:"rgba(255,255,255,0.45)",fontSize:11,margin:"0 0 6px",fontStyle:"italic"},
  cardDesc:{color:"rgba(255,255,255,0.4)",fontSize:11,lineHeight:1.4},
  // detail page
  detailPage:{fontFamily:"'Georgia',serif",color:"#fff",minHeight:"100vh",background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)",paddingBottom:48},
  section:{padding:"16px 14px",maxWidth:520,margin:"0 auto"},
  sectionTitle:{color:"#fbbf24",fontWeight:"bold",fontSize:13,margin:"0 0 10px",textTransform:"uppercase",letterSpacing:1},
  // explanation box
  explBox:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:14,padding:"14px 16px",marginBottom:14},
  explTitle:{color:"#fff",fontWeight:"bold",fontSize:15,margin:"0 0 6px"},
  explText:{color:"rgba(255,255,255,0.7)",fontSize:14,lineHeight:1.6,margin:0},
  explFr:{color:"#93c5fd",fontSize:13,fontStyle:"italic",margin:"6px 0 0",lineHeight:1.5},
  // table
  table:{width:"100%",borderCollapse:"collapse",marginBottom:14},
  th:{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:"bold",textAlign:"left",padding:"6px 10px",borderBottom:"1px solid rgba(255,255,255,0.1)",textTransform:"uppercase",letterSpacing:0.5},
  td:{color:"#fff",fontSize:14,padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)"},
  tdHighlight:{color:"#a78bfa",fontWeight:"bold"},
  // example card
  exCard:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px",marginBottom:8},
  exPt:{color:"#fff",fontSize:15,fontWeight:"bold",margin:"0 0 2px"},
  exFr:{color:"#93c5fd",fontSize:13,fontStyle:"italic",margin:0},
  // comparison
  compRow:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10},
  compBox:{borderRadius:12,padding:"12px",textAlign:"center"},
  compOk:{background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)"},
  compErr:{background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)"},
  compLabel:{fontSize:11,fontWeight:"bold",marginBottom:4,display:"block"},
  compText:{fontSize:15,fontWeight:"bold",color:"#fff"},
  compSub:{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:2},
  // badge
  badge:{display:"inline-block",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:"bold",marginRight:6,marginBottom:4},
  // pronunciation card
  pronCard:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:14,padding:"14px",marginBottom:10},
  pronSound:{fontSize:28,fontWeight:"bold",color:"#fbbf24",marginBottom:4},
  pronDesc:{color:"rgba(255,255,255,0.65)",fontSize:13,lineHeight:1.5,margin:"0 0 8px"},
  pronExamples:{display:"flex",flexWrap:"wrap",gap:6},
  pronChip:{background:"rgba(255,255,255,0.08)",borderRadius:20,padding:"4px 12px",fontSize:13,color:"#fff"},
  // speak button
  speakBtn:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:20,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"'Georgia',serif"},
};

// ── subpages ─────────────────────────────────────────────────

function DetailHeader({ title, fr, emoji, color, onBack }) {
  return (
    <div style={G.header}>
      <button style={G.backBtn} onClick={onBack}>← Gramática</button>
      <span style={{color:"#fff",fontWeight:"bold",fontSize:15}}>{emoji} {title}</span>
      <span style={{color:"rgba(255,255,255,0.35)",fontSize:12,fontStyle:"italic"}}>{fr}</span>
    </div>
  );
}

function ExCard({ pt, fr }) {
  return (
    <div style={G.exCard}>
      <p style={G.exPt}>🇧🇷 {pt}</p>
      <p style={G.exFr}>🇫🇷 {fr}</p>
    </div>
  );
}

function SpeakBtn({ text }) {
  return (
    <button style={{...G.speakBtn,marginLeft:8}} onClick={() => speakPortugueseSanitized(text)}>🔊</button>
  );
}

function TitleSection({ title }) {
  return <p style={G.sectionTitle}>{title}</p>;
}

// 1. PRESENTE
function PagePresente({ onBack }) {
  const verbs = [
    { inf:"falar",  rows:[["eu","falo"],["tu","falas"],["ele/ela","fala"],["nós","falamos"],["vocês","falam"]] },
    { inf:"morar",  rows:[["eu","moro"],["tu","moras"],["ele/ela","mora"],["nós","moramos"],["vocês","moram"]] },
    { inf:"trabalhar", rows:[["eu","trabalho"],["tu","trabalhas"],["ele/ela","trabalha"],["nós","trabalhamos"],["vocês","trabalham"]] },
    { inf:"comer",  rows:[["eu","como"],["tu","comes"],["ele/ela","come"],["nós","comemos"],["vocês","comem"]] },
    { inf:"beber",  rows:[["eu","bebo"],["tu","bebes"],["ele/ela","bebe"],["nós","bebemos"],["vocês","bebem"]] },
    { inf:"ir",     rows:[["eu","vou"],["tu","vais"],["ele/ela","vai"],["nós","vamos"],["vocês","vão"]] },
    { inf:"jogar",  rows:[["eu","jogo"],["tu","jogas"],["ele/ela","joga"],["nós","jogamos"],["vocês","jogam"]] },
    { inf:"brincar",rows:[["eu","brinco"],["tu","brincas"],["ele/ela","brinca"],["nós","brincamos"],["vocês","brincam"]] },
    { inf:"tomar",  rows:[["eu","tomo"],["tu","tomas"],["ele/ela","toma"],["nós","tomamos"],["vocês","tomam"]] },
  ];
  const [sel, setSel] = useState(0);
  const v = verbs[sel];
  return (
    <div style={G.detailPage}>
      <DetailHeader title="Presente" fr="Présent" emoji="⚡" color="#f97316" onBack={onBack}/>
      <div style={G.section}>
        <div style={G.explBox}>
          <p style={G.explTitle}>Como funciona?</p>
          <p style={G.explText}>No português brasileiro, o presente do indicativo é usado para falar de ações habituais, fatos gerais e situações atuais. Muito parecido com o francês!</p>
          <p style={G.explFr}>🇫🇷 Comme en français, le présent s'utilise pour les habitudes, les faits généraux et les actions en cours.</p>
        </div>

        <TitleSection title="Terminações regulares"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
          {[{g:"-AR",ex:"falar, morar, jogar",c:"#f97316"},{g:"-ER",ex:"comer, beber",c:"#8b5cf6"},{g:"-IR",ex:"abrir, dividir",c:"#3b82f6"}].map(t=>(
            <div key={t.g} style={{background:`${t.c}22`,border:`1px solid ${t.c}44`,borderRadius:12,padding:"10px",textAlign:"center"}}>
              <span style={{color:t.c,fontSize:18,fontWeight:"bold",display:"block"}}>{t.g}</span>
              <span style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>{t.ex}</span>
            </div>
          ))}
        </div>

        <TitleSection title="Escolha um verbo"/>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {verbs.map((vb,i)=>(
            <button key={i} onClick={()=>setSel(i)}
              style={{...G.speakBtn, ...(sel===i?{background:"rgba(167,139,250,0.3)",border:"1px solid #a78bfa",color:"#a78bfa"}:{})}}>
              {vb.inf}
            </button>
          ))}
        </div>

        <div style={{...G.explBox,padding:"6px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px 4px"}}>
            <span style={{color:"#fbbf24",fontSize:18,fontWeight:"bold"}}>{v.inf}</span>
            <SpeakBtn text={v.inf}/>
          </div>
          <table style={G.table}>
            <thead>
              <tr>
                <th style={G.th}>Sujeito</th>
                <th style={G.th}>Forma</th>
                <th style={G.th}>Ouvir</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map(([subj,form],i)=>(
                <tr key={i}>
                  <td style={G.td}>{subj}</td>
                  <td style={{...G.td,...G.tdHighlight}}>{form}</td>
                  <td style={G.td}><SpeakBtn text={`${subj} ${form}`}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TitleSection title="Exemplos do dia a dia"/>
        {[
          {pt:"Eu falo português todo dia.",fr:"Je parle portugais tous les jours."},
          {pt:"Ela mora em Paris.",fr:"Elle habite à Paris."},
          {pt:"Nós comemos juntos.",fr:"Nous mangeons ensemble."},
          {pt:"Vocês jogam Roblox?",fr:"Vous jouez à Roblox ?"},
          {pt:"Eu vou à escola de manhã.",fr:"Je vais à l'école le matin."},
          {pt:"Ele bebe café todo dia.",fr:"Il boit du café tous les jours."},
        ].map((e,i)=><ExCard key={i} pt={e.pt} fr={e.fr}/>)}
      </div>
    </div>
  );
}

// 2. PASSADO
function PagePassado({ onBack }) {
  return (
    <div style={G.detailPage}>
      <DetailHeader title="Passado" fr="Passé" emoji="⏳" color="#8b5cf6" onBack={onBack}/>
      <div style={G.section}>
        <div style={G.explBox}>
          <p style={G.explTitle}>Dois tipos de passado</p>
          <p style={G.explText}>No português, existe o <strong style={{color:"#a78bfa"}}>pretérito perfeito</strong> (ação terminada) e o <strong style={{color:"#60d9fa"}}>pretérito imperfeito</strong> (hábito ou estado no passado).</p>
          <p style={G.explFr}>🇫🇷 Comme en français: passé composé (action terminée) vs imparfait (habitude ou état passé).</p>
        </div>

        <TitleSection title="Pretérito perfeito — ação terminada"/>
        <div style={{...G.explBox,borderLeft:"3px solid #a78bfa"}}>
          <p style={{...G.explText,margin:"0 0 8px"}}>Termination <strong style={{color:"#a78bfa"}}>-AR → -ei, -ou, -amos, -aram</strong></p>
          <p style={{...G.explText,margin:"0 0 8px"}}>Termination <strong style={{color:"#a78bfa"}}>-ER/-IR → -i, -eu, -emos, -eram</strong></p>
        </div>
        {[
          {pt:"Eu falei com ela ontem.",fr:"J'ai parlé avec elle hier."},
          {pt:"Ele comeu pizza sexta-feira.",fr:"Il a mangé une pizza vendredi."},
          {pt:"Nós fomos ao cinema.",fr:"Nous sommes allés au cinéma."},
          {pt:"Ela trabalhou o dia todo.",fr:"Elle a travaillé toute la journée."},
        ].map((e,i)=><ExCard key={i} pt={e.pt} fr={e.fr}/>)}

        <TitleSection title="Pretérito imperfeito — hábito no passado"/>
        <div style={{...G.explBox,borderLeft:"3px solid #60d9fa"}}>
          <p style={{...G.explText,margin:"0 0 8px"}}>Termination <strong style={{color:"#60d9fa"}}>-AR → -ava, -avas, -ava, -ávamos, -avam</strong></p>
          <p style={{...G.explText,margin:0}}>Termination <strong style={{color:"#60d9fa"}}>-ER/-IR → -ia, -ias, -ia, -íamos, -iam</strong></p>
        </div>
        {[
          {pt:"Quando era criança, eu jogava muito.",fr:"Quand j'étais enfant, je jouais beaucoup."},
          {pt:"Ela morava em Lyon antes.",fr:"Elle habitait à Lyon avant."},
          {pt:"Nós comíamos juntos todo domingo.",fr:"Nous mangions ensemble tous les dimanches."},
          {pt:"Ele trabalhava de noite.",fr:"Il travaillait la nuit."},
        ].map((e,i)=><ExCard key={i} pt={e.pt} fr={e.fr}/>)}

        <TitleSection title="Diferença na prática"/>
        <div style={G.compRow}>
          <div style={{...G.compBox,...G.compOk}}>
            <span style={{...G.compLabel,color:"#6ee7b7"}}>PERFEITO ✅</span>
            <span style={G.compText}>Eu fui ao Brasil.</span>
            <span style={G.compSub}>Uma viagem específica, terminada</span>
          </div>
          <div style={{...G.compBox,background:"rgba(96,217,250,0.1)",border:"1px solid rgba(96,217,250,0.3)"}}>
            <span style={{...G.compLabel,color:"#60d9fa"}}>IMPERFEITO 🔄</span>
            <span style={G.compText}>Eu ia ao Brasil todo verão.</span>
            <span style={G.compSub}>Hábito repetido no passado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. FUTURO
function PageFuturo({ onBack }) {
  return (
    <div style={G.detailPage}>
      <DetailHeader title="Futuro" fr="Futur" emoji="🚀" color="#3b82f6" onBack={onBack}/>
      <div style={G.section}>
        <div style={G.explBox}>
          <p style={G.explTitle}>O futuro brasileiro é simples!</p>
          <p style={G.explText}>No Brasil, quase ninguém usa o futuro formal. O jeito natural é usar <strong style={{color:"#60d9fa"}}>ir + infinitivo</strong> — exatamente como o francês!</p>
          <p style={G.explFr}>🇫🇷 Comme "aller + infinitif" en français. Très facile !</p>
        </div>

        <TitleSection title="Futuro natural — ir + verbo"/>
        <table style={G.table}>
          <thead><tr><th style={G.th}>Sujeito</th><th style={G.th}>Forma</th><th style={G.th}>Exemplo</th></tr></thead>
          <tbody>
            {[
              ["eu","vou + verbo","Eu vou estudar amanhã."],
              ["tu","vais + verbo","Tu vais sair hoje?"],
              ["ele/ela","vai + verbo","Ela vai comer agora."],
              ["nós","vamos + verbo","Nós vamos viajar."],
              ["vocês","vão + verbo","Vocês vão jogar?"],
            ].map(([s,f,ex],i)=>(
              <tr key={i}>
                <td style={G.td}>{s}</td>
                <td style={{...G.td,...G.tdHighlight}}>{f}</td>
                <td style={{...G.td,color:"rgba(255,255,255,0.6)",fontSize:12}}>{ex}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <TitleSection title="Frases do cotidiano"/>
        {[
          {pt:"Eu vou aprender português!",fr:"Je vais apprendre le portugais !"},
          {pt:"A gente vai comer pizza hoje.",fr:"On va manger une pizza aujourd'hui."},
          {pt:"Ela vai morar no Brasil.",fr:"Elle va habiter au Brésil."},
          {pt:"Vocês vão jogar Fortnite?",fr:"Vous allez jouer à Fortnite ?"},
          {pt:"Amanhã vai fazer calor.",fr:"Demain il va faire chaud."},
          {pt:"Nós vamos estudar juntos.",fr:"Nous allons étudier ensemble."},
        ].map((e,i)=><ExCard key={i} pt={e.pt} fr={e.fr}/>)}

        <div style={G.explBox}>
          <p style={G.explTitle}>Futuro formal (menos usado)</p>
          <p style={G.explText}>Existe também o futuro simples, mais formal: <strong style={{color:"#a78bfa"}}>falarei, comerá, iremos...</strong> Você vai ver em textos escritos, mas raramente na fala cotidiana.</p>
          <p style={G.explFr}>🇫🇷 Comme le futur simple en français, il existe mais s'utilise peu à l'oral.</p>
        </div>
      </div>
    </div>
  );
}

// 4. SER vs ESTAR
function PageSerEstar({ onBack }) {
  return (
    <div style={G.detailPage}>
      <DetailHeader title="Ser vs Estar" fr="Être (deux formes)" emoji="⚖️" color="#ec4899" onBack={onBack}/>
      <div style={G.section}>
        <div style={G.explBox}>
          <p style={G.explTitle}>A diferença mais importante!</p>
          <p style={G.explText}>Em português, o verbo francês <strong style={{color:"#ec4899"}}>"être"</strong> se divide em dois: <strong style={{color:"#f97316"}}>SER</strong> (permanente/identidade) e <strong style={{color:"#3b82f6"}}>ESTAR</strong> (temporário/estado).</p>
          <p style={G.explFr}>🇫🇷 En français vous dites "être" pour tout. En portugais, il faut choisir entre les deux!</p>
        </div>

        <TitleSection title="Conjugação"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.3)",borderRadius:14,padding:"12px"}}>
            <p style={{color:"#f97316",fontWeight:"bold",textAlign:"center",margin:"0 0 8px",fontSize:16}}>SER</p>
            {[["eu","sou"],["tu","és"],["ele/ela","é"],["nós","somos"],["vocês","são"]].map(([s,f])=>(
              <div key={s} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"4px 0"}}>
                <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>{s}</span>
                <span style={{color:"#f97316",fontWeight:"bold",fontSize:13}}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:14,padding:"12px"}}>
            <p style={{color:"#60d9fa",fontWeight:"bold",textAlign:"center",margin:"0 0 8px",fontSize:16}}>ESTAR</p>
            {[["eu","estou"],["tu","estás"],["ele/ela","está"],["nós","estamos"],["vocês","estão"]].map(([s,f])=>(
              <div key={s} style={{display:"flex",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"4px 0"}}>
                <span style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>{s}</span>
                <span style={{color:"#60d9fa",fontWeight:"bold",fontSize:13}}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <TitleSection title="Quando usar SER — permanente"/>
        {[
          {pt:"Eu sou brasileiro.",fr:"Je suis brésilien."},
          {pt:"Ela é professora.",fr:"Elle est professeure."},
          {pt:"Nós somos amigos.",fr:"Nous sommes amis."},
          {pt:"O Brasil é grande.",fr:"Le Brésil est grand."},
          {pt:"Eu sou Lucas.",fr:"Je suis Lucas."},
        ].map((e,i)=><ExCard key={i} pt={e.pt} fr={e.fr}/>)}

        <TitleSection title="Quando usar ESTAR — temporário"/>
        {[
          {pt:"Estou cansado.",fr:"Je suis fatigué (en ce moment)."},
          {pt:"Ela está feliz hoje.",fr:"Elle est heureuse aujourd'hui."},
          {pt:"Estamos em Paris.",fr:"Nous sommes à Paris (en ce moment)."},
          {pt:"O café está quente.",fr:"Le café est chaud (maintenant)."},
          {pt:"Você está bem?",fr:"Tu vas bien ? (Comment tu te sens ?)"},
        ].map((e,i)=><ExCard key={i} pt={e.pt} fr={e.fr}/>)}

        <TitleSection title="Comparação lado a lado"/>
        <div style={G.compRow}>
          <div style={{...G.compBox,background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.3)"}}>
            <span style={{...G.compLabel,color:"#f97316"}}>SER (identidade)</span>
            <span style={G.compText}>Ele é alto.</span>
            <span style={G.compSub}>É sempre alto — característica física</span>
          </div>
          <div style={{...G.compBox,background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.3)"}}>
            <span style={{...G.compLabel,color:"#60d9fa"}}>ESTAR (estado)</span>
            <span style={G.compText}>Ele está doente.</span>
            <span style={G.compSub}>Está doente agora — temporário</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. VERBOS ESSENCIAIS
function PageVerbos({ onBack }) {
  const [sel, setSel] = useState(0);
  const verbs = [
    { v: "ser", tr: "être (identité)", rows: [["eu", "sou"], ["você", "é"], ["ele", "é"], ["nós", "somos"], ["vocês", "são"]], ex: [{ pt: "Eu sou francês.", fr: "Je suis français." }, { pt: "Ela é médica.", fr: "Elle est médecin." }] },
    { v: "estar", tr: "être (état)", rows: [["eu", "estou"], ["você", "está"], ["ele", "está"], ["nós", "estamos"], ["vocês", "estão"]], ex: [{ pt: "Estou bem!", fr: "Je vais bien !" }, { pt: "Onde você está?", fr: "Où êtes-vous ?" }] },
    { v: "ter", tr: "avoir", rows: [["eu", "tenho"], ["você", "tem"], ["ele", "tem"], ["nós", "temos"], ["vocês", "têm"]], ex: [{ pt: "Eu tenho 24 anos.", fr: "J'ai 24 ans." }, { pt: "Ela tem um carro.", fr: "Elle a une voiture." }] },
    { v: "fazer", tr: "faire", rows: [["eu", "faço"], ["você", "faz"], ["ele", "faz"], ["nós", "fazemos"], ["vocês", "fazem"]], ex: [{ pt: "Eu faço exercício.", fr: "Je fais de l'exercice." }, { pt: "O que você faz?", fr: "Qu'est-ce que vous faites ?" }] },
    { v: "ir", tr: "aller", rows: [["eu", "vou"], ["você", "vai"], ["ele", "vai"], ["nós", "vamos"], ["vocês", "vão"]], ex: [{ pt: "Vou ao Brasil!", fr: "Je vais au Brésil !" }, { pt: "A gente vai juntos.", fr: "On y va ensemble." }] },
    { v: "querer", tr: "vouloir", rows: [["eu", "quero"], ["você", "quer"], ["ele", "quer"], ["nós", "queremos"], ["vocês", "querem"]], ex: [{ pt: "Eu quero aprender.", fr: "Je veux apprendre." }, { pt: "Quer um café?", fr: "Vous voulez un café ?" }] },
    { v: "poder", tr: "pouvoir", rows: [["eu", "posso"], ["você", "pode"], ["ele", "pode"], ["nós", "podemos"], ["vocês", "podem"]], ex: [{ pt: "Posso entrar?", fr: "Je peux entrer ?" }, { pt: "Ela pode ajudar.", fr: "Elle peut aider." }] },
    { v: "gostar", tr: "aimer / apprécier", rows: [["eu", "gosto"], ["você", "gosta"], ["ele", "gosta"], ["nós", "gostamos"], ["vocês", "gostam"]], ex: [{ pt: "Gosto de música.", fr: "J'aime la musique." }, { pt: "Você gosta de pizza?", fr: "Vous aimez la pizza ?" }] },
    { v: "comer", tr: "manger", rows: [["eu", "como"], ["você", "come"], ["ele", "come"], ["nós", "comemos"], ["vocês", "comem"]], ex: [{ pt: "Eu como arroz todo dia.", fr: "Je mange du riz tous les jours." }, { pt: "Vamos comer!", fr: "Allons manger !" }] },
    { v: "beber", tr: "boire", rows: [["eu", "bebo"], ["você", "bebe"], ["ele", "bebe"], ["nós", "bebemos"], ["vocês", "bebem"]], ex: [{ pt: "Bebo café de manhã.", fr: "Je bois du café le matin." }, { pt: "Quer beber algo?", fr: "Vous voulez boire quelque chose ?" }] },
  ];
  const vb = verbs[sel];
  return (
    <div style={G.detailPage}>
      <DetailHeader title="Verbos Essenciais" fr="Verbes essentiels" emoji="📚" color="#10b981" onBack={onBack}/>
      <div style={G.section}>
        <TitleSection title="Escolha um verbo"/>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {verbs.map((vb2,i)=>(
            <button key={i} onClick={()=>setSel(i)}
              style={{...G.speakBtn,fontSize:13,padding:"6px 14px",...(sel===i?{background:"rgba(16,185,129,0.25)",border:"1px solid #10b981",color:"#6ee7b7"}:{})}}>
              {vb2.v}
              <span style={{color:"rgba(255,255,255,0.35)",fontSize:11,marginLeft:4}}>({vb2.tr})</span>
            </button>
          ))}
        </div>

        <div style={{...G.explBox,borderLeft:"3px solid #10b981"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{color:"#10b981",fontSize:20,fontWeight:"bold"}}>{vb.v}</span>
            <SpeakBtn text={vb.v}/>
            <span style={{...G.badge,background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",color:"#6ee7b7"}}>{vb.tr}</span>
          </div>
          <table style={{...G.table,marginBottom:0}}>
            <thead><tr><th style={G.th}>Sujeito</th><th style={G.th}>Forma</th><th style={G.th}>Ouvir</th></tr></thead>
            <tbody>
              {vb.rows.map(([s,f],i)=>(
                <tr key={i}>
                  <td style={G.td}>{s}</td>
                  <td style={{...G.td,...G.tdHighlight}}>{f}</td>
                  <td style={G.td}><SpeakBtn text={`${s} ${f}`}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TitleSection title="Exemplos reais"/>
        {vb.ex.map((e,i)=><ExCard key={i} pt={e.pt} fr={e.fr}/>)}
      </div>
    </div>
  );
}

// 6. ERROS COMUNS
function PageErros({ onBack }) {
  const erros = [
    { wrong:"Eu sou 24 anos.", right:"Eu tenho 24 anos.", fr:"J'ai 24 ans.", tip:"Em português se usa TER para idade, não SER. Em francês também: avoir.", icon:"🎂" },
    { wrong:"Eu sou fome.", right:"Estou com fome.", fr:"J'ai faim.", tip:"Fome, sede, frio, calor — em português usa ESTAR COM, não SER.", icon:"🍽️" },
    { wrong:"Eu sou calor.", right:"Estou com calor.", fr:"J'ai chaud.", tip:"Mesma armadilha! Sensações físicas: ESTAR COM.", icon:"🌡️" },
    { wrong:"Falar com você é um prazer.", right:"Prazer em te conhecer!", fr:"Enchanté(e) !", tip:"O jeito natural no Brasil é 'Prazer!' ou 'Prazer em te conhecer!'", icon:"🤝" },
    { wrong:"Eu gosto você.", right:"Eu gosto de você.", fr:"Je t'aime bien.", tip:"GOSTAR sempre pede a preposição DE. Eu gosto DE música, DE você...", icon:"❤️" },
    { wrong:"Vou ao médico amanhã cedo.", right:"Vou ao médico amanhã de manhã.", fr:"Je vais chez le médecin demain matin.", tip:"'Cedo' significa 'tôt' (tôt le matin). Pour 'matin' on dit 'de manhã'.", icon:"🏥" },
    { wrong:"Onde é o banheiro?", right:"Onde fica o banheiro?", fr:"Où sont les toilettes ?", tip:"'Onde fica' é mais natural no Brasil para perguntar a localização de algo.", icon:"🚽" },
    { wrong:"Ele tem 1,80 de altura.", right:"Ele mede 1,80 / Ele tem 1,80 de altura.", fr:"Il mesure 1m80.", tip:"As duas formas existem, mas 'mede' é mais natural na fala cotidiana.", icon:"📏" },
  ];
  return (
    <div style={G.detailPage}>
      <DetailHeader title="Erros Comuns" fr="Erreurs fréquentes" emoji="🚫" color="#ef4444" onBack={onBack}/>
      <div style={G.section}>
        <div style={G.explBox}>
          <p style={G.explTitle}>Armadilhas para franceses 🪤</p>
          <p style={G.explText}>Certas estruturas do francês não se traduzem diretamente para o português. Aqui estão os erros mais comuns!</p>
          <p style={G.explFr}>🇫🇷 Certaines structures françaises ne se traduisent pas directement. Voici les pièges les plus fréquents !</p>
        </div>
        {erros.map((e,i)=>(
          <div key={i} style={{...G.exCard,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:24}}>{e.icon}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{...G.badge,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5"}}>❌ Errado</span>
                  <span style={{color:"rgba(255,255,255,0.4)",fontSize:13,textDecoration:"line-through"}}>{e.wrong}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                  <span style={{...G.badge,background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",color:"#6ee7b7"}}>✅ Certo</span>
                  <span style={{color:"#fff",fontSize:14,fontWeight:"bold"}}>{e.right}</span>
                  <SpeakBtn text={e.right}/>
                </div>
              </div>
            </div>
            <p style={{...G.exFr,margin:"4px 0 4px"}}>🇫🇷 {e.fr}</p>
            <p style={{color:"rgba(255,255,255,0.5)",fontSize:12,margin:"6px 0 0",fontStyle:"italic",borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:6}}>💡 {e.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 7. PRONÚNCIA
function PagePronuncia({ onBack }) {
  const sons = [
    { sound:"ão", desc:"Som nasal no final das palavras. É como 'om' do francês mas mais fechado e nasal.", fr:"Comme le 'on' français mais plus fermé. Très caractéristique du portugais!", exemples:["pão","são","não","mão","irmão"], dica:"Dica: Fale 'om' e feche um pouco mais a boca." },
    { sound:"lh", desc:"Som parecido com o 'lh' do espanhol ou 'ill' do francês em 'fille'.", fr:"Comme 'ill' dans 'fille' ou 'y' dans 'yeux' — un son mouillé.", exemples:["trabalho","filho","mulher","olho","vermelho"], dica:"Dica: É como dizer 'li' muito rápido, com a língua no céu da boca." },
    { sound:"nh", desc:"Exatamente como o 'gn' do francês em 'montagne' ou 'gagner'.", fr:"Exactement comme 'gn' dans 'montagne' ou 'gagner'. Facile pour les Français!", exemples:["amanhã","vinho","banho","sonho","inha"], dica:"Dica: Igual ao 'gn' francês! Este é fácil para vocês." },
    { sound:"r / rr", desc:"O 'r' no início ou 'rr' no meio soa como o 'r' francês — na garganta!", fr:"Le 'r' initial ou 'rr' se prononce comme le 'r' français gutural. Familier!", exemples:["Rio","carro","rua","arroz","errar"], dica:"Dica: Use o seu 'r' francês! Para o 'r' simples no meio, é suave como 'd' em inglês." },
    { sound:"ã", desc:"Vogal nasal. Como 'an' do francês mas como uma vogal pura, sem o 'n' final.", fr:"Comme le 'an' français mais en voyelle pure: 'an' dans 'France' mais sans articuler le 'n'.", exemples:["maçã","irmã","manhã","romã"], dica:"Dica: Fale 'a' e deixe o ar sair pelo nariz ao mesmo tempo." },
    { sound:"de / te", desc:"No Brasil, 'di' e 'ti' viram 'dji' e 'tchi' — afetam sílabas antes de 'i'.", fr:"Au Brésil, 'di' et 'ti' se prononcent 'dji' et 'tchi'. Très spécifique du portugais brésilien!", exemples:["dia","tia","diferente","tijolo","dinheiro"], dica:"Dica: 'Dia' soa como 'djia', 'tia' soa como 'tchia'. Típico do sotaque brasileiro!" },
  ];
  return (
    <div style={G.detailPage}>
      <DetailHeader title="Pronúncia" fr="Prononciation" emoji="🔊" color="#fbbf24" onBack={onBack}/>
      <div style={G.section}>
        <div style={G.explBox}>
          <p style={G.explTitle}>Sons difíceis para franceses</p>
          <p style={G.explText}>O português brasileiro tem alguns sons específicos que não existem no francês — mas outros são bem parecidos! Veja os principais.</p>
          <p style={G.explFr}>🇫🇷 Le portugais brésilien a des sons spécifiques, mais certains ressemblent au français. Bonne nouvelle !</p>
        </div>
        {sons.map((s,i)=>(
          <div key={i} style={G.pronCard}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={G.pronSound}>{s.sound}</span>
              <SpeakBtn text={s.exemples[0]}/>
            </div>
            <p style={G.pronDesc}>{s.desc}</p>
            <p style={{...G.pronDesc,color:"#93c5fd",fontStyle:"italic"}}>{s.fr}</p>
            <div style={G.pronExamples}>
              {s.exemples.map((ex,j)=>(
                <button key={j} style={G.pronChip} onClick={()=>speakPortugueseSanitized(ex)}>{ex} 🔊</button>
              ))}
            </div>
            <p style={{color:"#fbbf24",fontSize:12,margin:"8px 0 0",fontStyle:"italic"}}>💡 {s.dica}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN GRAMMAIRE SCREEN ────────────────────────────────────
function GrammaireScreen({ onBack }) {
  const [detail, setDetail] = useState(null);

  if (detail === "present")  return <PagePresente   onBack={() => setDetail(null)}/>;
  if (detail === "passe")    return <PagePassado    onBack={() => setDetail(null)}/>;
  if (detail === "futur")    return <PageFuturo     onBack={() => setDetail(null)}/>;
  if (detail === "serstar")  return <PageSerEstar   onBack={() => setDetail(null)}/>;
  if (detail === "verbos")   return <PageVerbos     onBack={() => setDetail(null)}/>;
  if (detail === "erros")    return <PageErros      onBack={() => setDetail(null)}/>;
  if (detail === "pronunc")  return <PagePronuncia  onBack={() => setDetail(null)}/>;

  return (
    <div style={G.page}>
      <div style={G.header}>
        <button style={G.backBtn} onClick={onBack}>← Início</button>
        <span style={{color:"#fff",fontWeight:"bold",fontSize:17}}>📖 Gramática</span>
        <span style={{color:"rgba(255,255,255,0.35)",fontSize:12,fontStyle:"italic"}}>Grammaire</span>
      </div>

      <div style={G.heroBox}>
        <span style={G.heroEmoji}>📖</span>
        <h1 style={G.heroTitle}>Gramática Portuguesa</h1>
        <p style={G.heroSub}>Grammaire portugaise · 7 módulos para iniciantes</p>
      </div>

      <div style={G.grid}>
        {GRAM_MODULES.map(m => (
          <div key={m.id}
            style={{...G.card, borderTop:`3px solid ${m.color}`}}
            onClick={() => setDetail(m.id)}>
            <span style={G.cardEmoji}>{m.emoji}</span>
            <p style={G.cardTitle}>{m.title}</p>
            <p style={G.cardFr}>{m.fr}</p>
            <p style={G.cardDesc}>{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ILHAS TEMÁTICAS — Dados e Componentes
// ═══════════════════════════════════════════════════════════════

const ISLANDS = [
  {
    id: "rotina",
    title: "Rotina Diária",
    emoji: "☀️",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
    desc: "Aprenda a falar sobre o seu dia a dia!",
    desc_fr: "Apprenez à parler de votre quotidien !",
    locked: false,
    sections: ["vocab","phrases","dialogue","cultural","formal"],
    vocab: [
      { pt:"acordar", fr:"se réveiller", example:"Eu acordo às 7h.", example_fr:"Je me réveille à 7h.", level:1, tag:"verbo" },
      { pt:"tomar banho", fr:"prendre une douche", example:"Tomo banho de manhã.", example_fr:"Je prends une douche le matin.", level:1, tag:"rotina" },
      { pt:"café da manhã", fr:"petit-déjeuner", example:"Tomo café da manhã cedo.", example_fr:"Je prends le petit-déjeuner tôt.", level:1, tag:"refeição" },
      { pt:"escova de dente", fr:"brosse à dents", example:"Escovo os dentes todo dia.", example_fr:"Je me brosse les dents tous les jours.", level:1, tag:"higiene" },
      { pt:"almoço", fr:"déjeuner", example:"O almoço é ao meio-dia.", example_fr:"Le déjeuner est à midi.", level:1, tag:"refeição" },
      { pt:"jantar", fr:"dîner", example:"A gente janta às 19h.", example_fr:"On dîne à 19h.", level:1, tag:"refeição" },
      { pt:"dormir", fr:"dormir", example:"Eu durmo às 22h.", example_fr:"Je dors à 22h.", level:1, tag:"verbo" },
      { pt:"dever de casa", fr:"devoirs", example:"Faço o dever depois da escola.", example_fr:"Je fais mes devoirs après l'école.", level:2, tag:"escola" },
      { pt:"tarde", fr:"après-midi", example:"De tarde eu jogo.", example_fr:"L'après-midi je joue.", level:1, tag:"tempo" },
      { pt:"semana", fr:"semaine", example:"Na semana tenho escola.", example_fr:"En semaine j'ai l'école.", level:1, tag:"tempo" },
      { pt:"fim de semana", fr:"week-end", example:"No fim de semana descanso.", example_fr:"Le week-end je me repose.", level:1, tag:"tempo" },
      { pt:"cedo", fr:"tôt", example:"Acordo cedo todo dia.", example_fr:"Je me réveille tôt tous les jours.", level:1, tag:"tempo" },
    ],
    phrases: [
      { pt:"Eu acordo às sete da manhã.", fr:"Je me réveille à sept heures du matin.", note:"Forma padrão de dizer a hora de acordar.", note_fr:"Façon standard de dire l'heure du réveil." },
      { pt:"Tomo café da manhã com a família.", fr:"Je prends le petit-déjeuner avec ma famille.", note:"'Tomar café da manhã' = la routine matinale brésilienne.", note_fr:"'Tomar café da manhã' = la routine matinale brésilienne." },
      { pt:"Vou para a escola de ônibus.", fr:"Je vais à l'école en bus.", note:"'Ônibus' = bus. Muito usado no Brasil.", note_fr:"'Ônibus' = bus. Très utilisé au Brésil." },
      { pt:"Chego em casa às quatro da tarde.", fr:"Je rentre à la maison à quatre heures de l'après-midi.", note:"'Chegar em casa' = rentrer à la maison.", note_fr:"'Chegar em casa' = rentrer à la maison." },
      { pt:"Faço o dever antes de jogar.", fr:"Je fais mes devoirs avant de jouer.", note:"Ordem natural: dever → diversão.", note_fr:"Ordre naturel : devoirs → amusement." },
      { pt:"À noite assisto série no celular.", fr:"Le soir je regarde une série sur mon portable.", note:"'Celular' = smartphone. Palavra muito usada.", note_fr:"'Celular' = smartphone. Mot très utilisé." },
      { pt:"Durmo às dez da noite.", fr:"Je dors à dix heures du soir.", note:"Horário típico para adolescentes brasileiros.", note_fr:"Heure typique pour les adolescents brésiliens." },
      { pt:"No fim de semana acordo tarde.", fr:"Le week-end je me réveille tard.", note:"Hábito universal de adolescentes!", note_fr:"Habitude universelle des ados !" },
    ],
    dialogue: [
      { who:"lucas", text:"Oi! Como foi o seu dia hoje?", fr:"Salut ! Comment s'est passée ta journée aujourd'hui ?" },
      { who:"aluno", text:"Foi corrido! Acordei às 6h30, fui pra escola, tive cinco aulas e ainda fiz treino de futebol!", fr:"C'était chargé ! Je me suis réveillé(e) à 6h30, je suis allé(e) à l'école, j'ai eu cinq cours et j'ai encore fait l'entraînement de foot !" },
      { who:"lucas", text:"Uau! Você tem treino de futebol todo dia?", fr:"Waouh ! Tu as l'entraînement de foot tous les jours ?" },
      { who:"aluno", text:"Não, só terças e quintas. Mas hoje foi puxado!", fr:"Non, seulement le mardi et le jeudi. Mais aujourd'hui c'était intense !" },
      { who:"lucas", text:"E o dever de casa, já fez?", fr:"Et les devoirs, tu les as déjà faits ?" },
      { who:"aluno", text:"Ainda não... vou fazer depois do jantar. Prometo!", fr:"Pas encore... je vais les faire après le dîner. Je te le promets !" },
      { who:"lucas", text:"Haha! Boa sorte! O que vai jantar hoje?", fr:"Haha ! Bonne chance ! Qu'est-ce que tu vas manger ce soir ?" },
      { who:"aluno", text:"Acho que arroz com feijão. É o prato favorito da minha família!", fr:"Je crois que ce sera du riz avec des haricots. C'est le plat préféré de ma famille !" },
    ],
    cultural: [
      { tip:"☀️ O café da manhã brasileiro", text:"No Brasil, o café da manhã típico inclui pão francês com manteiga, café com leite e às vezes frutas. Bem diferente do croissant francês!", text_fr:"Au Brésil, le petit-déjeuner typique comprend du pain français avec du beurre, du café au lait et parfois des fruits. Très différent du croissant français !" },
      { tip:"🍚 Arroz e feijão", text:"O almoço mais popular no Brasil é arroz com feijão. É quase todo dia! É como o pain quotidien dos brasileiros.", text_fr:"Le déjeuner le plus populaire au Brésil est le riz aux haricots. C'est presque tous les jours ! C'est comme le pain quotidien des Brésiliens." },
      { tip:"📱 Celular = smartphone", text:"No Brasil, todo mundo fala 'celular' para smartphone. Você nunca vai ouvir 'smartphone' na conversa do dia a dia.", text_fr:"Au Brésil, tout le monde dit 'celular' pour smartphone. Vous n'entendrez jamais 'smartphone' dans la conversation quotidienne." },
      { tip:"🚌 Ônibus na cidade", text:"Nas grandes cidades brasileiras como São Paulo, muita gente vai para a escola de ônibus ou metrô. O carro particular é menos comum para adolescentes.", text_fr:"Dans les grandes villes brésiliennes comme São Paulo, beaucoup de gens vont à l'école en bus ou en métro. La voiture particulière est moins courante pour les adolescents." },
    ],
    formal_informal: [
      {
        tema:"Acordar cedo",
        formal:{ pt:"Eu acordo muito cedo.", fr:"Je me réveille très tôt." },
        informal:{ pt:"Acordo cedão!", fr:"Je me réveille super tôt !" },
        explanation:"'Cedão' é uma versão aumentativa informal de 'cedo'. Os brasileiros adoram usar sufixos como -ão para intensificar!",
        explanation_fr:"'Cedão' est une version augmentative informelle de 'cedo'. Les Brésiliens adorent utiliser des suffixes comme -ão pour intensifier !"
      },
      {
        tema:"Fazer o dever de casa",
        formal:{ pt:"Vou fazer o dever de casa agora.", fr:"Je vais faire mes devoirs maintenant." },
        informal:{ pt:"Vou fazer o dever agora.", fr:"Je vais faire les devoirs maintenant." },
        explanation:"No dia a dia, 'de casa' é cortado. Só 'o dever' já basta.",
        explanation_fr:"Au quotidien, 'de casa' est omis. Juste 'o dever' suffit."
      },
      {
        tema:"Ir dormir",
        formal:{ pt:"Vou dormir agora.", fr:"Je vais dormir maintenant." },
        informal:[{ pt:"Vou cair no sono!", fr:"Je vais m'endormir !" },{ pt:"Tô morto(a) de sono!", fr:"Je suis mort(e) de sommeil !" }],
        explanation:"'Tô morto(a) de sono' é uma expressão muito usada pelos jovens brasileiros para dizer que estão com muito sono.",
        explanation_fr:"'Tô morto(a) de sono' est une expression très utilisée par les jeunes Brésiliens pour dire qu'ils ont très sommeil."
      },
    ],
    quiz: [
      { q:"Como se diz 'petit-déjeuner' em português?", q_fr:"Comment dit-on 'petit-déjeuner' en portugais ?", opts:["Jantar","Almoço","Café da manhã","Lanche"], a:"Café da manhã" },
      { q:"O que significa 'dever de casa'?", q_fr:"Que signifie 'dever de casa' ?", opts:["Atividade física","Tarefa da escola","Trabalho do lar","Regra da casa"], a:"Tarefa da escola" },
      { q:"'Celular' em português significa:", q_fr:"'Celular' en portugais signifie :", opts:["Tablet","Computador","Smartphone","Câmera"], a:"Smartphone" },
      { q:"Como se diz 'je dors à 22h' em português?", q_fr:"Comment dit-on 'je dors à 22h' en portugais ?", opts:["Acordo às 22h","Durmo às 22h","Almoço às 22h","Janto às 22h"], a:"Durmo às 22h" },
      { q:"Qual é o prato mais popular no almoço brasileiro?", q_fr:"Quel est le plat le plus populaire au déjeuner brésilien ?", opts:["Pizza","Crepe","Arroz com feijão","Sanduíche"], a:"Arroz com feijão" },
      { q:"'Tô morto de sono' quer dizer:", q_fr:"'Tô morto de sono' veut dire :", opts:["Estou animado","Estou acordado","Tenho muito sono","Quero comer"], a:"Tenho muito sono" },
    ],
  },

  {
    id: "compras",
    title: "Compras",
    emoji: "🛍️",
    color: "#ec4899",
    gradient: "linear-gradient(135deg,#ec4899,#8b5cf6)",
    desc: "Aprenda a fazer compras em português!",
    desc_fr: "Apprenez à faire des achats en portugais !",
    locked: false,
    sections: ["vocab","phrases","dialogue","cultural","formal"],
    vocab: [
      { pt:"loja", fr:"magasin / boutique", example:"Fui à loja comprar tênis.", example_fr:"Je suis allé(e) au magasin acheter des baskets.", level:1, tag:"lugar" },
      { pt:"shopping", fr:"centre commercial", example:"A gente foi ao shopping.", example_fr:"On est allé(e)s au centre commercial.", level:1, tag:"lugar" },
      { pt:"preço", fr:"prix", example:"Qual é o preço?", example_fr:"Quel est le prix ?", level:1, tag:"compra" },
      { pt:"barato / caro", fr:"bon marché / cher", example:"Esse tênis é caro!", example_fr:"Ces baskets sont chères !", level:1, tag:"adjetivo" },
      { pt:"promoção", fr:"promotion / soldes", example:"Tem promoção hoje!", example_fr:"Il y a des soldes aujourd'hui !", level:2, tag:"compra" },
      { pt:"troco", fr:"monnaie (rendu)", example:"O troco é dois reais.", example_fr:"La monnaie rendue est deux reais.", level:2, tag:"dinheiro" },
      { pt:"cartão de crédito", fr:"carte de crédit", example:"Posso pagar no cartão?", example_fr:"Je peux payer par carte ?", level:2, tag:"dinheiro" },
      { pt:"dinheiro", fr:"argent", example:"Não tenho dinheiro.", example_fr:"Je n'ai pas d'argent.", level:1, tag:"dinheiro" },
      { pt:"vitrine", fr:"vitrine", example:"Vi na vitrine e adorei!", example_fr:"Je l'ai vu dans la vitrine et j'ai adoré !", level:2, tag:"loja" },
      { pt:"tamanho", fr:"taille", example:"Qual é o seu tamanho?", example_fr:"Quelle est votre taille ?", level:2, tag:"roupa" },
      { pt:"experimentar", fr:"essayer", example:"Posso experimentar?", example_fr:"Je peux essayer ?", level:2, tag:"verbo" },
      { pt:"recibo", fr:"reçu / ticket de caisse", example:"Pode me dar o recibo?", example_fr:"Pouvez-vous me donner le reçu ?", level:3, tag:"compra" },
    ],
    phrases: [
      { pt:"Quanto custa esse aqui?", fr:"Combien ça coûte celui-ci ?", note:"Forma natural de perguntar o preço no Brasil.", note_fr:"Façon naturelle de demander le prix au Brésil." },
      { pt:"Tem esse em outro tamanho?", fr:"Vous avez ça dans une autre taille ?", note:"Essencial na hora de comprar roupa.", note_fr:"Essentiel quand on achète des vêtements." },
      { pt:"Posso pagar no cartão?", fr:"Je peux payer par carte ?", note:"Pergunta muito comum em lojas brasileiras.", note_fr:"Question très courante dans les magasins brésiliens." },
      { pt:"Está muito caro! Tem desconto?", fr:"C'est trop cher ! Vous faites un rabais ?", note:"Pedir desconto é normal e aceito no comércio informal.", note_fr:"Demander une réduction est normal et accepté dans le commerce informel." },
      { pt:"Vou levar esse!", fr:"Je vais prendre celui-ci !", note:"Forma natural de confirmar a compra.", note_fr:"Façon naturelle de confirmer l'achat." },
      { pt:"Pode embrulhar para presente?", fr:"Vous pouvez faire un emballage cadeau ?", note:"Serviço comum em lojas de shopping.", note_fr:"Service courant dans les boutiques des centres commerciaux." },
      { pt:"Onde fica o provador?", fr:"Où sont les cabines d'essayage ?", note:"'Provador' = cabine d'essayage.", note_fr:"'Provador' = cabine d'essayage." },
      { pt:"Esse não me agradou. Tem outro modelo?", fr:"Celui-ci ne me plaît pas. Vous avez un autre modèle ?", note:"Tom educado para pedir outra opção.", note_fr:"Ton poli pour demander une autre option." },
    ],
    dialogue: [
      { who:"lucas", text:"Ei! Você foi ao shopping ontem?", fr:"Hé ! Tu es allé(e) au centre commercial hier ?" },
      { who:"aluno", text:"Fui sim! Fui comprar um presente pro meu irmão. O aniversário dele é amanhã!", fr:"Oui ! Je suis allé(e) acheter un cadeau pour mon frère. C'est son anniversaire demain !" },
      { who:"lucas", text:"Que legal! O que você comprou pra ele?", fr:"Super ! Qu'est-ce que tu lui as acheté ?" },
      { who:"aluno", text:"Comprei uma camiseta do time dele. Mas foi meio cara...", fr:"J'ai acheté un t-shirt de son équipe. Mais c'était un peu cher..." },
      { who:"lucas", text:"Tinha promoção não?", fr:"Il n'y avait pas de soldes ?" },
      { who:"aluno", text:"Tinha sim, mas mesmo assim... Pedi desconto e o vendedor deu 10%!", fr:"Si, mais quand même... J'ai demandé une réduction et le vendeur m'en a accordé 10% !" },
      { who:"lucas", text:"Arrasou! Pagou no cartão ou em dinheiro?", fr:"Trop fort ! Tu as payé par carte ou en liquide ?" },
      { who:"aluno", text:"No cartão da minha mãe... mas vou pagar de volta com a mesada!", fr:"Avec la carte de ma mère... mais je vais rembourser avec mon argent de poche !" },
    ],
    cultural: [
      { tip:"🛍️ Shopping no Brasil", text:"Os shoppings no Brasil são enormes e são pontos de encontro social. Os jovens brasileiros adoram ir ao shopping não só para comprar, mas para se encontrar com amigos.", text_fr:"Les centres commerciaux au Brésil sont énormes et constituent des points de rencontre sociaux. Les jeunes Brésiliens adorent aller au shopping non seulement pour acheter, mais pour retrouver des amis." },
      { tip:"💰 Pedir desconto", text:"No Brasil, especialmente em lojas pequenas e mercados, pedir desconto é totalmente normal e esperado. Não é grosseiro — é parte da cultura!", text_fr:"Au Brésil, surtout dans les petits commerces et les marchés, demander une réduction est tout à fait normal et attendu. Ce n'est pas impoli — c'est partie de la culture !" },
      { tip:"💳 Parcelado sem juros", text:"No Brasil existe uma coisa chamada 'parcelado sem juros' — você pode pagar em várias vezes no cartão sem pagar a mais. Muito popular!", text_fr:"Au Brésil, il existe une chose appelée 'parcelado sem juros' — vous pouvez payer en plusieurs fois par carte sans surcoût. Très populaire !" },
      { tip:"💵 Real brasileiro", text:"A moeda do Brasil é o Real (R$). Em 2024, 1 euro vale aproximadamente 5-6 reais. As notas têm animais brasileiros impressos!", text_fr:"La monnaie du Brésil est le Real (R$). En 2024, 1 euro vaut environ 5-6 reais. Les billets ont des animaux brésiliens imprimés !" },
    ],
    formal_informal: [
      {
        tema:"Perguntar o preço",
        formal:{ pt:"Qual é o preço deste produto?", fr:"Quel est le prix de ce produit ?" },
        informal:{ pt:"Quanto tá isso aqui?", fr:"C'est combien ça ?" },
        explanation:"'Quanto tá?' é a forma mais natural e usada nas lojas brasileiras. 'Tá' é uma contração de 'está'.",
        explanation_fr:"'Quanto tá?' est la forme la plus naturelle utilisée dans les magasins brésiliens. 'Tá' est une contraction de 'está'."
      },
      {
        tema:"Dizer que está caro",
        formal:{ pt:"Este produto está muito caro.", fr:"Ce produit est très cher." },
        informal:[{ pt:"Tá salgado!", fr:"C'est salé !" },{ pt:"Tá na hora errada!", fr:"C'est hors de prix !" }],
        explanation:"'Tá salgado' é uma gíria brasileira muito comum para dizer que algo está muito caro. Literalmente significa 'está salgado'!",
        explanation_fr:"'Tá salgado' est un argot brésilien très courant pour dire que quelque chose est très cher. Littéralement ça signifie 'c'est salé' !"
      },
      {
        tema:"Confirmar a compra",
        formal:{ pt:"Vou levar este produto.", fr:"Je vais prendre ce produit." },
        informal:[{ pt:"Vou levar!", fr:"Je le prends !" },{ pt:"Peguei!", fr:"Je le prends !" }],
        explanation:"'Peguei!' é muito informal e animado, usado quando você está empolgado com a compra.",
        explanation_fr:"'Peguei!' est très informel et enthousiaste, utilisé quand vous êtes excité par l'achat."
      },
    ],
    quiz: [
      { q:"Como se diz 'centre commercial' em português?", q_fr:"Comment dit-on 'centre commercial' en portugais ?", opts:["Mercado","Feira","Shopping","Bazar"], a:"Shopping" },
      { q:"'Quanto tá isso?' significa:", q_fr:"'Quanto tá isso?' signifie :", opts:["Onde está isso?","Quanto custa isso?","Você quer isso?","Quando chega isso?"], a:"Quanto custa isso?" },
      { q:"'Tá salgado!' quer dizer:", q_fr:"'Tá salgado!' veut dire :", opts:["Está com gosto de sal","Está muito caro","Está muito bom","Está em promoção"], a:"Está muito caro" },
      { q:"Onde se experimenta roupa na loja?", q_fr:"Où essaie-t-on des vêtements dans le magasin ?", opts:["Balcão","Vitrine","Provador","Caixa"], a:"Provador" },
      { q:"Como pedir desconto em português?", q_fr:"Comment demander une réduction en portugais ?", opts:["Tem troco?","Tem desconto?","Tem promoção de outra loja?","Tem vitrine?"], a:"Tem desconto?" },
      { q:"'Parcelado' significa:", q_fr:"'Parcelado' signifie :", opts:["Pago de uma vez","Gratuito","Pago em várias vezes","Com desconto"], a:"Pago em várias vezes" },
    ],
  },

  {
    id: "casa",
    title: "A Casa",
    emoji: "🏠",
    color: "#10b981",
    gradient: "linear-gradient(135deg,#10b981,#3b82f6)",
    desc: "Descubra os cômodos e objetos da casa brasileira!",
    desc_fr: "Découvrez les pièces et objets de la maison brésilienne !",
    locked: false,
    sections: ["vocab","phrases","dialogue","cultural","formal"],
    vocab: [
      { pt:"sala de estar", fr:"salon", example:"A sala de estar é grande.", example_fr:"Le salon est grand.", level:1, tag:"cômodo" },
      { pt:"quarto", fr:"chambre", example:"Meu quarto é do meu jeito.", example_fr:"Ma chambre est à mon goût.", level:1, tag:"cômodo" },
      { pt:"cozinha", fr:"cuisine", example:"A cozinha cheira bem.", example_fr:"La cuisine sent bon.", level:1, tag:"cômodo" },
      { pt:"banheiro", fr:"salle de bain / toilettes", example:"O banheiro tem chuveiro.", example_fr:"La salle de bain a une douche.", level:1, tag:"cômodo" },
      { pt:"varanda", fr:"balcon / véranda", example:"Tem varanda com vista.", example_fr:"Il y a un balcon avec vue.", level:2, tag:"cômodo" },
      { pt:"geladeira", fr:"réfrigérateur / frigo", example:"Coloquei na geladeira.", example_fr:"Je l'ai mis au frigo.", level:1, tag:"objeto" },
      { pt:"fogão", fr:"cuisinière / gazinière", example:"O fogão é a gás.", example_fr:"La cuisinière est au gaz.", level:2, tag:"objeto" },
      { pt:"sofá", fr:"canapé", example:"O sofá é confortável.", example_fr:"Le canapé est confortable.", level:1, tag:"objeto" },
      { pt:"chuveiro", fr:"douche", example:"O chuveiro é elétrico.", example_fr:"La douche est électrique.", level:2, tag:"objeto" },
      { pt:"armário", fr:"armoire / placard", example:"Meu armário está cheio.", example_fr:"Mon armoire est pleine.", level:2, tag:"objeto" },
      { pt:"janela", fr:"fenêtre", example:"Abri a janela para arejar.", example_fr:"J'ai ouvert la fenêtre pour aérer.", level:1, tag:"objeto" },
      { pt:"portão", fr:"portail / portillon", example:"O portão fica fechado.", example_fr:"Le portail reste fermé.", level:2, tag:"objeto" },
    ],
    phrases: [
      { pt:"Minha casa tem três quartos.", fr:"Ma maison a trois chambres.", note:"Forma direta de descrever a casa.", note_fr:"Façon directe de décrire la maison." },
      { pt:"Eu divido o quarto com meu irmão.", fr:"Je partage la chambre avec mon frère.", note:"Situação muito comum nas casas brasileiras.", note_fr:"Situation très courante dans les maisons brésiliennes." },
      { pt:"A gente tem quintal com churrasqueira.", fr:"Nous avons un jardin avec un barbecue.", note:"A churrasqueira é muito comum nas casas brasileiras!", note_fr:"Le barbecue brésilien est très courant dans les maisons brésiliennes !" },
      { pt:"Posso usar a sua internet?", fr:"Je peux utiliser ton wi-fi ?", note:"Frase muito usada quando se visita alguém.", note_fr:"Phrase très utilisée quand on rend visite à quelqu'un." },
      { pt:"Estou no meu quarto jogando.", fr:"Je suis dans ma chambre en train de jouer.", note:"Resposta clássica para 'onde você está?'.", note_fr:"Réponse classique à 'où es-tu ?'." },
      { pt:"A minha casa fica perto da escola.", fr:"Ma maison est près de l'école.", note:"'Fica perto de' = se trouve près de.", note_fr:"'Fica perto de' = se trouve près de." },
      { pt:"Tem alguém em casa?", fr:"Il y a quelqu'un à la maison ?", note:"Pergunta típica ao chegar em casa.", note_fr:"Question typique en rentrant chez soi." },
      { pt:"Pode entrar, está aberto!", fr:"Tu peux entrer, c'est ouvert !", note:"Bienvenida casual e descontraída.", note_fr:"Bienvenue décontractée et informelle." },
    ],
    dialogue: [
      { who:"lucas", text:"Como é a sua casa? Me conta!", fr:"Comment est ta maison ? Raconte-moi !" },
      { who:"aluno", text:"É um apartamento no quinto andar! Não tem quintal, mas tem uma varanda legal.", fr:"C'est un appartement au cinquième étage ! Il n'y a pas de jardin, mais il y a un beau balcon." },
      { who:"lucas", text:"Você gosta de apartamento?", fr:"Tu aimes les appartements ?" },
      { who:"aluno", text:"Sim! Tenho vizinhos legais e não preciso cortar grama! Haha!", fr:"Oui ! J'ai de bons voisins et je n'ai pas besoin de tondre la pelouse ! Haha !" },
      { who:"lucas", text:"Qual é o cômodo favorito?", fr:"Quelle est ta pièce préférée ?" },
      { who:"aluno", text:"Com certeza o meu quarto! Tenho minha mesa de estudos, meu PC e meu controle. É meu cantinho!", fr:"Sans aucun doute ma chambre ! J'ai mon bureau, mon PC et ma manette. C'est mon petit coin !" },
      { who:"lucas", text:"E a churrasqueira? Apartamento tem?", fr:"Et le barbecue ? Les appartements en ont un ?" },
      { who:"aluno", text:"No nosso tem no terraço do prédio! Todo fim de semana o pessoal faz churrasco lá!", fr:"Le nôtre en a un sur le toit de l'immeuble ! Chaque week-end les gens font un barbecue là-haut !" },
    ],
    cultural: [
      { tip:"🏢 Apartamentos x Casas", text:"Em São Paulo e outras grandes cidades brasileiras, a maioria das pessoas mora em apartamentos. Casas com quintal são mais comuns em cidades menores ou bairros afastados.", text_fr:"À São Paulo et dans d'autres grandes villes brésiliennes, la plupart des gens vivent en appartement. Les maisons avec jardin sont plus courantes dans les petites villes ou les quartiers éloignés." },
      { tip:"🥩 Churrasco", text:"O churrasco é uma tradição muito importante no Brasil! É como um barbecue, mas com carnes como picanha, fraldinha e linguiça. Acontece principalmente nos fins de semana.", text_fr:"Le churrasco est une tradition très importante au Brésil ! C'est comme un barbecue, mais avec des viandes comme la picanha, la fraldinha et la linguiça. Ça se passe principalement le week-end." },
      { tip:"🚿 Chuveiro elétrico", text:"No Brasil, a maioria dos chuveiros são elétricos — eles esquentam a água na hora! Isso é muito diferente dos aquecedores centrais da França.", text_fr:"Au Brésil, la plupart des douches sont électriques — elles chauffent l'eau instantanément ! C'est très différent des chaudières centrales de France." },
      { tip:"🏙️ Condomínio", text:"Muitos apartamentos no Brasil ficam em 'condomínios' — são conjuntos de prédios com área comum, piscina, playground e salão de festas. É muito popular!", text_fr:"Beaucoup d'appartements au Brésil se trouvent dans des 'condomínios' — ce sont des ensembles de bâtiments avec des espaces communs, piscine, aire de jeux et salle des fêtes. C'est très populaire !" },
    ],
    formal_informal: [
      {
        tema:"Dizer onde mora",
        formal:{ pt:"Eu moro em um apartamento.", fr:"J'habite dans un appartement." },
        informal:[{ pt:"Moro num apto.", fr:"J'habite dans un appart." },{ pt:"Moro num apartamento aqui pertinho.", fr:"J'habite dans un appart tout près d'ici." }],
        explanation:"'Apto' é a abreviação informal e muito usada de 'apartamento'. Como 'appart' em francês!",
        explanation_fr:"'Apto' est l'abréviation informelle très utilisée de 'apartamento'. Comme 'appart' en français !"
      },
      {
        tema:"Descrever o quarto",
        formal:{ pt:"O meu quarto é bem organizado.", fr:"Ma chambre est bien organisée." },
        informal:[{ pt:"Meu quarto tá uma bagunça!", fr:"Ma chambre est un vrai bazar !" },{ pt:"Tá uma zona aqui!", fr:"C'est le bazar ici !" }],
        explanation:"'Bagunça' e 'zona' significam desordem. 'Tá uma bagunça' é muito comum no vocabulário adolescente brasileiro.",
        explanation_fr:"'Bagunça' et 'zona' signifient désordre. 'Tá uma bagunça' est très courant dans le vocabulaire adolescent brésilien."
      },
      {
        tema:"Convidar para entrar",
        formal:{ pt:"Por favor, entre.", fr:"S'il vous plaît, entrez." },
        informal:[{ pt:"Pode entrar!", fr:"Entre !" },{ pt:"Vem!", fr:"Viens !" }],
        explanation:"'Vem!' é o convite mais simples e direto. Muito usado entre amigos e família.",
        explanation_fr:"'Vem!' est l'invitation la plus simple et directe. Très utilisée entre amis et famille."
      },
    ],
    quiz: [
      { q:"Como se diz 'salon' em português?", q_fr:"Comment dit-on 'salon' en portugais ?", opts:["Quarto","Cozinha","Sala de estar","Banheiro"], a:"Sala de estar" },
      { q:"'Churrasco' é:", q_fr:"'Churrasco' c'est :", opts:["Um tipo de jogo","Uma festa de aniversário","Um barbecue brasileiro","Um prato de massa"], a:"Um barbecue brasileiro" },
      { q:"'Apto' é a abreviação de:", q_fr:"'Apto' est l'abréviation de :", opts:["Autoconceito","Apartamento","Aprontado","Apontador"], a:"Apartamento" },
      { q:"'Tá uma bagunça!' significa:", q_fr:"'Tá uma bagunça!' signifie :", opts:["Está organizado","Está em promoção","Está em desordem","Está bonito"], a:"Está em desordem" },
      { q:"O que é 'condomínio'?", q_fr:"Qu'est-ce qu'un 'condomínio' ?", opts:["Uma loja","Um conjunto de prédios com área comum","Um bairro","Um mercado"], a:"Um conjunto de prédios com área comum" },
      { q:"'Vem!' é uma forma de:", q_fr:"'Vem!' est une façon de :", opts:["Pedir para sair","Convidar para entrar","Perguntar o caminho","Dizer adeus"], a:"Convidar para entrar" },
    ],
  },

  {
    id: "hobbies",
    title: "Gostos e Hobbies",
    emoji: "🎮",
    color: "#a855f7",
    gradient: "linear-gradient(135deg,#a855f7,#3b82f6)",
    desc: "Fale sobre o que você curte e seus hobbies!",
    desc_fr: "Parlez de ce que vous aimez et de vos hobbies !",
    locked: false,
    sections: ["vocab","phrases","dialogue","cultural","formal"],
    vocab: [
      { pt:"hobby", fr:"hobby / loisir", example:"Meu hobby favorito é desenhar.", example_fr:"Mon hobby préféré est de dessiner.", level:1, tag:"geral" },
      { pt:"videogame", fr:"jeu vidéo", example:"Jogo videogame todo dia.", example_fr:"Je joue aux jeux vidéo tous les jours.", level:1, tag:"jogo" },
      { pt:"futebol", fr:"football", example:"Adoro jogar futebol.", example_fr:"J'adore jouer au football.", level:1, tag:"esporte" },
      { pt:"música", fr:"musique", example:"Ouço música o tempo todo.", example_fr:"J'écoute de la musique tout le temps.", level:1, tag:"arte" },
      { pt:"anime", fr:"anime (dessin animé japonais)", example:"Meu anime favorito é Naruto.", example_fr:"Mon anime préféré est Naruto.", level:1, tag:"entretenimento" },
      { pt:"desenhar", fr:"dessiner", example:"Adoro desenhar personagens.", example_fr:"J'adore dessiner des personnages.", level:1, tag:"arte" },
      { pt:"dançar", fr:"danser", example:"Aprendo a dançar funk.", example_fr:"J'apprends à danser le funk.", level:1, tag:"arte" },
      { pt:"TikTok", fr:"TikTok", example:"Assisto muito TikTok.", example_fr:"Je regarde beaucoup de TikTok.", level:1, tag:"redes" },
      { pt:"YouTube", fr:"YouTube", example:"Vejo YouTube antes de dormir.", example_fr:"Je regarde YouTube avant de dormir.", level:1, tag:"redes" },
      { pt:"curtir", fr:"aimer / kiffer (informel)", example:"Eu curto muito música!", example_fr:"J'aime beaucoup la musique !", level:2, tag:"verbo-inf" },
      { pt:"ser fã de", fr:"être fan de", example:"Sou fã do Flamengo.", example_fr:"Je suis fan du Flamengo.", level:2, tag:"expressão" },
      { pt:"treino", fr:"entraînement", example:"Tenho treino hoje.", example_fr:"J'ai entraînement aujourd'hui.", level:2, tag:"esporte" },
    ],
    phrases: [
      { pt:"Você gosta de videogame?", fr:"Tu aimes les jeux vidéo ?", note:"Pergunta formal/padrão sobre preferências.", note_fr:"Question formelle/standard sur les préférences." },
      { pt:"Curte jogar videogame?", fr:"Tu kiffes les jeux vidéo ?", note:"Versão informal e jovem. 'Curtir' = apprécier, aimer.", note_fr:"Version informelle et jeune. 'Curtir' = apprécier, aimer." },
      { pt:"Eu gosto de ouvir música.", fr:"J'aime écouter de la musique.", note:"Estrutura: gosto de + infinitivo.", note_fr:"Structure : gosto de + infinitif." },
      { pt:"Não sou muito fã de esporte.", fr:"Je ne suis pas très fan de sport.", note:"Forma natural de dizer que não gosta de algo.", note_fr:"Façon naturelle de dire qu'on n'aime pas quelque chose." },
      { pt:"Meu hobby favorito é desenhar.", fr:"Mon hobby préféré est de dessiner.", note:"Estrutura: hobby favorito é + infinitivo.", note_fr:"Structure : hobby favorito é + infinitif." },
      { pt:"Você joga futebol?", fr:"Tu joues au football ?", note:"Sempre 'você' — nunca 'tu jogas' em São Paulo.", note_fr:"Toujours 'você' — jamais 'tu jogas' à São Paulo." },
      { pt:"Eu amo dançar, principalmente funk.", fr:"J'adore danser, surtout le funk.", note:"'Principalmente' = surtout. Expressão muito natural.", note_fr:"'Principalmente' = surtout. Expression très naturelle." },
      { pt:"Assisto muito anime, você também?", fr:"Je regarde beaucoup d'anime, et toi ?", note:"'Você também?' = Et toi ? Muito usado em conversas.", note_fr:"'Você também?' = Et toi ? Très utilisé dans les conversations." },
    ],
    dialogue: [
      { who:"lucas", text:"Ei! O que você curte fazer nas horas livres?", fr:"Hé ! Qu'est-ce que tu aimes faire pendant ton temps libre ?" },
      { who:"aluno", text:"Gosto de muitas coisas! Jogo videogame, ouço música e assisto anime. Ah, e às vezes danço também!", fr:"J'aime plein de choses ! Je joue aux jeux vidéo, j'écoute de la musique et je regarde des animes. Ah, et parfois je danse aussi !" },
      { who:"lucas", text:"Que legal! Qual anime você curte?", fr:"Super ! Quel anime tu aimes ?" },
      { who:"aluno", text:"Adoro Attack on Titan e One Piece! Você conhece?", fr:"J'adore Attack on Titan et One Piece ! Tu connais ?" },
      { who:"lucas", text:"Claro! No Brasil os jovens adoram anime também! Tem muita comunidade de anime.", fr:"Bien sûr ! Au Brésil les jeunes adorent aussi les animes ! Il y a beaucoup de communautés d'anime." },
      { who:"aluno", text:"Sério?! Que incrível! E você, tem algum hobby?", fr:"Vraiment ?! C'est incroyable ! Et toi, tu as un hobby ?" },
      { who:"lucas", text:"Gosto de futebol, claro! Sou fã do Flamengo. E também curto cozinhar.", fr:"J'aime le football, bien sûr ! Je suis fan du Flamengo. Et j'aime aussi cuisiner." },
      { who:"aluno", text:"Você cozinha?! Que diferente! Eu não sei cozinhar nada... só comer! Haha!", fr:"Tu cuisines ?! Comme c'est différent ! Moi je ne sais pas cuisiner du tout... juste manger ! Haha !" },
    ],
    cultural: [
      { tip:"⚽ Futebol é paixão nacional", text:"No Brasil, o futebol não é só um esporte — é uma paixão nacional. Times como Flamengo, Corinthians e Palmeiras têm torcidas enormes em todo o país. Perguntar 'qual é o seu time?' é quase obrigatório!", text_fr:"Au Brésil, le football n'est pas seulement un sport — c'est une passion nationale. Des clubs comme Flamengo, Corinthians et Palmeiras ont d'immenses supporteurs dans tout le pays. Demander 'quel est ton club ?' est presque obligatoire !" },
      { tip:"🎵 Curtir x Gostar", text:"'Curtir' é a versão informal e jovem de 'gostar'. Os adolescentes brasileiros usam 'curtir' o tempo todo! 'Curto muito isso' = J'aime beaucoup ça. Mas cuidado: 'curtir uma foto' nas redes sociais = liker une photo.", text_fr:"'Curtir' est la version informelle et jeune de 'gostar'. Les adolescents brésiliens utilisent 'curtir' tout le temps ! 'Curto muito isso' = J'aime beaucoup ça. Mais attention : 'curtir uma foto' sur les réseaux sociaux = liker une photo." },
      { tip:"🎌 Cultura Anime no Brasil", text:"O Brasil tem uma das maiores comunidades de anime fora do Japão! São Paulo tem festivais como a Anime Friends, um dos maiores eventos de cultura pop japonesa do mundo. Os jovens brasileiros são muito fãs!", text_fr:"Le Brésil a l'une des plus grandes communautés d'anime en dehors du Japon ! São Paulo a des festivals comme Anime Friends, l'un des plus grands événements de culture pop japonaise au monde. Les jeunes Brésiliens sont de grands fans !" },
      { tip:"🕺 Funk Carioca", text:"O funk é um ritmo musical muito popular entre os jovens brasileiros. Nasceu no Rio de Janeiro mas conquistou todo o Brasil. Artistas como Anitta e MC Kevinho são famosos no mundo todo.", text_fr:"Le funk est un rythme musical très populaire chez les jeunes Brésiliens. Il est né à Rio de Janeiro mais a conquis tout le Brésil. Des artistes comme Anitta et MC Kevinho sont célèbres dans le monde entier." },
    ],
    formal_informal: [
      {
        tema:"Dizer que gosta de algo",
        formal:{ pt:"Eu gosto de videogame.", fr:"J'aime les jeux vidéo." },
        informal:[{ pt:"Curto muito videogame!", fr:"Je kiffe les jeux vidéo !" },{ pt:"Sou viciado(a) em videogame!", fr:"Je suis accro aux jeux vidéo !" }],
        explanation:"'Curtir' é mais jovem e informal que 'gostar'. 'Sou viciado(a)' (je suis accro) é uma hipérbole usada pelos jovens para falar de coisas que adoram.",
        explanation_fr:"'Curtir' est plus jeune et informel que 'gostar'. 'Sou viciado(a)' (je suis accro) est une hyperbole utilisée par les jeunes pour parler de choses qu'ils adorent."
      },
      {
        tema:"Perguntar sobre hobbies",
        formal:{ pt:"Você gosta de música?", fr:"Tu aimes la musique ?" },
        informal:[{ pt:"Curte música?", fr:"Tu kiffes la musique ?" },{ pt:"Você é da música?", fr:"Tu es dans la musique ?" }],
        explanation:"'Você é da música?' é uma expressão informal que significa 'você gosta muito de música / você está envolvido com música?'.",
        explanation_fr:"'Você é da música?' est une expression informelle qui signifie 'tu aimes beaucoup la musique / tu es impliqué dans la musique ?'."
      },
      {
        tema:"Dizer que não gosta",
        formal:{ pt:"Eu não gosto de acordar cedo.", fr:"Je n'aime pas me réveiller tôt." },
        informal:[{ pt:"Não tô a fim de acordar cedo.", fr:"J'ai pas envie de me lever tôt." },{ pt:"Odeio acordar cedo!", fr:"Je déteste me lever tôt !" }],
        explanation:"'Não tô a fim de' é uma expressão muito usada pelos jovens brasileiros. Significa 'não tenho vontade de / je n'ai pas envie de'. É informal mas muito natural.",
        explanation_fr:"'Não tô a fim de' est une expression très utilisée par les jeunes Brésiliens. Elle signifie 'je n'ai pas envie de'. C'est informel mais très naturel."
      },
    ],
    quiz: [
      { q:"'Curtir' é a forma informal de:", q_fr:"'Curtir' est la forme informelle de :", opts:["Comer","Gostar","Trabalhar","Estudar"], a:"Gostar" },
      { q:"Como perguntar sobre hobbies de forma informal?", q_fr:"Comment demander les hobbies de façon informelle ?", opts:["Você possui hobbies?","Quais são seus interesses?","Curte fazer o quê?","Tem preferências de lazer?"], a:"Curte fazer o quê?" },
      { q:"'Não tô a fim' significa:", q_fr:"'Não tô a fim' signifie :", opts:["Estou muito animado","Não tenho vontade","Não entendo","Não sei"], a:"Não tenho vontade" },
      { q:"'Sou viciado em anime' é uma forma de dizer:", q_fr:"'Sou viciado em anime' est une façon de dire :", opts:["Não gosto de anime","Adoro muito anime","Assisto anime às vezes","Vou começar anime"], a:"Adoro muito anime" },
      { q:"Qual é o nome do maior festival de anime no Brasil?", q_fr:"Quel est le nom du plus grand festival d'anime au Brésil ?", opts:["Japan Expo","Comic-Con","Anime Friends","AniFest"], a:"Anime Friends" },
      { q:"'Você é da música?' significa:", q_fr:"'Você é da música?' signifie :", opts:["Você trabalha em música?","Você gosta muito de música?","Você toca um instrumento?","Você foi a um show?"], a:"Você gosta muito de música?" },
    ],
  },
];

// ─── Island styles ────────────────────────────────────────────────────────────
const isl = {
  page: { fontFamily:"'Georgia',serif", color:"#fff", minHeight:"100vh", background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)", paddingBottom:48 },
  header: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"rgba(0,0,0,0.3)", borderBottom:"1px solid rgba(255,255,255,0.08)" },
  backBtn: { background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:13, fontFamily:"'Georgia',serif" },
  headerTitle: { color:"#fff", fontWeight:"bold", fontSize:17 },
  heroBox: { textAlign:"center", padding:"28px 16px 20px" },
  heroEmoji: { fontSize:54, display:"block", marginBottom:10 },
  heroTitle: { color:"#fff", fontSize:22, fontWeight:"bold", margin:"0 0 6px" },
  heroDesc: { color:"rgba(255,255,255,0.55)", fontSize:14, margin:0, lineHeight:1.5 },
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, padding:"0 14px" },
  card: { borderRadius:18, padding:"20px 16px", cursor:"pointer", position:"relative", overflow:"hidden", transition:"transform .15s", userSelect:"none" },
  cardEmoji: { fontSize:36, display:"block", marginBottom:8 },
  cardTitle: { color:"#fff", fontSize:16, fontWeight:"bold", margin:"0 0 4px" },
  cardDesc: { color:"rgba(255,255,255,0.6)", fontSize:12, margin:0, lineHeight:1.4 },
  progressBar: { height:4, borderRadius:10, background:"rgba(255,255,255,0.15)", marginTop:10, overflow:"hidden" },
  progressFill: { height:"100%", borderRadius:10, background:"rgba(255,255,255,0.5)", transition:"width .4s" },
  doneBadge: { position:"absolute", top:10, right:10, background:"rgba(34,197,94,0.3)", color:"#86efac", borderRadius:20, padding:"2px 8px", fontSize:11, fontWeight:"bold", border:"1px solid rgba(34,197,94,0.4)" },
  // detail
  detailPage: { fontFamily:"'Georgia',serif", color:"#fff", minHeight:"100vh", background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)", paddingBottom:64 },
  sectionTabs: { display:"flex", background:"rgba(0,0,0,0.25)", borderBottom:"1px solid rgba(255,255,255,0.07)", overflowX:"auto" },
  sTab: { flexShrink:0, padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,0.4)", cursor:"pointer", border:"none", background:"none", fontFamily:"'Georgia',serif", borderBottom:"3px solid transparent", whiteSpace:"nowrap" },
  sTabActive: { color:"#fff", fontWeight:"bold", borderBottom:"3px solid #a78bfa" },
  section: { padding:"14px", maxWidth:520, margin:"0 auto" },
  sectionTitle: { color:"#fbbf24", fontWeight:"bold", fontSize:13, margin:"0 0 12px", letterSpacing:.5 },
  // vocab card
  vocabGrid: { display:"flex", flexDirection:"column", gap:10 },
  vocabCard: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:14, padding:"12px 14px" },
  vocabPt: { color:"#fff", fontSize:16, fontWeight:"bold", margin:"0 0 2px" },
  vocabFr: { color:"#93c5fd", fontSize:13, margin:"0 0 6px" },
  vocabEx: { color:"rgba(255,255,255,0.45)", fontSize:12, fontStyle:"italic", margin:0 },
  vocabTag: { display:"inline-block", background:"rgba(167,139,250,0.2)", color:"#c4b5fd", borderRadius:20, padding:"1px 8px", fontSize:10, marginTop:6 },
  vocabAudio: { background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", borderRadius:9999, padding:"4px 10px", cursor:"pointer", fontSize:12, marginLeft:8 },
  // phrase card
  phraseCard: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:14, padding:"13px 14px", marginBottom:10 },
  phrasePt: { color:"#fff", fontSize:15, fontWeight:"bold", margin:"0 0 3px" },
  phraseFr: { color:"#93c5fd", fontSize:13, margin:"0 0 6px" },
  phraseNote: { background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:8, padding:"7px 10px", fontSize:12, color:"rgba(255,255,255,0.55)", margin:0, lineHeight:1.45 },
  // dialogue (re-use cv styles)
  // cultural tip
  tipCard: { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px", marginBottom:12 },
  tipTitle: { color:"#fbbf24", fontWeight:"bold", fontSize:13, margin:"0 0 6px" },
  tipText: { color:"rgba(255,255,255,0.65)", fontSize:13, margin:0, lineHeight:1.55 },
  tipFr: { color:"rgba(255,255,255,0.4)", fontSize:12, fontStyle:"italic", marginTop:6, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:6 },
  // formal/informal
  fiCard: { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px", marginBottom:14 },
  fiTema: { color:"#fbbf24", fontWeight:"bold", fontSize:12, margin:"0 0 10px" },
  fiRow: { display:"flex", gap:8, marginBottom:8, flexWrap:"wrap" },
  fiLabel: { fontSize:10, fontWeight:"bold", borderRadius:20, padding:"2px 8px", marginBottom:4 },
  fiLabelFormal: { background:"rgba(96,217,250,0.15)", color:"#60d9fa", border:"1px solid rgba(96,217,250,0.3)" },
  fiLabelInformal: { background:"rgba(167,139,250,0.15)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.3)" },
  fiPt: { color:"#fff", fontSize:14, fontWeight:"bold", margin:"0 0 1px" },
  fiFr: { color:"#93c5fd", fontSize:12, margin:0 },
  fiBox: { background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"8px 10px", flex:1, minWidth:140 },
  fiExpl: { background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.18)", borderRadius:8, padding:"8px 10px", fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:8, lineHeight:1.5 },
  // cta unlock quiz
  unlockBox: { background:"linear-gradient(135deg,rgba(124,58,237,.25),rgba(37,99,235,.25))", border:"1px solid rgba(167,139,250,0.3)", borderRadius:16, padding:"20px 16px", textAlign:"center", margin:"20px 14px 0" },
  unlockTitle: { color:"#fff", fontWeight:"bold", fontSize:16, margin:"0 0 6px" },
  unlockSub: { color:"rgba(255,255,255,0.55)", fontSize:13, margin:"0 0 14px" },
  unlockBtn: { padding:"13px 28px", background:"linear-gradient(135deg,#7c3aed,#2563eb)", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:"bold", cursor:"pointer", fontFamily:"'Georgia',serif" },
  completedBox: { background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:16, padding:"16px", textAlign:"center", margin:"20px 14px 0" },
  completedScore: { color:"#86efac", fontWeight:"bold", fontSize:16, margin:"0 0 4px" },
  completedSub: { color:"rgba(255,255,255,0.5)", fontSize:13, margin:"0 0 12px" },
  retryBtn: { padding:"10px 20px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", borderRadius:10, fontSize:13, cursor:"pointer" },
};

const ISLAND_SECTION_LABELS = {
  vocab: "📚 Vocabulário",
  phrases: "💬 Frases",
  dialogue: "🗣️ Diálogo",
  cultural: "🌎 Cultura",
  formal: "🔄 Formal/Informal",
};

function IslandVocab({ vocab }) {
  return (
    <div style={isl.vocabGrid}>
      {vocab.map((v,i) => (
        <div key={i} style={isl.vocabCard}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <p style={isl.vocabPt}>{v.pt}</p>
              <p style={isl.vocabFr}>{v.fr}</p>
            </div>
            <button style={isl.vocabAudio} onClick={() => speakPortugueseSanitized(v.pt)}>🔊</button>
          </div>
          <p style={isl.vocabEx}>ex: {v.example}</p>
          <p style={{...isl.vocabEx, color:"#93c5fd", fontStyle:"normal"}}>🇫🇷 {v.example_fr}</p>
          <span style={isl.vocabTag}>{v.tag}</span>
          {"  "}
          <span style={{...isl.vocabTag, background:"rgba(251,191,36,0.15)", color:"#fde68a"}}>niveau {v.level}</span>
        </div>
      ))}
    </div>
  );
}

function IslandPhrases({ phrases }) {
  return (
    <div>
      {phrases.map((p,i) => (
        <div key={i} style={isl.phraseCard}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
            <div style={{flex:1}}>
              <p style={isl.phrasePt}>{p.pt}</p>
              <p style={isl.phraseFr}>{p.fr}</p>
            </div>
            <button style={isl.vocabAudio} onClick={() => speakPortugueseSanitized(p.pt)}>🔊</button>
          </div>
          <p style={isl.phraseNote}>💡 {p.note_fr}</p>
        </div>
      ))}
    </div>
  );
}

function IslandDialogue({ dialogue }) {
  const [shown, setShown] = useState(1);
  const [flipped, setFlipped] = useState({});
  const total = dialogue.length;

  return (
    <div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
        {dialogue.slice(0,shown).map((msg,i) => {
          const isL = msg.who === "lucas";
          return (
            <div key={i} style={{...cv.row, justifyContent: isL ? "flex-start" : "flex-end"}}>
              {isL && <span style={cv.ava}>👨‍🏫</span>}
              <div style={{maxWidth:"75%"}}>
                <div style={{...cv.bubble, ...(isL ? cv.bL : cv.bA)}} onClick={() => setFlipped(f => ({...f,[i]:!f[i]}))}>
                  <div style={cv.bubbleHeader}>
                    <span style={cv.bName}>{isL ? "🇧🇷 Lucas" : "🌍 Vous"}</span>
                    <button type="button" style={cv.audioBtn} onClick={e => { e.stopPropagation(); speakPortugueseSanitized(msg.text); }}>🔊</button>
                  </div>
                  <p style={cv.bText}>{msg.text}</p>
                  {flipped[i] && <p style={cv.bFr}>🇫🇷 {msg.fr}</p>}
                  <span style={cv.bHint}>{flipped[i] ? "▲ cacher" : "▼ voir en français"}</span>
                </div>
              </div>
              {!isL && <span style={cv.ava}>🧑‍🎓</span>}
            </div>
          );
        })}
      </div>
      {shown < total
        ? <button style={cv.nextMsg} onClick={() => setShown(s => s+1)}>Próxima fala ▶</button>
        : <p style={{color:"rgba(255,255,255,0.4)",fontSize:12,textAlign:"center",marginTop:6}}>✅ Dialogue complet !</p>
      }
    </div>
  );
}

function IslandCultural({ cultural }) {
  return (
    <div>
      {cultural.map((c,i) => (
        <div key={i} style={isl.tipCard}>
          <p style={isl.tipTitle}>{c.tip}</p>
          <p style={isl.tipText}>{c.text_fr}</p>
        </div>
      ))}
    </div>
  );
}

function IslandFormalInformal({ data }) {
  return (
    <div>
      {data.map((item,i) => (
        <div key={i} style={isl.fiCard}>
          <p style={isl.fiTema}>🎯 {item.tema}</p>
          <div style={isl.fiRow}>
            <div style={isl.fiBox}>
              <span style={{...isl.fiLabel,...isl.fiLabelFormal}}>FORMAL</span>
              <p style={isl.fiPt}>{item.formal.pt}</p>
              <p style={isl.fiFr}>{item.formal.fr}</p>
            </div>
            <div style={{...isl.fiBox}}>
              <span style={{...isl.fiLabel,...isl.fiLabelInformal}}>INFORMAL</span>
              {Array.isArray(item.informal)
                ? item.informal.map((inf,j) => <div key={j} style={{marginBottom:j < item.informal.length-1 ? 6 : 0}}><p style={{...isl.fiPt, fontSize:13}}>{inf.pt}</p><p style={{...isl.fiFr, fontSize:11}}>{inf.fr}</p></div>)
                : <><p style={isl.fiPt}>{item.informal.pt}</p><p style={isl.fiFr}>{item.informal.fr}</p></>
              }
            </div>
          </div>
          <p style={isl.fiExpl}>🇫🇷 {item.explanation_fr}</p>
        </div>
      ))}
    </div>
  );
}

function IslandQuizView({ island, onDone }) {
  const [questions] = useState(() => shuffle(island.quiz));
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState([]);
  const [finished, setFinished] = useState(false);
  const [opts] = useState(() => questions.map(q => shuffle(q.opts)));
  const [showFr, setShowFr] = useState(false);

  function pick(o) {
    if (sel !== null) return;
    setSel(o);
    if (o === questions[qi].a) setScore(s => s+1);
    else setWrongs(w => [...w, {q: questions[qi].q, correct: questions[qi].a, given: o}]);
  }
  function next() {
    setSel(null); setShowFr(false);
    if (qi+1 >= questions.length) setFinished(true);
    else setQi(i => i+1);
  }

  if (finished) {
    const pct = Math.round(score/questions.length*100);
    const medal = pct===100 ? "🏆" : pct>=70 ? "🥈" : "🥉";
    return (
      <div style={qv.result}>
        <div style={{fontSize:56,textAlign:"center"}}>{medal}</div>
        <p style={qv.resTitle}>{score}/{questions.length} correctes — {pct}%</p>
        <p style={qv.resMsg}>{pct===100 ? "Parfait ! Tu maîtrises cette île !" : pct>=70 ? "Très bien ! Continue comme ça !" : "Relis le contenu et réessaie !"}</p>
        {wrongs.length > 0 && (
          <div style={qv.wrongBox}>
            <p style={qv.wrongTitle}>📝 À réviser :</p>
            {wrongs.map((w,i) => (
              <div key={i} style={qv.wrongItem}>
                <span style={qv.wrongQ}>{w.q}</span>
                <span style={qv.wrongA}>✅ {w.correct}</span>
              </div>
            ))}
          </div>
        )}
        <button style={qv.doneBtn} onClick={() => onDone(score, questions.length)}>Terminer le quiz ✅</button>
      </div>
    );
  }

  const q = questions[qi];
  const isOk = sel === q.a;
  return (
    <div style={qv.wrap}>
      <div style={qv.top}>
        <span style={qv.counter}>Question {qi+1}/{questions.length}</span>
        <span style={qv.pts}>⭐ {score}</span>
      </div>
      <div style={qv.bar}><div style={{...qv.barFill, width:`${(qi/questions.length)*100}%`}}/></div>
      <p style={qv.qText}>{q.q}</p>
      <div style={qv.translateRow}>
        <button type="button" style={qv.translateBtn} onClick={() => setShowFr(s => !s)}>
          {showFr ? "Masquer en français" : "Voir en français"}
        </button>
      </div>
      {showFr && <p style={qv.qFrText}>{q.q_fr}</p>}
      <div style={qv.opts}>
        {opts[qi].map((o,i) => {
          let st = qv.opt;
          if (sel !== null) {
            if (o === q.a) st = {...qv.opt,...qv.optOk};
            else if (o === sel) st = {...qv.opt,...qv.optBad};
            else st = {...qv.opt,...qv.optFade};
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
          <div style={{...qv.fb,...(isOk ? qv.fbOk : qv.fbBad)}}>
            {isOk ? "🌟 Correct ! Très bien !" : `❌ La bonne réponse était : "${q.a}"`}
          </div>
          <button style={qv.next} onClick={next}>
            {qi+1 < questions.length ? "Suivant ➡" : "Voir le résultat 🎉"}
          </button>
        </>
      )}
    </div>
  );
}

function IslandDetailScreen({ island, completed, onBack, onFinishQuiz }) {
  const [activeSection, setActiveSection] = useState(island.sections[0]);
  const [quizMode, setQuizMode] = useState(false);
  const [sectionsVisited, setSectionsVisited] = useState(() => new Set([island.sections[0]]));
  const allVisited = island.sections.every(s => sectionsVisited.has(s));
  const isDone = completed[`island_${island.id}`];

  function goSection(s) {
    setActiveSection(s);
    setSectionsVisited(prev => new Set([...prev, s]));
  }

  if (quizMode) {
    return (
      <div style={isl.detailPage}>
        <div style={isl.header}>
          <button style={isl.backBtn} onClick={() => setQuizMode(false)}>← Contenu</button>
          <span style={isl.headerTitle}>{island.emoji} Quiz — {island.title}</span>
          <span style={{width:70}}/>
        </div>
        <IslandQuizView island={island} onDone={(score,total) => { onFinishQuiz(island.id, score, total); setQuizMode(false); }}/>
      </div>
    );
  }

  return (
    <div style={isl.detailPage}>
      <div style={isl.header}>
        <button style={isl.backBtn} onClick={onBack}>← Îles</button>
        <span style={isl.headerTitle}>{island.emoji} {island.title}</span>
        <span style={{width:70}}/>
      </div>

      <div style={isl.sectionTabs}>
        {island.sections.map(s => (
          <button key={s} style={{...isl.sTab,...(activeSection===s ? isl.sTabActive : {})}} onClick={() => goSection(s)}>
            {ISLAND_SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      <div style={isl.section}>
        <p style={isl.sectionTitle}>{ISLAND_SECTION_LABELS[activeSection]}</p>

        {activeSection === "vocab" && <IslandVocab vocab={island.vocab}/>}
        {activeSection === "phrases" && <IslandPhrases phrases={island.phrases}/>}
        {activeSection === "dialogue" && <IslandDialogue dialogue={island.dialogue}/>}
        {activeSection === "cultural" && <IslandCultural cultural={island.cultural}/>}
        {activeSection === "formal" && <IslandFormalInformal data={island.formal_informal}/>}
      </div>

      {isDone ? (
        <div style={isl.completedBox}>
          <p style={{fontSize:36,margin:"0 0 6px"}}>🏆</p>
          <p style={isl.completedScore}>Quiz réussi : {isDone.score}/{isDone.total}</p>
          <p style={isl.completedSub}>Tu maîtrises cette île !</p>
          <button style={isl.retryBtn} onClick={() => setQuizMode(true)}>🔄 Refaire le quiz</button>
        </div>
      ) : (
        <div style={isl.unlockBox}>
          <p style={{fontSize:36,margin:"0 0 6px"}}>{allVisited ? "🎯" : "🔒"}</p>
          <p style={isl.unlockTitle}>{allVisited ? "Quiz débloqué !" : "Explore toutes les sections !"}</p>
          <p style={isl.unlockSub}>
            {allVisited
              ? "Tu as exploré tout le contenu. Lance le quiz pour gagner des baguetes !"
              : `Sections vues : ${sectionsVisited.size}/${island.sections.length}`
            }
          </p>
          {allVisited && (
            <button style={isl.unlockBtn} onClick={() => setQuizMode(true)}>🚀 Commencer le quiz !</button>
          )}
        </div>
      )}
    </div>
  );
}

function IslandsScreen({ completed, onBack, onOpenIsland }) {
  return (
    <div style={isl.page}>
      <div style={isl.header}>
        <button style={isl.backBtn} onClick={onBack}>← Início</button>
        <span style={isl.headerTitle}>🏝️ Îles thématiques</span>
        <span style={{width:60}}/>
      </div>

      <div style={{...isl.heroBox, paddingBottom:16}}>
        <span style={isl.heroEmoji}>🏝️</span>
        <h1 style={isl.heroTitle}>Ilhas Temáticas</h1>
        <p style={isl.heroDesc}>Explore cada ilha para aprender vocabulário, frases e cultura do Brasil!</p>
      </div>

      <div style={isl.grid}>
        {ISLANDS.map(island => {
          const done = completed[`island_${island.id}`];
          const progress = done ? 100 : 0;
          return (
            <div key={island.id}
              style={{...isl.card, background: island.gradient}}
              onClick={() => onOpenIsland(island.id)}
            >
              {done && <span style={isl.doneBadge}>✅ {done.score}/{done.total}</span>}
              <span style={isl.cardEmoji}>{island.emoji}</span>
              <p style={isl.cardTitle}>{island.title}</p>
              <p style={isl.cardDesc}>{island.desc_fr}</p>
              <div style={isl.progressBar}>
                <div style={{...isl.progressFill, width: progress + "%"}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  END ILHAS TEMÁTICAS
// ═══════════════════════════════════════════════════════════════

export default function App() {
  const [authUser, setAuthUser]   = useState(null);
  const [student, setStudent]     = useState(null);
  const [stats, setStats]         = useState({ baguettes:0, correct_answers:0, time_spent_seconds:0 });
  const [avatarId, setAvatarId]   = useState(0);
  const [screen, setScreen]       = useState("home");
  const [activeLid, setActiveLid] = useState(null);
  const [phase, setPhase]         = useState("conv");
  const [completed, setCompleted] = useState({});
  const [sessionSec, setSessionSec] = useState(0);
  const [authLoading, setAuthLoading] = useState(true);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    try { return localStorage.getItem('tts_voice') || ""; } catch(e){ return ""; }
  });

  useEffect(() => {
    if (!student) return;
    const t = setInterval(() => setSessionSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [student]);

  useEffect(() => {
    if (!hasSupabase) {
      setAuthLoading(false);
      return;
    }

    let unsubscribe;
    async function restore() {
      try {
        const session = await getSession();
        const user = await getUser();
        if (session && user) {
          const profile = await getProfile(user.id).catch(() => null);
          const authProfile = profile || { id: user.id, email: user.email, name: user.user_metadata?.name || "", avatar_id: user.user_metadata?.avatar_id || 0, stats: { baguettes:0, correct_answers:0, time_spent_seconds:0 } };
          handleAuth(authProfile);
          if (!profile) {
            await upsertProfile(authProfile).catch(() => null);
          }
        }
      } catch (error) {
        console.warn('Supabase session restore failed', error);
      } finally {
        setAuthLoading(false);
      }
    }

    restore();
    unsubscribe = onAuthStateChange(async ({ event, session }) => {
      if (!session?.user) {
        setAuthUser(null);
        setStudent(null);
        setStats({ baguettes:0, correct_answers:0, time_spent_seconds:0 });
        return;
      }
      try {
        const user = session.user;
        const profile = await getProfile(user.id).catch(() => null);
        const authProfile = profile || { id: user.id, email: user.email, name: user.user_metadata?.name || "", avatar_id: user.user_metadata?.avatar_id || 0, stats: { baguettes:0, correct_answers:0, time_spent_seconds:0 } };
        handleAuth(authProfile);
      } catch (error) {
        console.warn('Supabase auth state change failed', error);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  function handleAuth(user) {
    setAuthUser(user);
    setAvatarId(user.avatar_id || 0);
    if (user.stats) setStats({ ...user.stats });
    if (user?.name) {
      setStudent(prev => prev || { nome: user.name, idade: user.idade || user.age || "" , avatarId: user.avatar_id || 0 });
    }
  }

  // Manage available voices and selected preference
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    function update() {
      const all = window.speechSynthesis.getVoices() || [];
      const candidates = all.filter(v => (v.lang && v.lang.toLowerCase().startsWith("pt")) || /pt|brasil|brazil/i.test(v.name));
      setAvailableVoices(candidates);
      // If user had a saved selection, apply it
      if (selectedVoiceName) {
        const found = all.find(v => v.name === selectedVoiceName);
        if (found) AUDIO_VOICES.preferred = found;
      } else if (AUDIO_VOICES.preferred && AUDIO_VOICES.preferred.name) {
        setSelectedVoiceName(AUDIO_VOICES.preferred.name);
      }
    }
    window.speechSynthesis.onvoiceschanged = update;
    // try a couple times to ensure voices load
    update();
    const t = setTimeout(update, 300);
    return () => { clearTimeout(t); window.speechSynthesis.onvoiceschanged = null; };
  }, [selectedVoiceName]);

  function onSelectVoice(name) {
    try { if (name) localStorage.setItem('tts_voice', name); else localStorage.removeItem('tts_voice'); } catch(e){}
    setSelectedVoiceName(name || "");
    const voice = (AUDIO_VOICES.voices || []).find(v => v.name === name);
    AUDIO_VOICES.preferred = voice || null;
  }

  function handleOnboard(nome, idade) {
    if (authUser) {
      const updatedProfile = { ...authUser, name: nome, idade, avatar_id: authUser.avatar_id || 0, stats: authUser.stats || { baguettes:0, correct_answers:0, time_spent_seconds:0 } };
      setAuthUser(updatedProfile);
      if (hasSupabase && authUser.id) {
        upsertProfile(updatedProfile).catch(e => console.warn('Failed to persist onboarding profile:', e));
      }
    }
    setStudent({ nome, idade, avatarId: authUser?.avatar_id || 0 });
  }

  function handleAvatarChange(id) {
    setAvatarId(id);
    setStudent(s => s ? { ...s, avatarId: id } : s);
    try {
      // persist avatar change to Supabase profile if available
      if (hasSupabase && authUser && authUser.id) {
        const p = { id: authUser.id, avatar_id: id };
        upsertProfile(p).catch(e => console.warn('Failed to persist avatar:', e));
      }
    } catch(e) {}
  }

  function handleLogout() {
    setAuthUser(null); setStudent(null);
    setStats({ baguettes:0, correct_answers:0, time_spent_seconds:0 });
    setCompleted({}); setScreen("home"); setSessionSec(0); setAvatarId(0);
    try { if (hasSupabase) sbSignOut().catch(()=>{}); } catch(e){}
  }

  function finishQuiz(score, total) {
    setCompleted(c => ({...c, [activeLid]: {score, total}}));
    setScreen("home");
    const earned = score * 10;
    const newStats = {
      baguettes:          stats.baguettes + earned,
      correct_answers:    stats.correct_answers + score,
      time_spent_seconds: stats.time_spent_seconds + sessionSec,
    };
    setStats(newStats);
    if (authUser) { authUser.stats = newStats; }
    try {
      if (hasSupabase && authUser && authUser.id) {
        const p = { id: authUser.id, stats: newStats };
        upsertProfile(p).catch(e => console.warn('Failed to persist stats:', e));
      }
    } catch (e) {}
    setSessionSec(0);
  }

  function openLesson(lid) { setActiveLid(lid); setPhase("conv"); setScreen("lesson"); }
  function openIsland(id) { setActiveLid(id); setScreen("ilhaDetail"); }

  if (authLoading) return (
    <div style={{...BASE, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)"}}>
      <div style={{color:"#fff",fontSize:18}}>Carregando sessão...</div>
    </div>
  );
  if (!authUser)  return <AuthScreen onAuth={handleAuth}/>;
  if (!student)   return <OnboardingScreen user={authUser} onDone={handleOnboard}/>;

  const LESSONS = buildLessons(student.nome, student.idade);
  const lesson  = LESSONS.find(l => l.id === activeLid);

  if (screen === "profile") return (
    <ProfileScreen user={authUser} student={student} stats={stats}
      onBack={() => setScreen("home")} onLogout={handleLogout}
      onAvatarChange={handleAvatarChange}
      availableVoices={availableVoices} selectedVoiceName={selectedVoiceName} onSelectVoice={onSelectVoice} />
  );

  if (screen === "ranking") return (
    <RankingScreen currentUser={{...authUser, stats, avatar_id: avatarId}}
      onBack={() => setScreen("home")}/>
  );

  if (screen === "grammaire") return (
    <GrammaireScreen onBack={() => setScreen("home")}/>
  );

  if (screen === "motsInterrogatifs") return (
    <MotsInterrogatifs 
      nome={authUser?.user_metadata?.nome || ""} 
      onBack={() => setScreen("home")} 
    />
  );

  if (screen === "ilhas") return (
    <IslandsScreen completed={completed} onBack={() => setScreen("home")} onOpenIsland={openIsland}/>
  );

  if (screen === "ilhaDetail") {
    const island = ISLANDS.find(i => i.id === activeLid);
    if (!island) return (
      <div style={{...BASE, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)"}}>
        <div style={{color:"#fff",fontSize:18}}>Ilha não encontrada.</div>
      </div>
    );
    return (
      <IslandDetailScreen
        island={island}
        completed={completed}
        onBack={() => setScreen("ilhas")}
        onFinishQuiz={(id, score, total) => {
          setCompleted(c => ({...c, [`island_${id}`]: {score, total}}));
          setScreen("ilhas");
        }}
      />
    );
  }

  if (screen === "home") return (
    <div style={app.page}>
      <div style={app.hero}>
        <div style={app.heroTop}>
          <span style={app.heroAvas}>{AVATARS[avatarId]}  ↔️  👨‍🏫🇧🇷</span>
          <h1 style={app.heroTitle}>Olá, {student.nome}! 👋</h1>
          <p style={app.heroSub}>Aulas de português com o Lucas · {student.idade} anos</p>
        </div>
        <div style={app.statRow}>
          <div style={app.stat}>
            <span style={app.statN}>{Object.keys(completed).length}</span>
            <span style={app.statL}>completas</span>
          </div>
          <div style={app.stat}>
            <span style={app.statN}>🥖 {stats.baguettes}</span>
            <span style={app.statL}>baguetes</span>
          </div>
          <div style={app.stat}>
            <span style={app.statN}>{LESSONS.length}</span>
            <span style={app.statL}>lições</span>
          </div>
        </div>
        <div style={app.navRow}>
          <button style={{...app.navBtn, background: "linear-gradient(135deg, rgba(47, 255, 0, 0.4), rgba(62, 19, 220, 0.49))"}} onClick={() => setScreen("ranking")}>🏆 Ranking</button>
          <button style={{...app.navBtn, ...app.navBtnGreen}} onClick={() => setScreen("grammaire")}>📖 Gramática</button>
          <button style={{...app.navBtn, background: "linear-gradient(135deg, rgba(47, 255, 0, 0.4), rgba(250, 255, 0, 0.49))"}} onClick={() => setScreen("profile")}>👤 Perfil</button>          <button style={{...app.navBtn, background: "linear-gradient(135deg,#f59e0b,#ef4444)"}} onClick={() => setScreen("ilhas")}>🏝️ Ilhas</button>
          <button style={{...app.navBtn, background: "linear-gradient(135deg,#7c3aed,#2563eb)"}} onClick={() => setScreen("motsInterrogatifs")}>❓ Perguntas</button>
          <button style={{...app.navBtn,...app.navBtnRed}} onClick={handleLogout}>🚪 Sair</button>
        </div>
      </div>

      <div style={app.grid}>
        {LESSONS.map(l => {
          const done = completed[l.id];
          return (
            <div key={l.id} style={{...app.card, borderTop:`4px solid ${l.color}`}} onClick={() => openLesson(l.id)}>
              <div style={app.cardTop}>
                <span style={app.cardEmoji}>{l.emoji}</span>
                {done && <span style={app.doneBadge}>✅ {done.score}/{done.total}</span>}
              </div>
              <p style={app.cardNum}>Lição {l.id}</p>
              <p style={app.cardTitle}>{l.title}</p>
              <p style={app.cardTopic}>{l.topic}</p>
              <div style={app.cardInfo}>
                <span>💬 {l.conversation.length} falas</span>
                <span>🃏 {l.flashcards.length} cards</span>
                <span>❓ {l.quiz.length} perguntas</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const phases      = ["conv","flash","quiz"];
  const phaseLabels = ["💬 Conversa","🃏 Flashcards","❓ Quiz"];
  return (
    <div style={app.page}>
      <div style={app.lessonBar}>
        <button style={app.backBtn} onClick={() => setScreen("home")}>← Início</button>
        <span style={app.lessonTitle}>{lesson.emoji} {lesson.title}</span>
      </div>
      <div style={app.tabs}>
        {phases.map((p, i) => (
          <div key={p} style={{...app.tab,...(phase===p?{...app.tabActive,borderBottom:`3px solid ${lesson.color}`}:{})}}>
            {phaseLabels[i]}
          </div>
        ))}
      </div>
      {phase === "conv"  && <ConversationView lesson={lesson} nome={student.nome} onDone={() => setPhase("flash")}/>}
      {phase === "flash" && <FlashcardsView   lesson={lesson} onDone={() => setPhase("quiz")}/>}
      {phase === "quiz"  && <QuizView         lesson={lesson} nome={student.nome} onDone={finishQuiz}/>}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
const BASE = { fontFamily:"'Georgia',serif", color:"#fff" };

const ob = {
  page:{...BASE, minHeight:"100vh", background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, position:"relative", overflow:"hidden"},
  glow1:{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,.35),transparent 70%)",top:-60,left:-60,pointerEvents:"none"},
  glow2:{position:"absolute",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(37,99,235,.3),transparent 70%)",bottom:-40,right:-40,pointerEvents:"none"},
  card:{background:"rgba(255,255,255,0.07)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.13)",borderRadius:24,padding:"32px 24px",maxWidth:400,width:"100%",textAlign:"center",zIndex:1},
  emoji:{fontSize:52,marginBottom:10},
  title:{color:"#fff",fontSize:24,margin:"0 0 8px",background:"linear-gradient(90deg,#a78bfa,#60d9fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  sub:{color:"rgba(255,255,255,0.6)",fontSize:14,margin:"0 0 20px",lineHeight:1.5},
  label:{color:"rgba(255,255,255,0.7)",fontSize:13,marginBottom:8,textAlign:"left"},
  input:{display:"block",width:"100%",padding:"13px 16px",borderRadius:12,border:"2px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:17,fontFamily:"'Georgia',serif",marginBottom:12,boxSizing:"border-box",outline:"none"},
  btn:{display:"block",width:"100%",padding:"14px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:12,fontSize:16,fontWeight:"bold",cursor:"pointer",fontFamily:"'Georgia',serif",transition:"opacity .2s"},
  altBtn:{display:"block",width:"100%",padding:"14px",marginTop:10,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.18)",color:"#fff",borderRadius:12,fontSize:15,cursor:"pointer",fontFamily:"'Georgia',serif"},
  back:{display:"block",width:"100%",marginTop:10,padding:"8px",background:"none",border:"none",color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:13,fontFamily:"'Georgia',serif"},
  profileCard:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"14px 16px",marginBottom:16,textAlign:"left"},
  profileRow:{display:"flex",justifyContent:"space-between",marginBottom:8},
  profileLabel:{color:"rgba(255,255,255,0.5)",fontSize:13},
  profileVal:{color:"#fff",fontWeight:"bold",fontSize:13},
};
const app = {
  page:{...BASE, minHeight:"100vh", background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)", padding:"0 0 40px"},
  hero:{background:"rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"20px 16px 14px", textAlign:"center"},
  heroTop:{marginBottom:12},
  heroAvas:{fontSize:26,display:"block",marginBottom:4},
  heroTitle:{color:"#fff",fontSize:24,margin:"0 0 4px",background:"linear-gradient(90deg,#f97316,#ec4899,#a855f7,#3b82f6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  heroSub:{color:"rgba(255,255,255,0.5)",fontSize:13,margin:0},
  statRow:{display:"flex",justifyContent:"center",gap:28,marginTop:10,marginBottom:8},
  stat:{display:"flex",flexDirection:"column",alignItems:"center"},
  statN:{fontSize:22,fontWeight:"bold",color:"#fbbf24"},
  statL:{fontSize:11,color:"rgba(255,255,255,0.45)"},
  changeBtn:{background:"none",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.4)",borderRadius:20,padding:"4px 14px",cursor:"pointer",fontSize:11,fontFamily:"'Georgia',serif"},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,padding:"16px 12px",maxWidth:760,margin:"0 auto"},
  card:{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:"14px 12px",cursor:"pointer",transition:"transform .15s",userSelect:"none"},
  cardTop:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6},
  cardEmoji:{fontSize:28},
  doneBadge:{background:"rgba(34,197,94,0.25)",color:"#86efac",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:"bold"},
  cardNum:{color:"rgba(255,255,255,0.35)",fontSize:11,margin:"0 0 2px"},
  cardTitle:{color:"#fff",fontSize:14,fontWeight:"bold",margin:"0 0 4px",lineHeight:1.3},
  cardTopic:{color:"rgba(255,255,255,0.5)",fontSize:11,margin:"0 0 10px"},
  cardInfo:{display:"flex",flexWrap:"wrap",gap:4,fontSize:11,color:"rgba(255,255,255,0.35)"},
  lessonBar:{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"rgba(0,0,0,0.3)",borderBottom:"1px solid rgba(255,255,255,0.08)"},
  backBtn:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13},
  lessonTitle:{color:"#fff",fontSize:15,fontWeight:"bold"},
  tabs:{display:"flex",background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.07)"},
  tab:{flex:1,padding:"10px 4px",textAlign:"center",fontSize:12,color:"rgba(255,255,255,0.4)",cursor:"default",borderBottom:"3px solid transparent"},
  tabActive:{color:"#fff",fontWeight:"bold"},
};

const cv = {
  wrap:{padding:"12px",maxWidth:500,margin:"0 auto"},
  expBox:{background:"rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 14px",marginBottom:14,border:"1px solid rgba(255,255,255,0.08)"},
  expTitle:{color:"#fbbf24",fontWeight:"bold",fontSize:13,margin:"0 0 8px"},
  expList:{display:"flex",flexDirection:"column",gap:8},
  expItem:{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"8px 10px"},
  expPt:{color:"#fff",fontWeight:"bold",fontSize:14},
  expArrow:{color:"rgba(255,255,255,0.3)",margin:"0 6px"},
  expFr:{color:"#93c5fd",fontSize:14},
  expEg:{display:"block",color:"rgba(255,255,255,0.4)",fontSize:11,marginTop:2,fontStyle:"italic"},
  bubbles:{display:"flex",flexDirection:"column",gap:10,marginBottom:14},
  row:{display:"flex",alignItems:"flex-end",gap:6},
  ava:{fontSize:22,flexShrink:0},
  bubble:{borderRadius:16,padding:"10px 14px",cursor:"pointer",userSelect:"none"},
  bL:{background:"linear-gradient(135deg,#1e3a5f,#1a5c45)",borderBottomLeftRadius:4},
  bA:{background:"linear-gradient(135deg,#4c1d95,#6d28d9)",borderBottomRightRadius:4},
  bName:{color:"rgba(255,255,255,0.5)",fontSize:11,display:"block",marginBottom:3},
  bubbleHeader:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:8},
  audioBtn:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:9999,padding:"6px 10px",cursor:"pointer",fontSize:12},
  bText:{color:"#fff",fontSize:14,margin:0,lineHeight:1.4},
  bFr:{color:"rgba(255,255,255,0.6)",fontSize:12,margin:"6px 0 0",fontStyle:"italic",borderTop:"1px solid rgba(255,255,255,0.15)",paddingTop:6},
  bHint:{color:"rgba(255,255,255,0.25)",fontSize:10,display:"block",marginTop:4},
  nextMsg:{display:"block",margin:"0 auto",padding:"10px 24px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:10,cursor:"pointer",fontSize:14},
  doneBtn:{display:"block",width:"100%",padding:"14px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:"bold",cursor:"pointer",marginTop:4},
};

const fc = {
  wrap:{padding:"20px 12px",maxWidth:400,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center"},
  counter:{color:"rgba(255,255,255,0.45)",fontSize:13,marginBottom:16},
  cardOuter:{width:"100%",height:200,perspective:"1000px",cursor:"pointer",marginBottom:20},
  cardInner:{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transition:"transform .5s"},
  front:{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",background:"linear-gradient(135deg,#1e3a5f,#1a5c45)",borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:16,boxSizing:"border-box"},
  back:{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",background:"linear-gradient(135deg,#4c1d95,#7c3aed)",borderRadius:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:16,transform:"rotateY(180deg)",boxSizing:"border-box"},
  flag:{fontSize:30},
  flashcardHeader:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,width:"100%",marginBottom:14},
  audioBtn:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:9999,padding:"8px 12px",cursor:"pointer",fontSize:14},
  word:{color:"#fff",fontSize:18,fontWeight:"bold",textAlign:"center",margin:0,lineHeight:1.35},
  tap:{color:"rgba(255,255,255,0.4)",fontSize:12},
  btns:{display:"flex",gap:12,width:"100%"},
  nav:{flex:1,padding:"12px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:12,cursor:"pointer",fontSize:14,fontFamily:"'Georgia',serif"},
  doneWrap:{padding:"40px 20px",textAlign:"center"},
  doneEmoji:{fontSize:52,marginBottom:12},
  doneTxt:{color:"rgba(255,255,255,0.7)",fontSize:15,marginBottom:20},
  goQuiz:{padding:"14px 32px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:12,fontSize:16,fontWeight:"bold",cursor:"pointer"},
};

const qv = {
  wrap:{padding:"16px 12px",maxWidth:480,margin:"0 auto"},
  top:{display:"flex",justifyContent:"space-between",marginBottom:8},
  counter:{color:"rgba(255,255,255,0.45)",fontSize:13},
  pts:{background:"#fbbf24",color:"#1a1040",borderRadius:20,padding:"2px 12px",fontWeight:"bold",fontSize:13},
  bar:{height:6,background:"rgba(255,255,255,0.12)",borderRadius:10,overflow:"hidden",marginBottom:16},
  barFill:{height:"100%",background:"linear-gradient(90deg,#a78bfa,#60d9fa)",borderRadius:10,transition:"width .4s"},
  qText:{color:"#fff",fontSize:17,fontWeight:"bold",marginBottom:16,lineHeight:1.4},
  translateRow:{display:"flex",justifyContent:"flex-end",marginBottom:8},
  translateBtn:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:12,padding:"8px 12px",cursor:"pointer",fontSize:13,fontFamily:"'Georgia',serif"},
  qFrText:{color:"rgba(255,255,255,0.65)",fontSize:14,fontStyle:"italic",margin:"0 0 12px",lineHeight:1.5},
  opts:{display:"flex",flexDirection:"column",gap:10,marginBottom:12},
  opt:{padding:"13px 16px",borderRadius:12,border:"2px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.07)",color:"#fff",fontSize:15,cursor:"pointer",textAlign:"left",fontFamily:"'Georgia',serif"},
  optOk:{background:"rgba(46,204,113,0.2)",borderColor:"#2ecc71",color:"#b8ffd4"},
  optBad:{background:"rgba(231,76,60,0.2)",borderColor:"#e74c3c",color:"#ffc0bb"},
  optFade:{opacity:.35},
  fb:{borderRadius:10,padding:"11px 14px",fontSize:14,fontWeight:"bold",textAlign:"center",marginBottom:10},
  fbOk:{background:"rgba(46,204,113,0.15)",color:"#b8ffd4",border:"1px solid #2ecc71"},
  fbBad:{background:"rgba(231,76,60,0.15)",color:"#ffc0bb",border:"1px solid #e74c3c"},
  next:{width:"100%",padding:"13px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:"bold",cursor:"pointer"},
  result:{padding:"20px 12px",maxWidth:480,margin:"0 auto",textAlign:"center"},
  resTitle:{color:"#fbbf24",fontSize:20,fontWeight:"bold",margin:"10px 0 6px"},
  resMsg:{color:"rgba(255,255,255,0.65)",fontSize:14,marginBottom:16},
  wrongBox:{background:"rgba(0,0,0,0.2)",borderRadius:14,padding:"14px",textAlign:"left",marginBottom:16},
  wrongTitle:{color:"#fbbf24",fontWeight:"bold",marginBottom:8,fontSize:13},
  wrongItem:{marginBottom:8},
  wrongQ:{color:"rgba(255,255,255,0.55)",fontSize:12,display:"block"},
  wrongA:{color:"#6ee7b7",fontSize:13,fontWeight:"bold"},
  doneBtn:{width:"100%",padding:"14px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:"bold",cursor:"pointer"},
};

const rk = {
  page:{...BASE,minHeight:"100vh",background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)",paddingBottom:40},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"rgba(0,0,0,0.3)",borderBottom:"1px solid rgba(255,255,255,0.08)"},
  backBtn:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13},
  title:{color:"#fff",fontWeight:"bold",fontSize:17},
  myBadge:{display:"flex",alignItems:"center",gap:12,margin:"16px 14px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:16,padding:"12px 14px"},
  myAv:{fontSize:36},
  myName:{color:"#fff",fontWeight:"bold",fontSize:16,margin:0},
  mySub:{color:"rgba(255,255,255,0.5)",fontSize:12,margin:"2px 0 0"},
  tabs:{display:"flex",margin:"0 14px 10px",background:"rgba(0,0,0,0.2)",borderRadius:12,padding:4,gap:4},
  tab:{flex:1,padding:"8px",textAlign:"center",fontSize:13,color:"rgba(255,255,255,0.45)",background:"none",border:"none",cursor:"pointer",fontFamily:"'Georgia',serif",borderRadius:10},
  tabActive:{color:"#fff",fontWeight:"bold",background:"rgba(255,255,255,0.1)"},
  list:{display:"flex",flexDirection:"column",gap:8,padding:"0 14px"},
  row:{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"12px 14px"},
  rowMe:{outline:"2px solid #a78bfa",outlineOffset:1},
  rankCol:{width:32,textAlign:"center",flexShrink:0},
  medal:{fontSize:22},
  rankNum:{color:"rgba(255,255,255,0.4)",fontSize:13,fontWeight:"bold"},
  avatar:{fontSize:28,flexShrink:0},
  info:{flex:1,display:"flex",flexDirection:"column",gap:2},
  name:{color:"#fff",fontSize:15,fontWeight:"bold"},
  nameMe:{color:"#a78bfa"},
  baguettes:{color:"rgba(255,255,255,0.55)",fontSize:12},
  crown:{fontSize:18,flexShrink:0},
  empty:{color:"rgba(255,255,255,0.4)",textAlign:"center",padding:"30px 20px",lineHeight:1.6},
};

// Auth extras
const au = {
  avatarGrid:{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:14},
  avatarBtn:{fontSize:24,width:44,height:44,borderRadius:12,border:"2px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",cursor:"pointer"},
  avatarSel:{border:"2px solid #a78bfa",background:"rgba(167,139,250,0.2)"},
  avatarGridLarge:{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:8},
  avatarBtnLarge:{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:64,borderRadius:14,border:"2px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",cursor:"pointer",gap:4},
  avatarSelLarge:{border:"2px solid #a78bfa",background:"rgba(167,139,250,0.15)"},
  avatarCheck:{position:"absolute",top:2,right:4,color:"#a78bfa",fontSize:12,fontWeight:"bold"},
  langRow:{display:"flex",gap:8,marginBottom:12},
  langBtn:{flex:1,padding:"10px",borderRadius:10,border:"2px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"'Georgia',serif"},
  langSel:{border:"2px solid #60d9fa",background:"rgba(96,217,250,0.15)"},
  error:{color:"#fca5a5",fontSize:13,marginBottom:10},
};

// Profile
const pr = {
  page:{...BASE,minHeight:"100vh",background:"linear-gradient(160deg,#0f0c29,#302b63,#24243e)",paddingBottom:40},
  header:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"rgba(0,0,0,0.3)",borderBottom:"1px solid rgba(255,255,255,0.08)"},
  backBtn:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13},
  headerTitle:{color:"#fff",fontWeight:"bold",fontSize:15},
  logoutBtn:{background:"rgba(239,68,68,0.2)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13},
  hero:{textAlign:"center",padding:"20px 16px 10px"},
  avatarBig:{fontSize:56,marginBottom:6},
  heroName:{color:"#fff",fontSize:20,fontWeight:"bold",margin:"0 0 2px"},
  heroEmail:{color:"rgba(255,255,255,0.4)",fontSize:12,margin:"0 0 10px"},
  codeBox:{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"7px 14px"},
  codeLabel:{color:"rgba(255,255,255,0.5)",fontSize:11},
  codeVal:{color:"#fbbf24",fontWeight:"bold",fontSize:15,letterSpacing:2},
  tabs:{display:"flex",margin:"12px 14px 0",background:"rgba(0,0,0,0.2)",borderRadius:12,padding:4,gap:4},
  tab:{flex:1,padding:"8px 4px",textAlign:"center",fontSize:12,color:"rgba(255,255,255,0.4)",background:"none",border:"none",cursor:"pointer",fontFamily:"'Georgia',serif",borderRadius:10},
  tabActive:{color:"#fff",fontWeight:"bold",background:"rgba(255,255,255,0.1)"},
  section:{padding:"14px",maxWidth:480,margin:"0 auto"},
  statGrid:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10},
  statCard:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:14,padding:"14px 8px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4},
  statBig:{fontSize:22},
  statNum:{color:"#fbbf24",fontSize:20,fontWeight:"bold"},
  statLbl:{color:"rgba(255,255,255,0.45)",fontSize:11},
  addBox:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:14,padding:"14px",marginBottom:12},
  addTitle:{color:"#fbbf24",fontWeight:"bold",fontSize:13,margin:"0 0 4px"},
  addRow:{display:"flex",gap:8,marginTop:8},
  addInput:{flex:1,padding:"10px 12px",borderRadius:10,border:"2px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.07)",color:"#fff",fontSize:15,fontFamily:"'Georgia',serif",letterSpacing:1},
  addBtn:{padding:"10px 16px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",border:"none",borderRadius:10,fontWeight:"bold",cursor:"pointer",fontSize:14},
  addMsg:{color:"#86efac",fontSize:13,marginTop:8},
  emptyFriends:{color:"rgba(255,255,255,0.4)",fontSize:14,textAlign:"center",padding:20},
  friendRow:{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.07)"},
  friendAv:{fontSize:24},
  friendName:{color:"#fff",fontSize:15},
};

// app extra styles for nav row
app.navRow = {display:"flex",gap:8,justifyContent:"center",marginTop:8,flexWrap:"wrap"};
app.navBtn = {background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontSize:13,fontFamily:"'Georgia',serif"};
app.navBtnRed = {background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.25)",color:"#fca5a5"};
app.navBtnGreen = {background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",color:"#6ee7b7"};
