export const TAGS = [
  // Interest tags
  { id: "life-meaning", name: "Life & meaning", category: "interest", color: "bg-amber-100 text-amber-800" },
  { id: "mental-wellbeing", name: "Mental well-being", category: "interest", color: "bg-emerald-100 text-emerald-800" },
  { id: "relationships", name: "Relationships & connection", category: "interest", color: "bg-pink-100 text-pink-800" },
  { id: "culture-identity", name: "Culture & identity", category: "interest", color: "bg-amber-100 text-amber-800" },
  { id: "spirituality", name: "Spirituality & faith", category: "interest", color: "bg-indigo-100 text-indigo-800" },
  { id: "books-stories", name: "Books & stories", category: "interest", color: "bg-rose-100 text-rose-800" },
  { id: "climate", name: "Climate & sustainability", category: "interest", color: "bg-green-100 text-green-800" },
  { id: "music-sound", name: "Music & sound", category: "interest", color: "bg-fuchsia-100 text-fuchsia-800" },
  { id: "art-creativity", name: "Art & creativity", category: "interest", color: "bg-rose-100 text-rose-800" },
  { id: "science-innovation", name: "Science & innovation", category: "interest", color: "bg-cyan-100 text-cyan-800" },
  { id: "tech-digital", name: "Tech & digital life", category: "interest", color: "bg-blue-100 text-blue-800" },
  {
    id: "social-impact",
    name: "Social impact & justice",
    category: "interest",
    color: "bg-purple-100 text-purple-800",
  },
  { id: "business", name: "Business & entrepreneurship", category: "interest", color: "bg-orange-100 text-orange-800" },
  { id: "learning", name: "Learning & education", category: "interest", color: "bg-teal-100 text-teal-800" },
  { id: "philosophy", name: "Philosophy & ideas", category: "interest", color: "bg-sky-100 text-sky-800" },
  { id: "parenting", name: "Parenting & caregiving", category: "interest", color: "bg-lime-100 text-lime-800" },
  { id: "love-heartbreak", name: "Love & heartbreak", category: "interest", color: "bg-red-100 text-red-800" },
  { id: "migration-home", name: "Migration & home", category: "interest", color: "bg-blue-100 text-blue-800" },
  { id: "food-traditions", name: "Food & traditions", category: "interest", color: "bg-yellow-100 text-yellow-800" },
  { id: "politics-society", name: "Politics & society", category: "interest", color: "bg-slate-100 text-slate-800" },

  // Context tags
  { id: "burnout", name: "Experiencing burnout", category: "context", color: "bg-red-100 text-red-800" },
  { id: "fresh-start", name: "Starting fresh", category: "context", color: "bg-emerald-100 text-emerald-800" },
  { id: "change", name: "Navigating change", category: "context", color: "bg-blue-100 text-blue-800" },
  { id: "new-place", name: "New to a place", category: "context", color: "bg-amber-100 text-amber-800" },
  { id: "loss", name: "Healing from loss", category: "context", color: "bg-purple-100 text-purple-800" },
  { id: "meaning", name: "Looking for meaning", category: "context", color: "bg-indigo-100 text-indigo-800" },
  { id: "overwhelmed", name: "Feeling overwhelmed", category: "context", color: "bg-pink-100 text-pink-800" },
  { id: "success", name: "Celebrating success", category: "context", color: "bg-green-100 text-green-800" },
  { id: "uncertainty", name: "Facing uncertainty", category: "context", color: "bg-orange-100 text-orange-800" },
  { id: "adulthood", name: "Entering adulthood", category: "context", color: "bg-cyan-100 text-cyan-800" },
  { id: "career", name: "Career crossroads", category: "context", color: "bg-teal-100 text-teal-800" },
  { id: "reinvention", name: "Reinventing my path", category: "context", color: "bg-violet-100 text-violet-800" },
  { id: "project", name: "Launching a project", category: "context", color: "bg-yellow-100 text-yellow-800" },
  { id: "belonging", name: "Seeking belonging", category: "context", color: "bg-lime-100 text-lime-800" },
  { id: "disconnected", name: "Feeling disconnected", category: "context", color: "bg-rose-100 text-rose-800" },

  // Intention tags
  {
    id: "meaningful-connections",
    name: "Make meaningful connections",
    category: "intention",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "share-story",
    name: "Share your story",
    category: "intention",
    color: "bg-amber-100 text-amber-800",
  },
  {
    id: "reflect-grow",
    name: "Reflect & grow",
    category: "intention",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    id: "navigate-change",
    name: "Navigate change",
    category: "intention",
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "celebrate-joy",
    name: "Celebrate joy",
    category: "intention",
    color: "bg-pink-100 text-pink-800",
  },
  {
    id: "find-support",
    name: "Find or offer support",
    category: "intention",
    color: "bg-red-100 text-red-800",
  },
  {
    id: "explore-ideas",
    name: "Explore big ideas",
    category: "intention",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "be-creative",
    name: "Be creative together",
    category: "intention",
    color: "bg-violet-100 text-violet-800",
  },
  {
    id: "learn",
    name: "Learn from each other",
    category: "intention",
    color: "bg-teal-100 text-teal-800",
  },
  {
    id: "uplift",
    name: "Uplift and be uplifted",
    category: "intention",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "shared-purpose",
    name: "Build shared purpose",
    category: "intention",
    color: "bg-cyan-100 text-cyan-800",
  },
  {
    id: "be-yourself",
    name: "Simply be yourself",
    category: "intention",
    color: "bg-green-100 text-green-800",
  },
] as const

export const getTagById = (id: string) => TAGS.find((tag) => tag.id === id)

export const getTagsByIds = (ids: string[]) => ids.map((id) => getTagById(id)).filter(Boolean)

export const GENDERS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "non-binary", label: "Non-binary" },
  { id: "other", label: "Other" },
  { id: "prefer-not-to-say", label: "Prefer not to say" },
]

export const GENDER_PREFERENCES = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "no-preference", label: "No preference" },
]

export const PROXIMITY_OPTIONS = [
  { id: "local", label: "Local (within 50km)" },
  { id: "metro", label: "Metro area" },
  { id: "countrywide", label: "Countrywide" },
  { id: "global", label: "Global" },
]
