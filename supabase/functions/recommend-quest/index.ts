// recommend-quest Edge Function
// Returns a deterministic quest recommendation based on user stats.
// In production, this would call Gemini API for personalized suggestions.
// Falls back to deterministic template based on weakest stat.

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "AUTH_REQUIRED", message: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { goalPreferences, level, stats } = body as {
      goalPreferences?: string[];
      level?: number;
      stats?: Record<string, number>;
    };

    if (!stats) {
      return new Response(
        JSON.stringify({ error: "INVALID_TASK", message: "stats required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Deterministic fallback: weakest stat drives recommendation
    const statOrder = ["STR", "INT", "DISC", "VIT", "CRE"] as const;
    let weakest: string = "STR";
    let weakestVal = Infinity;

    for (const stat of statOrder) {
      const val = stats[stat] ?? 0;
      if (val < weakestVal) {
        weakestVal = val;
        weakest = stat;
      }
    }

    const titles: Record<string, string> = {
      STR: "20 minute walk",
      INT: "Read 10 pages",
      DISC: "Clean your workspace for 10 minutes",
      VIT: "Drink water and stretch for 10 minutes",
      CRE: "Sketch for 15 minutes",
    };

    const result = {
      title: titles[weakest] ?? "Take a 15 minute walk",
      category: weakest,
      difficulty: "easy" as const,
      estimatedMinutes: 15,
      reason: `Your ${weakest.toLowerCase()} progression is trailing your other attributes.`,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("recommend-quest error:", err);
    return new Response(
      JSON.stringify({ error: "AI_UNAVAILABLE", message: "Recommendation unavailable" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
