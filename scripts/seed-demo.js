-- Seed script for demo testing (run in browser console on http://localhost:5173/auth)
-- After running this, sign in with the credentials below

const DEMO_EMAIL = "demo@ascent.dev";
const DEMO_PASSWORD = "demo123";

// Check if demo account exists, create if not
function seedDemo() {
  const users = JSON.parse(localStorage.getItem("ascent:users") || "{}");
  if (users[DEMO_EMAIL]) {
    console.log("[DEMO] Account already exists");
    return;
  }

  // Hash password (same algorithm as localBackend)
  let hash = 0;
  for (let i = 0; i < DEMO_PASSWORD.length; i++) {
    const c = DEMO_PASSWORD.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash |= 0;
  }
  const passwordHash = "h_" + Math.abs(hash).toString(36);

  // Create demo user with XP just below level 2 (168 XP needed)
  // One easy quest (25 XP) will level them up
  const userId = "demo_" + Date.now();
  users[DEMO_EMAIL] = { email: DEMO_EMAIL, passwordHash, id: userId };
  localStorage.setItem("ascent:users", JSON.stringify(users));

  // Create profile at level 1, XP 143 (just below 168 for level 2)
  const profiles = {};
  profiles[userId] = {
    id: userId,
    displayName: "Demo Player",
    level: 1,
    totalXp: 143,
    essence: 50,
    currentStreak: 3,
    longestStreak: 5,
    lastActivityDate: "2026-09-12",
    rank: "E",
    str: 5, int: 12, disc: 8, vit: 7, cre: 9,
  };
  localStorage.setItem("ascent:profile", JSON.stringify(profiles));

  // Add starter inventory
  localStorage.setItem("ascent:inventory", JSON.stringify([
    { id: "inv1", itemKey: "starter_aura", itemType: "aura", acquiredAt: new Date().toISOString(), equipped: true },
    { id: "inv2", itemKey: "starter_outfit", itemType: "outfit", acquiredAt: new Date().toISOString(), equipped: false },
  ]));

  // Add an incomplete task
  const tasks = {};
  tasks["task_demo1"] = {
    id: "task_demo1",
    userId,
    title: "AWAKENING QUEST",
    description: "Drink a glass of water and take a 5-minute walk.",
    category: "VIT",
    difficulty: "easy",
    estimatedMinutes: 5,
    dueDate: null,
    recurrence: "none",
    completed: false,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem("ascent:tasks", JSON.stringify(tasks));

  console.log("[DEMO] Account seeded. Email:", DEMO_EMAIL, "Password:", DEMO_PASSWORD);
}

seedDemo();
