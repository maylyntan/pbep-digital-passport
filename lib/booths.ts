import type { Booth } from "./types";

export const booths: Booth[] = [
  {
    id: "booth-1",
    slug: "hello-hub",
    title: "Hello Hub",
    prompt: "Introduce yourself to someone you have not spoken with today.",
    helper: "Say your name, where you are from, and one thing you enjoy.",
    emoji: "👋",
  },
  {
    id: "booth-2",
    slug: "story-station",
    title: "Story Station",
    prompt: "Tell a short story about a memorable day.",
    helper: "Try to include a beginning, a surprising moment, and an ending.",
    emoji: "📖",
  },
  {
    id: "booth-3",
    slug: "opinion-corner",
    title: "Opinion Corner",
    prompt: "Share an opinion and give two reasons for it.",
    helper: "Start with: “I think…” and ask your partner what they think too.",
    emoji: "💬",
  },
  {
    id: "booth-4",
    slug: "culture-swap",
    title: "Culture Swap",
    prompt: "Teach someone one interesting thing about your culture or hometown.",
    helper: "It could be food, a celebration, music, language, or a local place.",
    emoji: "🌏",
  },
  {
    id: "booth-5",
    slug: "future-me",
    title: "Future Me",
    prompt: "Describe something you want to achieve in the next five years.",
    helper: "Explain why it matters to you and one step you can take this year.",
    emoji: "🚀",
  },
  {
    id: "booth-6",
    slug: "question-quest",
    title: "Question Quest",
    prompt: "Keep a two-minute conversation going using follow-up questions.",
    helper: "Try: Why? How did that feel? What happened next? Would you do it again?",
    emoji: "❓",
  },
  {
    id: "booth-7",
    slug: "word-challenge",
    title: "Word Challenge",
    prompt: "Use three new English words naturally in a short conversation.",
    helper: "Ask the booth teacher for three challenge words before you begin.",
    emoji: "✨",
  },
  {
    id: "booth-8",
    slug: "voice-finale",
    title: "Voice Finale",
    prompt: "Give a 30-second mini-speech: one thing you learned today.",
    helper: "Speak clearly, make eye contact, and finish with a confident final sentence.",
    emoji: "🎤",
  },
];

export function getBooth(slug: string) {
  return booths.find((booth) => booth.slug === slug);
}
