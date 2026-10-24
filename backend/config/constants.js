// keep in sync with frontend/src/config/themes.js
const CHAT_THEMES = [
  "default",
  "sunset",
  "ocean",
  "forest",
  "candy",
  "galaxy",
  "lemonade",
  "midnight",
];

const COMMUNITY_CATEGORIES = [
  "Hangout",
  "Study",
  "Tech",
  "Gaming",
  "Music",
  "Movies & TV",
  "Sports",
  "Travel",
  "Art",
  "Food",
];

// created at server start if missing; new users only auto-join "General"
const DEFAULT_COMMUNITIES = [
  { chatName: "General", emoji: "👋", category: "Hangout", description: "Say hi to everyone on Babble" },
  { chatName: "Coding Help", emoji: "💻", category: "Tech", description: "Stuck on a bug? Ask here" },
  { chatName: "Random", emoji: "🎲", category: "Hangout", description: "Anything goes (keep it kind)" },
  { chatName: "Study Buddies", emoji: "📚", category: "Study", description: "Find people to study with, share notes" },
  { chatName: "Gamers Lounge", emoji: "🎮", category: "Gaming", description: "What are you playing this week?" },
  { chatName: "Music Corner", emoji: "🎧", category: "Music", description: "Share songs, playlists and concerts" },
  { chatName: "Movie Night", emoji: "🍿", category: "Movies & TV", description: "Recommendations, reviews, no spoilers" },
  { chatName: "Foodies", emoji: "🍜", category: "Food", description: "Recipes, cravings and food pics" },
  { chatName: "Wanderlust", emoji: "✈️", category: "Travel", description: "Travel stories and tips from around the world" },
  { chatName: "Art & Doodles", emoji: "🎨", category: "Art", description: "Show off your art, get feedback" },
];

// Cloudinary account that chat media must come from
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dbkqtoa4t";

module.exports = {
  CHAT_THEMES,
  COMMUNITY_CATEGORIES,
  DEFAULT_COMMUNITIES,
  CLOUDINARY_CLOUD_NAME,
};
