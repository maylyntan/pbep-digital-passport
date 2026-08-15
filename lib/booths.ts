export type BoothCategory =
  | "Conversation"
  | "Creativity"
  | "Challenges"
  | "Performance"
  | "Games";

export interface Booth {
  /** QR slug and database booth_slug. Never change after the kit is printed. */
  id: string;
  number: number;
  name: string;
  category: BoothCategory;
  skill: string;
  prompt: string;
}

export const BOOTHS: readonly Booth[] = Object.freeze([
  {
    id: "conversation-cafe",
    number: 1,
    name: "Conversation Café",
    category: "Conversation",
    skill: "Asking questions",
    prompt: "Keep a friendly conversation going for two minutes.",
  },
  {
    id: "story-builder",
    number: 2,
    name: "Story Builder",
    category: "Creativity",
    skill: "Storytelling",
    prompt: "Add ideas to build a surprising group story.",
  },
  {
    id: "escape-room",
    number: 3,
    name: "Escape Room",
    category: "Challenges",
    skill: "Collaborating",
    prompt: "Explain clues clearly and solve them as a team.",
  },
  {
    id: "karaoke-corner",
    number: 4,
    name: "Karaoke Corner",
    category: "Performance",
    skill: "Performing",
    prompt: "Sing with expression and introduce your song.",
  },
  {
    id: "trivia-challenge",
    number: 5,
    name: "Trivia Challenge",
    category: "Games",
    skill: "Responding",
    prompt: "Discuss your answer before your team locks it in.",
  },
  {
    id: "speed-friending",
    number: 6,
    name: "Speed Friending",
    category: "Conversation",
    skill: "Active listening",
    prompt: "Meet someone new and ask thoughtful follow-up questions.",
  },
  {
    id: "movie-dub",
    number: 7,
    name: "Movie Dub",
    category: "Performance",
    skill: "Performing",
    prompt: "Create English dialogue for a short silent scene.",
  },
  {
    id: "english-board-games",
    number: 8,
    name: "English Board Games",
    category: "Games",
    skill: "Explaining",
    prompt: "Play, negotiate and explain every move in English.",
  },
  {
    id: "voice-recording",
    number: 9,
    name: "Voice Recording Booth",
    category: "Performance",
    skill: "Speaking clearly",
    prompt: "Record a confident message for the festival.",
  },
  {
    id: "accent-challenge",
    number: 10,
    name: "Accent Challenge",
    category: "Challenges",
    skill: "Pronunciation",
    prompt: "Listen carefully and reproduce rhythm and expression.",
  },
  {
    id: "interview-booth",
    number: 11,
    name: "Interview Booth",
    category: "Conversation",
    skill: "Asking questions",
    prompt: "Interview a partner and introduce them to the group.",
  },
  {
    id: "role-play-roulette",
    number: 12,
    name: "Role Play Roulette",
    category: "Performance",
    skill: "Responding",
    prompt: "Adapt quickly to a surprise real-life situation.",
  },
  {
    id: "charades-plus",
    number: 13,
    name: "Charades Plus",
    category: "Games",
    skill: "Describing",
    prompt: "Use clues, questions and descriptions to find the answer.",
  },
  {
    id: "emotion-theatre",
    number: 14,
    name: "Emotion Theatre",
    category: "Performance",
    skill: "Expression",
    prompt: "Perform a scene using voice, emotion and body language.",
  },
  {
    id: "would-you-rather",
    number: 15,
    name: "Would You Rather?",
    category: "Conversation",
    skill: "Explaining",
    prompt: "Choose, justify and respond to another point of view.",
  },
  {
    id: "debate-corner",
    number: 16,
    name: "Debate Corner",
    category: "Challenges",
    skill: "Persuading",
    prompt: "Make a clear claim and support it with a reason.",
  },
  {
    id: "sell-it",
    number: 17,
    name: "Sell It!",
    category: "Creativity",
    skill: "Persuading",
    prompt: "Pitch a mystery object with energy and detail.",
  },
  {
    id: "guess-who",
    number: 18,
    name: "Guess Who?",
    category: "Games",
    skill: "Describing",
    prompt: "Ask precise questions to identify the mystery person.",
  },
  {
    id: "storytelling-booth",
    number: 19,
    name: "Storytelling Booth",
    category: "Creativity",
    skill: "Storytelling",
    prompt: "Tell a vivid story with a beginning, middle and end.",
  },
  {
    id: "mystery-object",
    number: 20,
    name: "Mystery Object",
    category: "Challenges",
    skill: "Describing",
    prompt: "Describe what you can feel without naming the object.",
  },
  {
    id: "poetry-mic",
    number: 21,
    name: "Poetry Mic",
    category: "Performance",
    skill: "Expression",
    prompt: "Perform a short poem with pace, feeling and confidence.",
  },
  {
    id: "school-newsroom",
    number: 22,
    name: "School Newsroom",
    category: "Creativity",
    skill: "Explaining",
    prompt: "Deliver a lively English news update as a team.",
  },
  {
    id: "picture-talk",
    number: 23,
    name: "Picture Talk",
    category: "Conversation",
    skill: "Describing",
    prompt: "Notice details, make inferences and compare ideas.",
  },
  {
    id: "problem-solvers",
    number: 24,
    name: "Problem Solvers",
    category: "Challenges",
    skill: "Collaborating",
    prompt: "Agree on a solution and explain your team's reasoning.",
  },
  {
    id: "find-someone-who",
    number: 25,
    name: "Find Someone Who…",
    category: "Conversation",
    skill: "Connecting",
    prompt: "Move, mingle and discover something new about others.",
  },
] as const satisfies readonly Booth[]);

export const TOTAL_BOOTHS = BOOTHS.length;

/** The wider Find Your Voice campaign site. */
export const CAMPAIGN_HOMEPAGE = "https://kaplanfindyourvoice.netlify.app/";

const BOOTHS_BY_ID = new Map(BOOTHS.map((booth) => [booth.id, booth]));

export function getBooth(slug: string | null | undefined): Booth | null {
  if (!slug) return null;
  return BOOTHS_BY_ID.get(slug) ?? null;
}

/** Skills highlighted on the student "You are building" card. */
export const HEADLINE_SKILLS = [
  "Asking questions",
  "Responding",
  "Describing",
  "Persuading",
  "Storytelling",
  "Collaborating",
] as const;
