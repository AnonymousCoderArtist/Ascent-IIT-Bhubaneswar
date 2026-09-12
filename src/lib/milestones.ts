// Milestone asset maps — mirrors agents/SHARED_CONTRACT.md §8.
// Falls back to the latest available asset when higher tiers aren't generated yet.

const CHARACTER_ASSETS: Record<number, string> = {
  1: "/character/character-l1.png",
  2: "/character/character-l2.png",
  7: "/character/character-l7.png",
  10: "/character/character-l10.png",
  15: "/character/character-l15.png",
  20: "/character/character-l20.png",
  30: "/character/character-l30.png",
};

const WORLD_ASSETS: Record<number, string> = {
  1: "/world/world-l1.webp",
  5: "/world/world-l5.webp",
  10: "/world/world-l10.webp",
  15: "/world/world-l15.webp",
  20: "/world/world-l20.webp",
  30: "/world/world-l30.webp",
};

function assetForLevel(assets: Record<number, string>, level: number): string {
  const milestones = Object.keys(assets)
    .map(Number)
    .sort((a, b) => a - b);
  let current = assets[1];
  for (const m of milestones) {
    if (level >= m) current = assets[m];
  }
  return current;
}

export function characterAssetForLevel(level: number): string {
  return assetForLevel(CHARACTER_ASSETS, level);
}

export function worldAssetForLevel(level: number): string {
  return assetForLevel(WORLD_ASSETS, level);
}

export const CHARACTER_MILESTONES = CHARACTER_ASSETS;
export const WORLD_MILESTONES = WORLD_ASSETS;

export const CHARACTER_MILESTONE_LEVELS = [2, 7, 10, 15, 20, 30];
export const WORLD_MILESTONE_LEVELS = [5, 10, 15, 20, 30];

export const WORLD_MILESTONE_LABELS: Record<number, { key: string; title: string; blurb: string }> = {
  5: { key: "restored_structure", title: "Restored Outpost", blurb: "The first structure rises from the ruins." },
  10: { key: "training_ground", title: "Training Ground", blurb: "A courtyard for deliberate practice." },
  15: { key: "library", title: "Knowledge Library", blurb: "A district of luminous archives." },
  20: { key: "forge", title: "Forge District", blurb: "Workshops that shape your world." },
  30: { key: "central_tower", title: "Central Tower", blurb: "The tower awakens. You built this." },
};
