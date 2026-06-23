import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Volume2, Mic, Hand, Camera, CameraOff, Eye, Image as ImageIcon, Settings as SettingsIcon,
  Home, MessageCircle, Map as MapIcon, TreeDeciduous, ArrowLeft, Sparkles,
  Star, Heart, Sun, Moon, Flower2, Cloud, Keyboard,
  Users, ShieldCheck, Contrast, Trash2, CheckCircle2, Loader2
} from "lucide-react";

const SIGN_WORDS = ["Hello", "Thank you", "Please", "Water", "Thirsty", "Finished"];
const WORD_TO_LABEL = {
  "Hello": "hello",
  "Thank you": "thankyou",
  "Please": "please",
  "Water": "water",
  "Thirsty": "thirsty",
  "Finished": "finish",
};

const SIGN_REFERENCE = {
  "Hello": "Flat hand, palm out, near forehead — wave it forward like a salute.",
  "Thank you": "Fingers touch your chin, palm up, move hand forward and down.",
  "Please": "Flat hand on chest, palm in, circle it gently.",
  "Water": "Thumb, index and middle finger form a 'W', tap once near your chin.",
  "Thirsty": "Index finger traces a line down your throat, top to bottom.",
  "Finished": "Both hands open near your chest, palms in, flip outward to palms-down.",
};

const COLORS = {
  cream: "#FFF8F0",
  sky: "#A8D4E6",
  mint: "#B8E6C1",
  sun: "#F9E79F",
  coral: "#F5B7A6",
  success: "#C5E1A5",
  warning: "#FFD8B1",
  cta: "#E8A598",
  text: "#4A4A4A",
  secondaryLarge: "#8A8A8A",
  secondary: "#6E6E6E",
  luma: "#C5CAE9",
  lumaGlow: "#E8EAF6",
  plum: "#2C1F3D",
};

const LUMA_SWATCHES = [
  { name: "Dawn Pink", hex: "#F3C9C9" },
  { name: "Mint Whisper", hex: "#C5E8D4" },
  { name: "Peach Glow", hex: "#F6D3B8" },
  { name: "Sky Mist", hex: "#C7E0EC" },
  { name: "Lavender Dream", hex: "#C5CAE9" },
  { name: "Butter Cream", hex: "#F2E6B8" },
  { name: "Coral Soft", hex: "#EFC2B6" },
  { name: "Sage Hush", hex: "#C9D9C2" },
];

const LUMA_FORMS = ["Blob", "Bunny", "Bird", "Star", "Cloud"];

const AVATARS = {
  boy: "/avatars/boy.png",
  girl: "/avatars/girl.png",
};

const GLOBAL_CSS = `
  .sv-app, .sv-app *, .sv-app *::before, .sv-app *::after { box-sizing: border-box; }
  @keyframes floatY { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-2px); } }
  @keyframes breathe { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.06); } }
  @keyframes hop { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes bigBounce { 0% { transform: translateY(0) scale(1); } 30% { transform: translateY(-20px) scale(1.05); } 60% { transform: translateY(0) scale(0.97); } 100% { transform: translateY(0) scale(1); } }
  @keyframes spin360 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes wiggle { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(4deg); } }
  @keyframes sparklePop { 0% { opacity:0; transform: scale(0) translateY(0); } 35% { opacity:1; transform: scale(1) translateY(-6px); } 100% { opacity:0; transform: scale(0.6) translateY(-22px); } }
  @keyframes fadeSlideIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
  @keyframes gentleShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
  @keyframes shiver { 0%,100% { transform: translateX(0) translateY(2px); } 50% { transform: translateX(-1px) translateY(2px); } }
  @keyframes ringPulse { 0% { box-shadow: 0 0 0 0 rgba(232,165,152,0.45); } 100% { box-shadow: 0 0 0 14px rgba(232,165,152,0); } }
  @keyframes dotPulse { 0%,80%,100% { opacity:0.25; } 40% { opacity:1; } }
  @keyframes companionIdle { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-7px) rotate(3deg); } }
  @keyframes companionHappy { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-14px) rotate(4deg); } }
  @keyframes companionExcited { 0% { transform: translateY(0) scale(1) rotate(0deg); } 30% { transform: translateY(-26px) scale(1.1) rotate(-8deg); } 60% { transform: translateY(0) scale(0.95) rotate(8deg); } 100% { transform: translateY(0) scale(1) rotate(0deg); } }
  @keyframes companionSad { 0%,100% { transform: translateX(0) translateY(4px) rotate(-2deg); } 50% { transform: translateX(0) translateY(4px) rotate(2deg); } }
  @keyframes companionTeaching { 0%,100% { transform: rotate(-7deg) translateY(0); } 50% { transform: rotate(7deg) translateY(-4px); } }
  .sv-fade-in { animation: fadeSlideIn 220ms ease-out both; }
  .sv-reduce-motion * { animation: none !important; transition: none !important; }
`;

function speak(text, { rate = 1 } = {}) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
    return true;
  } catch (e) {
    return false;
  }
}

/* =========================================================================
   LUMA — form-aware companion. Supports Blob, Bunny, Bird, Star, Cloud.
   No mouth, ever. Eyes and expression stay consistent across all forms.
   ========================================================================= */
function Luma({ mood = "neutral", size = 120, color = COLORS.luma, reduceMotion = false, accessory = null, form = "Blob" }) {
  const anim = (name, dur, easing = "ease-in-out", iter = "infinite") =>
    reduceMotion ? {} : { animation: `${name} ${dur} ${easing} ${iter}` };

  const eyeColor = "#5B5F86";

  // Eye Y-offset so eyes land in the right spot per form
  const eyeOffsets = { Blob: 0, Bunny: 12, Bird: -16, Star: 14, Cloud: 8 };
  const ey = eyeOffsets[form] || 0;

  let eyes = null;
  let blush = null;
  let bubble = null;
  let particles = null;
  let bodyStyle = { ...anim("floatY", "3s") };
  let glowOpacity = 0.5;
  let crown = null;

  if (mood === "happy") {
    eyes = (
      <>
        <path d={`M${68} ${92+ey} q10 -12 20 0`} stroke={eyeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d={`M${112} ${92+ey} q10 -12 20 0`} stroke={eyeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
      </>
    );
    blush = (
      <>
        <circle cx="62" cy={108+ey} r="7" fill="#F2B6C6" opacity="0.7" />
        <circle cx="138" cy={108+ey} r="7" fill="#F2B6C6" opacity="0.7" />
      </>
    );
    bodyStyle = { ...anim("hop", "1.1s", "ease-in-out", 3) };
    glowOpacity = 0.65;
  } else if (mood === "excited") {
    eyes = (
      <>
        <circle cx="78" cy={92+ey} r="9" fill="#FFFFFA" stroke={eyeColor} strokeWidth="3" />
        <circle cx="122" cy={92+ey} r="9" fill="#FFFFFA" stroke={eyeColor} strokeWidth="3" />
      </>
    );
    blush = (
      <>
        <circle cx="62" cy={108+ey} r="7" fill="#F2B6C6" opacity="0.85" />
        <circle cx="138" cy={108+ey} r="7" fill="#F2B6C6" opacity="0.85" />
      </>
    );
    bodyStyle = { ...anim("bigBounce", "1s", "ease-out", 1) };
    glowOpacity = 0.8;
    particles = Array.from({ length: 10 }).map((_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      const r = 70;
      const x = 100 + Math.cos(angle) * r;
      const y = 100 + Math.sin(angle) * r;
      const colors = ["#F9E79F", "#B8E6C1", "#A8D4E6", "#F5B7A6"];
      return (
        <circle key={i} cx={x} cy={y} r="4" fill={colors[i % colors.length]}
          style={reduceMotion ? { opacity: 0.7 } : { animation: `sparklePop 1.1s ease-out ${i * 0.06}s infinite` }} />
      );
    });
  } else if (mood === "sad") {
    eyes = (
      <>
        <path d={`M${68} ${96+ey} q10 10 20 0`} stroke={eyeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d={`M${112} ${96+ey} q10 10 20 0`} stroke={eyeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
      </>
    );
    bodyStyle = { transform: "translateY(6px)", ...anim("shiver", "2.6s") };
    glowOpacity = 0.3;
    bubble = (
      <g style={{ animation: reduceMotion ? "none" : "floatY 3s ease-in-out infinite" }}>
        <ellipse cx="150" cy="40" rx="20" ry="14" fill="#FFFDF9" stroke="#E6E0F0" strokeWidth="2" />
        <text x="150" y="46" textAnchor="middle" fontSize="16" fill={eyeColor} fontFamily="inherit">...</text>
      </g>
    );
  } else if (mood === "sleepy") {
    eyes = (
      <>
        <rect x="64" y={90+ey} width="24" height="4" rx="2" fill={eyeColor} />
        <rect x="108" y={90+ey} width="24" height="4" rx="2" fill={eyeColor} />
      </>
    );
    bodyStyle = { ...anim("breathe", "8s") };
    glowOpacity = 0.3;
    bubble = (
      <text x="150" y="36" textAnchor="middle" fontSize="18" fill="#A9AFD6" fontFamily="inherit"
        style={{ animation: reduceMotion ? "none" : "floatY 2.4s ease-in-out infinite" }}>Zzz</text>
    );
  } else if (mood === "proud") {
    eyes = (
      <>
        <path d={`M${68} ${92+ey} q10 -10 20 0`} stroke={eyeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d={`M${112} ${92+ey} q10 -10 20 0`} stroke={eyeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
      </>
    );
    blush = (
      <>
        <circle cx="62" cy={108+ey} r="7" fill="#F2B6C6" opacity="0.7" />
        <circle cx="138" cy={108+ey} r="7" fill="#F2B6C6" opacity="0.7" />
      </>
    );
    bodyStyle = { transform: "translateY(-4px)", ...anim("floatY", "3s") };
    glowOpacity = 0.75;
    crown = <path d="M85 48 q15 -14 30 0 q-15 6 -30 0 z" fill="#9CC98A" stroke="#7FB36B" strokeWidth="1.5" />;
  } else if (mood === "teaching") {
    eyes = (
      <>
        <ellipse cx="78" cy={92+ey} rx="7" ry="9" fill={eyeColor} />
        <ellipse cx="122" cy={92+ey} rx="7" ry="9" fill={eyeColor} />
      </>
    );
    bodyStyle = { ...anim("wiggle", "2.4s") };
    glowOpacity = 0.6;
  } else {
    eyes = (
      <>
        <ellipse cx="78" cy={92+ey} rx="6" ry="8" fill={eyeColor} />
        <ellipse cx="122" cy={92+ey} rx="6" ry="8" fill={eyeColor} />
      </>
    );
  }

  // Body shape per form
  let bodyParts = null;
  if (form === "Bunny") {
    bodyParts = (
      <>
        {/* tall ears */}
        <ellipse cx="72" cy="42" rx="14" ry="34" fill={color} opacity="0.9" />
        <ellipse cx="128" cy="42" rx="14" ry="34" fill={color} opacity="0.9" />
        {/* inner ear blush */}
        <ellipse cx="72" cy="42" rx="8" ry="22" fill="#F2B6C6" opacity="0.4" />
        <ellipse cx="128" cy="42" rx="8" ry="22" fill="#F2B6C6" opacity="0.4" />
        {/* main body */}
        <ellipse cx="100" cy="128" rx="70" ry="60" fill={color} opacity="0.95" />
      </>
    );
  } else if (form === "Bird") {
    bodyParts = (
      <>
        {/* wings */}
        <ellipse cx="36" cy="120" rx="30" ry="13" fill={color} opacity="0.8" transform="rotate(-22 36 120)" />
        <ellipse cx="164" cy="120" rx="30" ry="13" fill={color} opacity="0.8" transform="rotate(22 164 120)" />
        {/* body */}
        <ellipse cx="100" cy="132" rx="62" ry="54" fill={color} opacity="0.95" />
        {/* head */}
        <ellipse cx="100" cy="76" rx="32" ry="28" fill={color} opacity="0.9" />
        {/* beak */}
        <polygon points="100,87 118,97 100,103" fill="#F9C74F" opacity="0.9" />
      </>
    );
  } else if (form === "Star") {
    // 5-pointed star: outer r=68, inner r=30, center (100,118)
    bodyParts = (
      <>
        <path
          d="M100,50 L116,95 L163,95 L127,122 L141,168 L100,143 L59,168 L73,122 L37,95 L84,95 Z"
          fill={color} opacity="0.95"
        />
      </>
    );
  } else if (form === "Cloud") {
    bodyParts = (
      <>
        {/* cloud puffs */}
        <circle cx="100" cy="138" r="50" fill={color} opacity="0.95" />
        <circle cx="57"  cy="120" r="32" fill={color} opacity="0.93" />
        <circle cx="100" cy="98"  r="35" fill={color} opacity="0.93" />
        <circle cx="143" cy="114" r="30" fill={color} opacity="0.93" />
      </>
    );
  } else {
    // Blob (default)
    bodyParts = (
      <>
        <ellipse cx="100" cy="125" rx="78" ry="68" fill={color} opacity="0.95" />
        <ellipse cx="78"  cy="78"  rx="20" ry="16" fill={color} opacity="0.9" />
        <ellipse cx="124" cy="76"  rx="16" ry="13" fill={color} opacity="0.9" />
      </>
    );
  }

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{
        position: "absolute", inset: -size * 0.18, borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.lumaGlow} 0%, transparent 70%)`,
        opacity: glowOpacity, ...anim("breathe", "4s"),
      }} />
      <div style={{ position: "relative", width: "100%", height: "100%", ...bodyStyle }}>
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          {bodyParts}
          {crown}
          {eyes}
          {blush}
          {bubble}
          {accessory}
        </svg>
        {particles && (
          <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            {particles}
          </svg>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   COMPANION AVATAR — your uploaded cartoon characters. Static art, so they
   react via CSS (bounce/glow/shiver) rather than changing pose — same
   trick Luma uses for excited/sad/etc, just applied to a flat <img>.
   ========================================================================= */
function CompanionAvatar({ which = "boy", mood = "neutral", size = 110, reduceMotion = false }) {
  const moodStyle = reduceMotion ? {} : {
    happy:    { animation: "companionHappy 1s ease-in-out infinite" },
    excited:  { animation: "companionExcited 0.9s ease-in-out infinite", filter: "drop-shadow(0 0 12px rgba(249,231,159,0.9))" },
    sad:      { animation: "companionSad 1.6s ease-in-out infinite", filter: "grayscale(0.2) opacity(0.85)" },
    teaching: { animation: "companionTeaching 1.3s ease-in-out infinite" },
    neutral:  { animation: "companionIdle 2s ease-in-out infinite" },
  }[mood] || {};

  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img
        src={AVATARS[which] || AVATARS.boy}
        alt={which === "boy" ? "Boy companion" : "Girl companion"}
        style={{ width: "100%", height: "100%", objectFit: "contain", ...moodStyle }}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    </div>
  );
}

/* =========================================================================
   SIGN HINT CARD — text/emoji description of hand shape. No external
   images (those would be copyrighted dictionary photos) — short
   first-person-written description instead.
   ========================================================================= */
function SignHintCard({ word }) {
  const hint = SIGN_REFERENCE[word];
  if (!hint) return null;
  return (
    <div style={{ background: "#FFFFFA", borderRadius: 16, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>🤟</span>
      <p style={{ margin: 0, fontSize: 13, color: COLORS.text, lineHeight: 1.4 }}>{hint}</p>
    </div>
  );
}

/* =========================================================================
   SMALL PRIMITIVES
   ========================================================================= */
function SoftShadow(extra = {}) {
  return { boxShadow: "0 4px 16px rgba(0,0,0,0.06)", ...extra };
}

function PrimaryButton({ children, onClick, bg = COLORS.cta, full = true, minHeight = 60, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg, color: COLORS.text, fontWeight: 700, fontSize: 20,
        borderRadius: 24, minHeight, width: full ? "100%" : "auto",
        padding: "12px 24px", border: "none", ...SoftShadow(),
        opacity: disabled ? 0.5 : 1, cursor: disabled ? "default" : "pointer",
        transition: "transform 120ms ease",
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

function BackBar({ title, onBack, accent = COLORS.text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 8px" }}>
      <button onClick={onBack} aria-label="Go back" style={{
        width: 44, height: 44, borderRadius: 16, border: "none", background: "#FFFFFA",
        display: "flex", alignItems: "center", justifyContent: "center", ...SoftShadow(),
      }}>
        <ArrowLeft size={20} color={COLORS.text} />
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: accent, margin: 0 }}>{title}</h1>
    </div>
  );
}

function BottomNav({ active, onNav, touchSize = 60 }) {
  const items = [
    { key: "home", label: "Home", Icon: Home },
    { key: "use-hub", label: "Talk", Icon: MessageCircle },
    { key: "garden-hub", label: "Garden", Icon: MapIcon },
    { key: "memory-tree", label: "Memories", Icon: TreeDeciduous },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, display: "flex",
      justifyContent: "space-around", padding: "8px 6px", background: "#FFFDF9",
      borderTop: "1px solid #F0E6D8",
    }}>
      {items.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button key={key} onClick={() => onNav(key)} aria-label={label} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            width: touchSize, height: touchSize, border: "none", background: "transparent",
            color: isActive ? COLORS.cta : COLORS.secondary, cursor: "pointer",
          }}>
            <Icon size={24} color={isActive ? COLORS.cta : COLORS.secondary} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FloatingLumaButton({ onClick, lumaColor, lumaForm }) {
  return (
    <button onClick={onClick} aria-label="Open Luma" style={{
      position: "absolute", right: 14, bottom: 84, width: 56, height: 56, borderRadius: "50%",
      border: "none", background: "#FFFDF9", ...SoftShadow(), display: "flex",
      alignItems: "center", justifyContent: "center", padding: 4,
    }}>
      <Luma mood="neutral" size={42} color={lumaColor} form={lumaForm} />
    </button>
  );
}

function ZoneBadge({ children, bg }) {
  return (
    <span style={{ background: bg, color: COLORS.text, fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 999 }}>
      {children}
    </span>
  );
}

/* =========================================================================
   SCREEN: SPLASH
   ========================================================================= */
function SplashScreen({ onDone }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1800);
    return () => clearTimeout(t1);
  }, []);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 0, animation: "breathe 2s ease-in-out infinite" }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: COLORS.cta, margin: 0, fontFamily: "inherit" }}>
          Silent Voice
        </h1>
      </div>
      <p style={{ fontSize: 18, color: COLORS.secondary, margin: 0 }}>Every voice is a seed.</p>
      {stage >= 1 && (
        <div className="sv-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 18 }}>
          <p style={{ fontSize: 16, color: COLORS.secondary, margin: 0 }}>Let's grow your garden together.</p>
          <PrimaryButton onClick={onDone} full={false}>Tap to begin</PrimaryButton>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   SCREEN: MEET LUMA
   ========================================================================= */
function MeetLumaScreen({ onNext }) {
  const [excited, setExcited] = useState(false);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 24, background: `linear-gradient(180deg, ${COLORS.cream} 0%, #F2EFFB 100%)` }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: COLORS.text, margin: 0 }}>Hello, friend!</h1>
      <Luma mood={excited ? "excited" : "happy"} size={130} />
      <div style={{ background: "#FFFFFA", borderRadius: 22, padding: "14px 18px", maxWidth: 280, textAlign: "center", ...SoftShadow() }}>
        <p style={{ margin: 0, fontSize: 18, color: COLORS.text }}>I can't speak yet — but I have a garden. Will you help me grow it?</p>
      </div>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <PrimaryButton onClick={() => { setExcited(true); setTimeout(onNext, 650); }}>I'd love to!</PrimaryButton>
      </div>
    </div>
  );
}

/* =========================================================================
   SCREEN: NAME
   ========================================================================= */
function NameScreen({ onNext, name, setName }) {
  const symbols = [
    { Icon: Star, label: "Star" }, { Icon: Heart, label: "Heart" }, { Icon: Sun, label: "Sun" },
    { Icon: Moon, label: "Moon" }, { Icon: Flower2, label: "Flower" },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 24, gap: 16 }}>
      <Luma mood="happy" size={70} />
      <div style={{ background: "#FFFFFA", borderRadius: 18, padding: "10px 16px", alignSelf: "flex-start", ...SoftShadow() }}>
        <p style={{ margin: 0, fontSize: 16, color: COLORS.text }}>What should I call you?</p>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        style={{
          height: 56, borderRadius: 16, border: `2px solid #EFE2D2`, padding: "0 18px",
          fontSize: 18, color: COLORS.text, background: "#FFFFFA", outline: "none",
        }}
      />
      <p style={{ fontSize: 14, color: COLORS.secondary, margin: "4px 0 0" }}>You can also use a symbol!</p>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {symbols.map(({ Icon, label }) => (
          <button key={label} onClick={() => setName(label)} aria-label={label} style={{
            minWidth: 60, height: 60, borderRadius: 18, border: "none",
            background: name === label ? COLORS.sun : "#FFFFFA", display: "flex",
            alignItems: "center", justifyContent: "center", ...SoftShadow(),
          }}>
            <Icon size={26} color={COLORS.text} />
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <PrimaryButton onClick={() => { if (!name) setName("Friend"); onNext(); }}>Next</PrimaryButton>
    </div>
  );
}

/* =========================================================================
   SCREEN: CHOOSE YOUR LUMA — form picker now actually changes Luma's shape
   ========================================================================= */
const FORM_ICONS = { Blob: "✦", Bunny: "🐰", Bird: "🐦", Star: "⭐", Cloud: "☁️" };

function ChooseLumaScreen({ onNext, lumaColor, setLumaColor, lumaForm, setLumaForm }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 24, gap: 16 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: COLORS.text, margin: 0, textAlign: "center" }}>Make Luma yours!</h1>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Luma mood="happy" size={120} color={lumaColor} form={lumaForm} />
      </div>
      <p style={{ fontSize: 14, color: COLORS.secondary, margin: 0 }}>Color</p>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {LUMA_SWATCHES.map((s) => (
          <button key={s.name} onClick={() => setLumaColor(s.hex)} aria-label={s.name} title={s.name} style={{
            minWidth: 44, width: 44, height: 44, borderRadius: "50%",
            border: lumaColor === s.hex ? `3px solid ${COLORS.cta}` : "3px solid transparent",
            background: s.hex, flexShrink: 0,
            transform: lumaColor === s.hex ? "scale(1.1)" : "scale(1)", cursor: "pointer",
          }} />
        ))}
      </div>
      <p style={{ fontSize: 14, color: COLORS.secondary, margin: 0 }}>Form</p>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {LUMA_FORMS.map((f) => (
          <button key={f} onClick={() => setLumaForm(f)} style={{
            minWidth: 76, height: 76, borderRadius: 20, border: lumaForm === f ? `3px solid ${COLORS.cta}` : "3px solid transparent",
            background: lumaForm === f ? COLORS.mint : "#FFFFFA",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
            fontSize: 12, fontWeight: 700, color: COLORS.text, ...SoftShadow(), cursor: "pointer",
          }}>
            <span style={{ fontSize: 22 }}>{FORM_ICONS[f]}</span>
            {f}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <PrimaryButton onClick={onNext}>Start Growing!</PrimaryButton>
    </div>
  );
}

/* =========================================================================
   SCREEN: HOME
   ========================================================================= */
function HomeScreen({ name, lumaColor, lumaForm, onOpenUse, onOpenGarden, recentPhrases, onReplay, onOpenLuma, touchSize }) {
  const [bubbleIdx, setBubbleIdx] = useState(0);
  const bubbles = ["I wonder what we'll grow today?", "Ready to talk?", `I missed you, ${name}!`];
  useEffect(() => {
    const t = setInterval(() => setBubbleIdx((i) => (i + 1) % bubbles.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "16px 16px 8px", gap: 14, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFFFA", borderRadius: 14, padding: "6px 10px", ...SoftShadow() }}>
          <Sun size={16} color={COLORS.cta} /><span style={{ fontSize: 13, color: COLORS.secondary }}>Sunny today!</span>
        </div>
        <button aria-label="Settings" onClick={() => onOpenLuma("settings")} style={{
          width: 40, height: 40, borderRadius: 14, border: "none", background: "#FFFFFA", display: "flex",
          alignItems: "center", justifyContent: "center", ...SoftShadow(),
        }}>
          <SettingsIcon size={18} color={COLORS.secondary} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ width: 140, height: 140, borderRadius: "50%", background: "#FFFDF4", display: "flex", alignItems: "center", justifyContent: "center", ...SoftShadow() }}>
          <button onClick={() => onOpenLuma("luma-menu")} style={{ border: "none", background: "transparent", cursor: "pointer" }} aria-label="Open Luma">
            <Luma mood="happy" size={108} color={lumaColor} form={lumaForm} />
          </button>
        </div>
        <div key={bubbleIdx} className="sv-fade-in" style={{ background: "#FFFFFA", borderRadius: 16, padding: "8px 14px", ...SoftShadow() }}>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.text }}>{bubbles[bubbleIdx]}</p>
        </div>
      </div>

      <button onClick={onOpenUse} style={{
        background: COLORS.cta, borderRadius: 24, minHeight: 80, border: "none", padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 14, ...SoftShadow(), cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: "#FFFDF9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MessageCircle size={24} color={COLORS.cta} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: COLORS.text }}>Talk Right Now</p>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.text, opacity: 0.75 }}>Sign language, text, pictures → voice</p>
        </div>
      </button>

      <button onClick={onOpenGarden} style={{
        background: COLORS.mint, borderRadius: 24, minHeight: 80, border: "none", padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 14, ...SoftShadow(), cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: "#FFFDF9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={24} color={COLORS.text} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: COLORS.text }}>Grow Your Garden</p>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.text, opacity: 0.75 }}>Play, learn, and help Luma bloom</p>
        </div>
      </button>

      <div>
        <p style={{ fontSize: 13, color: COLORS.secondary, margin: "2px 0 6px" }}>Recent Phrases</p>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
          {recentPhrases.length === 0 && (
            <div style={{ fontSize: 13, color: COLORS.secondary, padding: "8px 4px" }}>Nothing yet — try the Talk button!</div>
          )}
          {recentPhrases.map((p, i) => (
            <button key={i} onClick={() => onReplay(p)} style={{
              minWidth: 100, height: 60, borderRadius: 16, border: "none", background: "#FFFFFA",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "4px 8px", ...SoftShadow(), flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 92 }}>{p}</span>
              <span style={{ fontSize: 10, color: COLORS.secondary }}>Tap to say again</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   USE HUB
   ========================================================================= */
function UseHub({ onBack, onOpenTool, lumaColor, lumaForm }) {
  const tiles = [
    { key: "text",     label: "Type It",       Icon: Keyboard,      bg: COLORS.sky },
    { key: "sign",     label: "Show Signs",    Icon: Hand,          bg: COLORS.mint },
    { key: "morse",    label: "Blink to Speak",Icon: Eye,           bg: COLORS.coral },
    { key: "pictures", label: "Pick a Picture",Icon: ImageIcon,     bg: COLORS.sun },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar title="Talk Right Now" onBack={onBack} />
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 16px" }}>
        <Luma mood="neutral" size={56} color={lumaColor} form={lumaForm} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {tiles.map(({ key, label, Icon, bg }) => (
            <button key={key} onClick={() => onOpenTool(key)} style={{
              background: bg, borderRadius: 22, minHeight: 150, border: "none", ...SoftShadow(),
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer",
            }}>
              <Icon size={34} color={COLORS.text} />
              <span style={{ fontSize: 17, fontWeight: 800, color: COLORS.text }}>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={() => onOpenTool("dual")} style={{
            width: "100%", minHeight: 56, borderRadius: 18, border: `2px solid #EFE2D2`, background: "#FFFFFA",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
          }}>
            <Users size={18} color={COLORS.secondary} />
            <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.secondary }}>Dual-User Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Tool 1: Text -> Voice ---- */
function TextToVoiceTool({ onBack, onSpoke }) {
  const [text, setText] = useState("");
  const [slow, setSlow] = useState(false);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar title="Type It" onBack={onBack} />
      <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type what you want to say…"
          style={{ flex: 1, minHeight: 140, borderRadius: 20, border: "2px solid #EFE2D2", padding: 16, fontSize: 20, color: COLORS.text, background: "#FFFFFA", outline: "none", resize: "none" }} />
        <button onClick={() => setSlow((s) => !s)} style={{
          alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, border: "none", background: "transparent", cursor: "pointer",
        }}>
          <div style={{ width: 48, height: 28, borderRadius: 14, background: slow ? COLORS.sky : "#EFE2D2", position: "relative" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#FFFFFA", position: "absolute", top: 3, left: slow ? 23 : 3, transition: "left 150ms" }} />
          </div>
          <span style={{ fontSize: 14, color: COLORS.secondary }}>Slow repeat</span>
        </button>
        <PrimaryButton bg={COLORS.sky} disabled={!text.trim()} onClick={() => { speak(text, { rate: slow ? 0.7 : 1 }); onSpoke(text); }}>
          <Volume2 size={20} style={{ marginRight: 8, verticalAlign: "middle" }} /> Speak it
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ---- Tool 2: Sign Language — voice→sign (working) + camera tracking demo ---- */
function SignLanguageTool({ onBack, onSpoke, lumaColor, lumaForm }) {
  const words = SIGN_WORDS;
  const [mode, setMode] = useState("sign-to-voice");

  // voice→sign state
  const [listening, setListening] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null); // null | matched word | error string
  const [selectedWord, setSelectedWord] = useState(null);

  const camera = useCamera();

  const switchMode = (m) => {
    setMode(m);
    setVoiceResult(null);
    setSelectedWord(null);
    camera.stop();
  };

  // ── Voice → Sign: Web Speech API ────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceResult({ error: "Speech recognition not supported in this browser. Try Chrome." });
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    setListening(true);
    setVoiceResult(null);

    recognition.onresult = (e) => {
      setListening(false);
      const transcripts = Array.from(e.results[0]).map((r) => r.transcript.toLowerCase().trim());
      console.log("[Voice→Sign] heard:", transcripts);
      // try to match any alternative against our word list
      let matched = null;
      for (const t of transcripts) {
        matched = words.find((w) => w.toLowerCase() === t || t.includes(w.toLowerCase()));
        if (matched) break;
      }
      setVoiceResult(matched ? { word: matched } : { notFound: transcripts[0] });
    };
    recognition.onerror = (e) => { setListening(false); setVoiceResult({ error: e.error }); };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar title="Show Signs" onBack={onBack} />
      <div style={{ padding: "0 16px 8px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["sign-to-voice", "voice-to-sign"].map((m) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: "10px", borderRadius: 14, border: "none",
              background: mode === m ? COLORS.mint : "#FFFFFA",
              fontSize: 13, fontWeight: 700, color: COLORS.text, cursor: "pointer",
              boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}>
              {m === "sign-to-voice" ? "✋ Sign → Voice" : "🎙 Voice → Sign"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── SIGN → VOICE ── */}
        {mode === "sign-to-voice" && (
          <>
            <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>
              <Luma mood="teaching" size={76} color={lumaColor} form={lumaForm} />
              <CompanionAvatar which="boy" mood="teaching" size={76} />
            </div>
            <SignHintCard word="Water" />

            {camera.status === "idle" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "12px 0" }}>
                <p style={{ fontSize: 14, color: COLORS.secondary, textAlign: "center", margin: 0 }}>
                  Turn on the camera to see it in action.
                </p>
                <PrimaryButton bg={COLORS.mint} onClick={camera.start}>
                  <Camera size={18} style={{ marginRight: 8, verticalAlign: "middle" }} /> Start Camera
                </PrimaryButton>
              </div>
            ) : (
              <CameraPane camera={camera} height={200} />
            )}

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: COLORS.sun, borderRadius: 16, padding: "12px 14px" }}>
              <Sparkles size={18} color={COLORS.text} style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: COLORS.text, lineHeight: 1.4 }}>
                Camera access is real and working. Full sign recognition is still in progress (see the project README for why). Try <strong>Voice → Sign</strong> above for the working direction, or tap a word below.
              </p>
            </div>
          </>
        )}

        {/* ── VOICE → SIGN ── */}
        {mode === "voice-to-sign" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 0" }}>
              <Luma mood={listening ? "excited" : voiceResult?.word ? "happy" : "teaching"} size={100} color={lumaColor} form={lumaForm} />
              <p style={{ fontSize: 14, color: COLORS.secondary, textAlign: "center", margin: 0 }}>
                Say a word — Luma will find its sign.
              </p>
            </div>

            <PrimaryButton
              bg={listening ? COLORS.coral : COLORS.sky}
              disabled={listening}
              onClick={startListening}
            >
              <Mic size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
              {listening ? "Listening… speak now" : "Tap to speak"}
            </PrimaryButton>

            {voiceResult?.word && (
              <div className="sv-fade-in" style={{ background: COLORS.success, borderRadius: 18, padding: "14px 16px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: COLORS.secondary }}>You said</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.text }}>{voiceResult.word}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.secondary }}>
                  ASL label: <strong>{WORD_TO_LABEL[voiceResult.word]}</strong>
                </p>
                <div style={{ marginTop: 8 }}><SignHintCard word={voiceResult.word} /></div>
              </div>
            )}
            {voiceResult?.notFound && (
              <div className="sv-fade-in" style={{ background: COLORS.warning, borderRadius: 18, padding: "12px 16px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 14, color: COLORS.text }}>
                  Heard "{voiceResult.notFound}" — not in sign library yet.
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.secondary }}>Try: Hello, Water, Please, Thank you…</p>
              </div>
            )}
            {voiceResult?.error && (
              <div style={{ background: "#F9E0E0", borderRadius: 14, padding: "10px 14px" }}>
                <p style={{ margin: 0, fontSize: 13, color: COLORS.text }}>{voiceResult.error}</p>
              </div>
            )}

            <p style={{ fontSize: 13, color: COLORS.secondary, margin: 0 }}>Or tap a word directly:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {words.map((w) => (
                <button key={w} onClick={() => { setVoiceResult({ word: w }); speak(w); onSpoke(w); }} style={{
                  minHeight: 60, borderRadius: 16, border: "none",
                  background: voiceResult?.word === w ? COLORS.mint : "#FFFFFA", ...SoftShadow(),
                  fontSize: 14, fontWeight: 700, color: COLORS.text, cursor: "pointer",
                }}>{w}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Tool 3: Eye-Blink Morse ---- */
const MORSE_MAP = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G",
  "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N",
  "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U",
  "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z",
};
function EyeBlinkMorseTool({ onBack, onSpoke }) {
  const [pattern, setPattern] = useState("");
  const [decoded, setDecoded] = useState("");
  const camera = useCamera();

  const addSymbol = (sym) => setPattern((p) => p + sym);
  const commitLetter = () => {
    if (!pattern) return;
    const letter = MORSE_MAP[pattern] || "?";
    setDecoded((d) => d + letter);
    setPattern("");
  };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: COLORS.plum, color: "#FFFDF9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 8px" }}>
        <button onClick={onBack} aria-label="Go back" style={{ width: 44, height: 44, borderRadius: 16, border: "none", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color="#FFFDF9" />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: COLORS.coral, margin: 0 }}>Blink to Speak</h1>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        {camera.status === "idle" ? (
          <button onClick={camera.start} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 16, border: "none",
            background: COLORS.coral, color: COLORS.text, fontWeight: 700, cursor: "pointer",
          }}>
            <Camera size={18} /> Use My Eyes
          </button>
        ) : (
          <CameraPane camera={camera} height={170} />
        )}
        <p style={{ fontSize: 12, opacity: 0.65, textAlign: "center", margin: 0 }}>
          Dot/Dash buttons are the live input. Blink detection needs a face model — coming later.
        </p>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, minHeight: 40 }}>{pattern || "·"}</div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => addSymbol(".")} style={{ width: 90, height: 90, borderRadius: 28, border: "none", background: COLORS.coral, color: COLORS.text, fontSize: 22, fontWeight: 800, cursor: "pointer" }}>• Dot</button>
          <button onClick={() => addSymbol("-")} style={{ width: 90, height: 90, borderRadius: 28, border: "none", background: COLORS.coral, color: COLORS.text, fontSize: 22, fontWeight: 800, cursor: "pointer" }}>— Dash</button>
        </div>
        <button onClick={commitLetter} style={{ padding: "10px 20px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#FFFDF9", fontSize: 14, cursor: "pointer" }}>Decode letter</button>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: "12px 20px", minWidth: 200, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>Decoded</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{decoded || "—"}</p>
        </div>
        <div style={{ flex: 1 }} />
        <PrimaryButton bg={COLORS.coral} disabled={!decoded} onClick={() => { speak(decoded); onSpoke(decoded); setDecoded(""); }}>Speak It</PrimaryButton>
      </div>
    </div>
  );
}

/* ---- Tool 4: Pictures ---- */
function PicturesToVoiceTool({ onBack, onSpoke }) {
  const pics = [
    { label: "Water", Icon: Cloud }, { label: "Happy", Icon: Sun }, { label: "Love", Icon: Heart },
    { label: "Help", Icon: Hand }, { label: "More", Icon: Star }, { label: "Rest", Icon: Moon },
  ];
  const [picked, setPicked] = useState(null);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar title="Pick a Picture" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {pics.map(({ label, Icon }) => (
            <button key={label} onClick={() => { setPicked(label); speak(label); onSpoke(label); }} style={{
              minHeight: 92, borderRadius: 20, border: "none", background: picked === label ? COLORS.sun : "#FFFFFA",
              ...SoftShadow(), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
            }}>
              <Icon size={28} color={COLORS.text} />
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Dual User Mode ---- */
function DualUserMode({ onBack }) {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar title="Dual-User Mode" onBack={onBack} />
      <div style={{ flex: 1, display: "flex", gap: 8, padding: "8px 16px 16px" }}>
        {/* Person A */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.secondary, textAlign: "center" }}>Person A</p>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="Type here…"
            style={{ flex: 1, borderRadius: 16, border: `2px solid ${COLORS.sky}`, padding: 12, fontSize: 16, color: COLORS.text, background: "#F0F8FF", outline: "none", resize: "none" }}
          />
          <button
            onClick={() => { if (textA.trim()) { speak(textA); } }}
            disabled={!textA.trim()}
            style={{ minHeight: 48, borderRadius: 14, border: "none", background: COLORS.sky, fontWeight: 700, fontSize: 15, color: COLORS.text, cursor: "pointer", opacity: textA.trim() ? 1 : 0.5 }}
          >
            <Volume2 size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />Speak
          </button>
        </div>

        {/* Middle Luma */}
        <div style={{ width: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Luma mood="teaching" size={40} />
        </div>

        {/* Person B */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: COLORS.secondary, textAlign: "center" }}>Person B</p>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Type here…"
            style={{ flex: 1, borderRadius: 16, border: `2px solid ${COLORS.mint}`, padding: 12, fontSize: 16, color: COLORS.text, background: "#F0FFF4", outline: "none", resize: "none" }}
          />
          <button
            onClick={() => { if (textB.trim()) { speak(textB); } }}
            disabled={!textB.trim()}
            style={{ minHeight: 48, borderRadius: 14, border: "none", background: COLORS.mint, fontWeight: 700, fontSize: 15, color: COLORS.text, cursor: "pointer", opacity: textB.trim() ? 1 : 0.5 }}
          >
            <Volume2 size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />Speak
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   GARDEN HUB
   ========================================================================= */
function GardenHub({ onBack, onOpenZone, progress }) {
  const zones = [
    { key: "sign",  name: "Sign Language Garden", badge: "Hand Shapes", bg: COLORS.mint },
    { key: "morse", name: "The Code Corner",       badge: "Light Messages", bg: COLORS.coral },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar title="The Gathering Glade" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12 }}>
          <TreeDeciduous size={56} color="#8FAE7A" />
          <p style={{ fontSize: 13, color: COLORS.secondary, margin: "2px 0 0" }}>The Memory Tree — {progress.totalMemories} memories grown</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {zones.map((z) => (
            <button key={z.key} onClick={() => onOpenZone(z.key)} style={{
              background: z.bg, borderRadius: 22, minHeight: 150, border: "none", ...SoftShadow(),
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, cursor: "pointer",
            }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, textAlign: "center" }}>{z.name}</span>
              <ZoneBadge bg="#FFFFFA">{z.badge}</ZoneBadge>
              <span style={{ fontSize: 11, color: COLORS.text, opacity: 0.7 }}>{progress[z.key] || 0} grown</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   CAMERA HOOK
   ========================================================================= */
function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("idle");

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported"); return;
    }
    setStatus("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("live");
    } catch {
      setStatus("denied");
    }
  }, []);

  useEffect(() => () => stop(), [stop]);
  return { videoRef, status, start, stop };
}

function CameraPane({ camera, height = 200 }) {
  return (
    <div style={{ width: "100%", height, borderRadius: 20, overflow: "hidden", background: "#1E1730", position: "relative" }}>
      <video
        ref={camera.videoRef}
        playsInline muted
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: camera.status === "live" ? "block" : "none" }}
      />
      {camera.status !== "live" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#D9D4EE" }}>
          {camera.status === "connecting" && <><Loader2 size={28} style={{ animation: "spin360 1s linear infinite" }} /><span style={{ fontSize: 13 }}>Connecting…</span></>}
          {camera.status === "idle" && <><Camera size={28} /><span style={{ fontSize: 13 }}>Camera is off</span></>}
          {camera.status === "denied" && <><CameraOff size={28} /><span style={{ fontSize: 13, textAlign: "center", padding: "0 16px" }}>Camera blocked. Use manual buttons.</span></>}
          {camera.status === "unsupported" && <><CameraOff size={28} /><span style={{ fontSize: 13, textAlign: "center", padding: "0 16px" }}>Camera not available here.</span></>}
        </div>
      )}
    </div>
  );
}

/* ---- Zone: Sign Language Garden ---- */
function SignLanguageZone({ onBack, onGrow, lumaColor, lumaForm }) {
  const words = SIGN_WORDS;
  const [wordIdx, setWordIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [learned, setLearned] = useState(0);
  const camera = useCamera();
  const word = words[wordIdx];

  // NOTE: auto-verifying the sign against the camera needs a working
  // gesture-classifier model, which isn't there yet (see README). Until
  // then this is self-paced practice — camera tracking is live and real,
  // marking a sign "done" is on you, not the model.
  const markPracticed = () => {
    setResult("correct");
    setLearned((n) => n + 1);
    onGrow(word);
    setTimeout(() => { setResult(null); setWordIdx((i) => (i + 1) % words.length); }, 1300);
  };

  const companionMood = result === "correct" ? "excited" : "teaching";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#EAF6EC,#FFF8F0)" }}>
      <BackBar title="Sign Language Garden" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <ZoneBadge bg={COLORS.mint}>Hand Shapes</ZoneBadge>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Luma mood={companionMood} size={88} color={lumaColor} form={lumaForm} />
            <CompanionAvatar which="girl" mood={companionMood} size={88} />
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, margin: 0 }}>{word}</p>
          <p style={{ fontSize: 13, color: COLORS.secondary, margin: 0 }}>Show this sign to the camera, then mark it practiced.</p>
        </div>
        <SignHintCard word={word} />
        {camera.status === "idle" ? (
          <PrimaryButton bg={COLORS.mint} onClick={camera.start}>
            <Hand size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />Watch Luma, then show me!
          </PrimaryButton>
        ) : (
          <>
            <CameraPane camera={camera} />
            <PrimaryButton bg={COLORS.mint} onClick={markPracticed}>
              I practiced this! ✋
            </PrimaryButton>
            <p style={{ fontSize: 11, color: COLORS.secondary, textAlign: "center", margin: 0 }}>
              Camera access is real and working. Auto-checking your sign against the word is in progress — for now, practice at your own pace.
            </p>
          </>
        )}
        {result === "correct" && (
          <div className="sv-fade-in" style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.success, borderRadius: 16, padding: "10px 16px" }}>
            <CheckCircle2 size={20} color={COLORS.text} /><span style={{ fontWeight: 700, color: COLORS.text }}>Lovely! A flower blooms 🌸</span>
          </div>
        )}
        <p style={{ fontSize: 13, color: COLORS.secondary }}>🌿 {learned} signs grown</p>
      </div>
    </div>
  );
}

/* ---- Zone: Code Corner ---- */
function MorseCodeZone({ onBack, onGrow, lumaColor, lumaForm }) {
  const letters = ["E", "S", "O", "A"];
  const reverseMap = { E: ".", S: "...", O: "---", A: ".-" };
  const [target, setTarget] = useState(letters[0]);
  const [built, setBuilt] = useState("");
  const [solved, setSolved] = useState(0);
  const [demoStep, setDemoStep] = useState(-1);
  const [result, setResult] = useState(null);
  const camera = useCamera();

  const playDemo = () => {
    const pattern = reverseMap[target].split("");
    setDemoStep(0);
    pattern.forEach((_, i) => setTimeout(() => setDemoStep(i + 1), (i + 1) * 500));
    setTimeout(() => setDemoStep(-1), (pattern.length + 1) * 500);
  };

  const submitSymbol = (sym) => {
    const next = built + sym;
    if (reverseMap[target].startsWith(next)) {
      setBuilt(next);
      if (next === reverseMap[target]) {
        setSolved((s) => s + 1);
        setResult("correct");
        onGrow(`Letter ${target}`);
        setTimeout(() => { setResult(null); setBuilt(""); setTarget(letters[Math.floor(Math.random() * letters.length)]); }, 1100);
      }
    } else {
      setResult("incorrect"); setBuilt("");
      setTimeout(() => setResult(null), 700);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: COLORS.plum, color: "#FFFDF9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 8px" }}>
        <button onClick={onBack} aria-label="Go back" style={{ width: 44, height: 44, borderRadius: 16, border: "none", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color="#FFFDF9" />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: COLORS.coral, margin: 0 }}>The Code Corner</h1>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <ZoneBadge bg={COLORS.coral}>Light Messages</ZoneBadge>
        <Luma mood="teaching" size={84} color={lumaColor} form={lumaForm} />
        <p style={{ fontSize: 16, margin: 0 }}>Letter to make: <strong>{target}</strong></p>
        <button onClick={playDemo} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#FFFDF9", fontSize: 13, cursor: "pointer" }}>
          <Eye size={16} /> Watch Luma blink it
        </button>
        <div style={{ display: "flex", gap: 8, minHeight: 30 }}>
          {reverseMap[target].split("").map((sym, i) => (
            <span key={i} style={{ fontSize: 24, fontWeight: 800, opacity: demoStep > i ? 1 : 0.25, transition: "opacity 150ms" }}>{sym}</span>
          ))}
        </div>
        {camera.status === "idle" ? (
          <button onClick={camera.start} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 16, border: "none", background: COLORS.coral, color: COLORS.text, fontWeight: 700, cursor: "pointer" }}>
            <Camera size={18} /> Try with my eyes
          </button>
        ) : (
          <CameraPane camera={camera} height={150} />
        )}
        <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>Your pattern: <span style={{ fontSize: 18, letterSpacing: 4 }}>{built || "·"}</span></p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => submitSymbol(".")} style={{ width: 80, height: 80, borderRadius: 26, border: "none", background: COLORS.coral, color: COLORS.text, fontSize: 18, fontWeight: 800, cursor: "pointer" }}>• Dot</button>
          <button onClick={() => submitSymbol("-")} style={{ width: 80, height: 80, borderRadius: 26, border: "none", background: COLORS.coral, color: COLORS.text, fontSize: 18, fontWeight: 800, cursor: "pointer" }}>— Dash</button>
        </div>
        {result === "correct" && <p style={{ color: COLORS.success, fontWeight: 700 }}>✨ Firefly lit!</p>}
        {result === "incorrect" && <p style={{ color: COLORS.warning, fontWeight: 700 }} className="sv-fade-in">Gentle flicker — try again</p>}
        <p style={{ fontSize: 13, opacity: 0.7 }}>🔥 {solved} fireflies lit</p>
      </div>
    </div>
  );
}

/* =========================================================================
   MEMORY TREE
   ========================================================================= */
function MemoryTreeScreen({ onBack, orbs, onReplay }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Speaking", "Symbols", "Codes"];
  const filtered = filter === "All" ? orbs : orbs.filter((o) => o.zone === filter);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#2C1F3D 0%,#473A5C 40%,#FFF8F0 100%)" }}>
      <div style={{ padding: "16px 16px 4px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FFFDF9", margin: 0 }}>Your Growing Voice</h1>
        <p style={{ fontSize: 13, color: "#D9D4EE", margin: "2px 0 0" }}>Every word you've grown</p>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto" }}>
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 12px", borderRadius: 12, border: "none", flexShrink: 0,
            background: filter === f ? COLORS.mint : "rgba(255,255,255,0.15)",
            color: filter === f ? COLORS.text : "#FFFDF9", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>{f}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 40, color: "#FFFDF9" }}>
            <TreeDeciduous size={48} color="#9CC98A" />
            <p style={{ fontSize: 14, marginTop: 8 }}>Let's plant your first memory!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {filtered.map((o) => (
              <button key={o.id} onClick={() => onReplay(o.text)} style={{
                minHeight: 70, borderRadius: 18, border: "none", background: "rgba(255,255,255,0.92)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 6, cursor: "pointer",
              }}>
                <span style={{ fontSize: 18 }}>🔮</span>
                <span style={{ fontSize: 11, color: COLORS.text, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{o.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <button onClick={onBack} style={{ width: "100%", minHeight: 50, borderRadius: 18, border: "none", background: "rgba(255,255,255,0.15)", color: "#FFFDF9", fontWeight: 700, cursor: "pointer" }}>Back to garden</button>
      </div>
    </div>
  );
}

/* =========================================================================
   SETTINGS
   ========================================================================= */
function Toggle({ on, onClick, label }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "transparent", border: "none", padding: "10px 0", cursor: "pointer" }}>
      <span style={{ fontSize: 15, color: COLORS.text }}>{label}</span>
      <div style={{ width: 48, height: 28, borderRadius: 14, background: on ? COLORS.success : "#EFE2D2", position: "relative" }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#FFFFFA", position: "absolute", top: 3, left: on ? 23 : 3, transition: "left 150ms" }} />
      </div>
    </button>
  );
}

function SettingsScreen({ onBack, settings, setSettings }) {
  const upd = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar title="Settings" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#FFFFFA", borderRadius: 20, padding: 14, ...SoftShadow(), border: `2px solid ${COLORS.success}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Contrast size={18} color={COLORS.text} />
            <p style={{ margin: 0, fontWeight: 800, color: COLORS.text }}>Accessibility</p>
          </div>
          <Toggle label="Reduce motion" on={settings.reduceMotion} onClick={() => upd("reduceMotion", !settings.reduceMotion)} />
          <Toggle label="High contrast" on={settings.highContrast} onClick={() => upd("highContrast", !settings.highContrast)} />
          <Toggle label="Dyslexia-friendly spacing" on={settings.dyslexia} onClick={() => upd("dyslexia", !settings.dyslexia)} />
          <div style={{ padding: "10px 0" }}>
            <p style={{ fontSize: 15, color: COLORS.text, margin: "0 0 8px" }}>Touch target size</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[60, 72, 84].map((sz) => (
                <button key={sz} onClick={() => upd("touchSize", sz)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 12, border: "none",
                  background: settings.touchSize === sz ? COLORS.mint : "#F3EEE3", fontWeight: 700, color: COLORS.text, cursor: "pointer",
                }}>{sz}px</button>
              ))}
            </div>
          </div>
          <Toggle label="Color-blind patterns" on={settings.colorBlind} onClick={() => upd("colorBlind", !settings.colorBlind)} />
        </div>
        <div style={{ background: "#FFFFFA", borderRadius: 20, padding: 14, ...SoftShadow() }}>
          <p style={{ margin: "0 0 6px", fontWeight: 800, color: COLORS.text }}>Communication</p>
          <p style={{ fontSize: 13, color: COLORS.secondary, margin: "0 0 6px" }}>Grid layout</p>
          <div style={{ display: "flex", gap: 8 }}>
            {["3x3", "4x4", "5x5"].map((g) => (
              <button key={g} onClick={() => upd("grid", g)} style={{
                flex: 1, padding: "8px 0", borderRadius: 12, border: "none",
                background: settings.grid === g ? COLORS.sky : "#F3EEE3", fontWeight: 700, color: COLORS.text, cursor: "pointer",
              }}>{g}</button>
            ))}
          </div>
        </div>
        <div style={{ background: "#FFFFFA", borderRadius: 20, padding: 14, ...SoftShadow() }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <ShieldCheck size={18} color={COLORS.text} />
            <p style={{ margin: 0, fontWeight: 800, color: COLORS.text }}>Privacy</p>
          </div>
          <p style={{ fontSize: 13, color: COLORS.secondary, margin: "0 0 10px" }}>Your garden is private by default.</p>
          <Toggle label="Family access" on={settings.familyAccess} onClick={() => upd("familyAccess", !settings.familyAccess)} />
          <Toggle label="Therapist access" on={settings.therapistAccess} onClick={() => upd("therapistAccess", !settings.therapistAccess)} />
          <button style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: COLORS.secondary, fontSize: 13, cursor: "pointer" }}>
            <Trash2 size={14} /> Pack up my garden (delete data)
          </button>
        </div>
      </div>
    </div>
  );
}

function LumaMenuSheet({ onClose, lumaColor, lumaForm }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(74,74,74,0.25)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 30 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="sv-fade-in" style={{ width: "100%", background: COLORS.cream, borderRadius: "28px 28px 0 0", padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, ...SoftShadow() }}>
        <Luma mood="happy" size={90} color={lumaColor} form={lumaForm} />
        <p style={{ fontSize: 15, color: COLORS.text, textAlign: "center", margin: 0 }}>I'm always here if you need me.</p>
        <PrimaryButton onClick={onClose} full={false}>Okay!</PrimaryButton>
      </div>
    </div>
  );
}

/* =========================================================================
   APP ROUTER
   ========================================================================= */
const ZONE_TAG = { sign: "Speaking", morse: "Codes" };
const TOOL_TAG = { text: "Speaking", sign: "Speaking", morse: "Codes", pictures: "Symbols" };

export default function SilentVoiceApp() {
  const [nav, setNav] = useState(["splash"]);
  const [name, setName] = useState("");
  const [lumaColor, setLumaColor] = useState(COLORS.luma);
  const [lumaForm, setLumaForm] = useState("Blob");
  const [recentPhrases, setRecentPhrases] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [zoneCounts, setZoneCounts] = useState({ sign: 0, morse: 0 });
  const [showLumaSheet, setShowLumaSheet] = useState(false);
  const [settings, setSettings] = useState({
    reduceMotion: false, highContrast: false, dyslexia: false, touchSize: 60,
    colorBlind: false, grid: "3x3", familyAccess: false, therapistAccess: false,
  });

  const screen = nav[nav.length - 1];
  const push = (s) => setNav((n) => [...n, s]);
  const back = () => setNav((n) => (n.length > 1 ? n.slice(0, -1) : n));
  const goRoot = (s) => setNav([s]);

  const addMemory = useCallback((text, zoneTag) => {
    if (!text) return;
    setRecentPhrases((p) => [text, ...p.filter((x) => x !== text)].slice(0, 5));
    setOrbs((o) => [{ id: `${Date.now()}-${Math.random()}`, text, zone: zoneTag }, ...o]);
  }, []);

  const onToolSpoke = (toolKey) => (text) => addMemory(text, TOOL_TAG[toolKey] || "Speaking");
  const onZoneGrow = (zoneKey) => (text) => {
    setZoneCounts((c) => ({ ...c, [zoneKey]: (c[zoneKey] || 0) + 1 }));
    if (text) addMemory(text, ZONE_TAG[zoneKey]);
  };

  const baseFont = settings.dyslexia ? "Verdana, Tahoma, sans-serif" : "'Nunito', 'Segoe UI', system-ui, sans-serif";
  const textColor = settings.highContrast ? "#262626" : COLORS.text;

  const showTabs = ["home", "use-hub", "garden-hub", "memory-tree"].includes(screen);
  const showFab = !["splash", "onboarding-meet", "onboarding-name", "onboarding-choose"].includes(screen);

  let body = null;
  if (screen === "splash") {
    body = <SplashScreen onDone={() => push("onboarding-meet")} />;
  } else if (screen === "onboarding-meet") {
    body = <MeetLumaScreen onNext={() => push("onboarding-name")} />;
  } else if (screen === "onboarding-name") {
    body = <NameScreen onNext={() => push("onboarding-choose")} name={name} setName={setName} />;
  } else if (screen === "onboarding-choose") {
    body = <ChooseLumaScreen onNext={() => goRoot("home")} lumaColor={lumaColor} setLumaColor={setLumaColor} lumaForm={lumaForm} setLumaForm={setLumaForm} />;
  } else if (screen === "home") {
    body = (
      <HomeScreen
        name={name || "Friend"} lumaColor={lumaColor} lumaForm={lumaForm}
        onOpenUse={() => push("use-hub")} onOpenGarden={() => push("garden-hub")}
        recentPhrases={recentPhrases} onReplay={(t) => speak(t)}
        onOpenLuma={(target) => target === "settings" ? push("settings") : setShowLumaSheet(true)}
        touchSize={settings.touchSize}
      />
    );
  } else if (screen === "use-hub") {
    body = <UseHub onBack={back} onOpenTool={(k) => push(`tool-${k}`)} lumaColor={lumaColor} lumaForm={lumaForm} />;
  } else if (screen === "tool-text") {
    body = <TextToVoiceTool onBack={back} onSpoke={onToolSpoke("text")} />;
  } else if (screen === "tool-sign") {
    body = <SignLanguageTool onBack={back} onSpoke={onToolSpoke("sign")} lumaColor={lumaColor} lumaForm={lumaForm} />;
  } else if (screen === "tool-morse") {
    body = <EyeBlinkMorseTool onBack={back} onSpoke={onToolSpoke("morse")} />;
  } else if (screen === "tool-pictures") {
    body = <PicturesToVoiceTool onBack={back} onSpoke={onToolSpoke("pictures")} />;
  } else if (screen === "tool-dual") {
    body = <DualUserMode onBack={back} />;
  } else if (screen === "garden-hub") {
    body = <GardenHub onBack={back} onOpenZone={(k) => push(`zone-${k}`)} progress={{ ...zoneCounts, totalMemories: orbs.length }} />;
  } else if (screen === "zone-sign") {
    body = <SignLanguageZone onBack={back} onGrow={onZoneGrow("sign")} lumaColor={lumaColor} lumaForm={lumaForm} />;
  } else if (screen === "zone-morse") {
    body = <MorseCodeZone onBack={back} onGrow={onZoneGrow("morse")} lumaColor={lumaColor} lumaForm={lumaForm} />;
  } else if (screen === "memory-tree") {
    body = <MemoryTreeScreen onBack={() => goRoot("home")} orbs={orbs} onReplay={(t) => speak(t)} />;
  } else if (screen === "settings") {
    body = <SettingsScreen onBack={back} settings={settings} setSettings={setSettings} />;
  }

  return (
    <div style={{
      width: "100%", maxWidth: 420, height: 760, margin: "0 auto", position: "relative",
      background: COLORS.cream, borderRadius: 36, overflow: "hidden", fontFamily: baseFont,
      color: textColor, ...SoftShadow({ boxShadow: "0 8px 30px rgba(0,0,0,0.10)" }),
    }} className={`sv-app ${settings.reduceMotion ? "sv-reduce-motion" : ""}`}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {body}
      </div>
      {showTabs && <BottomNav active={screen} onNav={(k) => goRoot(k)} touchSize={settings.touchSize} />}
      {showFab && !showLumaSheet && (
        <FloatingLumaButton lumaColor={lumaColor} lumaForm={lumaForm} onClick={() => setShowLumaSheet(true)} />
      )}
      {showLumaSheet && <LumaMenuSheet onClose={() => setShowLumaSheet(false)} lumaColor={lumaColor} lumaForm={lumaForm} />}
    </div>
  );
}