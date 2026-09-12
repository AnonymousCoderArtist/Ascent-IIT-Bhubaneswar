// complete-quest Edge Function
// Thin wrapper over SQL RPC complete_quest(task_id).
// The server-authoritative logic lives entirely in the SQL function.
// This function just authenticates the request and forwards the call.

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
      JSON.stringify({
        error: "AUTH_REQUIRED",
        message: "Authentication required",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { taskId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "INVALID_TASK", message: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const taskId = body?.taskId;
  if (!taskId || typeof taskId !== "string") {
    return new Response(
      JSON.stringify({ error: "INVALID_TASK", message: "taskId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({
          error: "REWARD_TRANSACTION_FAILED",
          message: "Backend not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/complete-quest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ task_id: taskId }),
    });

    const data = await res.json();

    if (!res.ok) {
      const error = data[0] ?? { message: "Unknown error" };
      const code = error.code ?? "REWARD_TRANSACTION_FAILED";
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data[0] ?? { success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("complete-quest error:", err);
    return new Response(
      JSON.stringify({
        error: "REWARD_TRANSACTION_FAILED",
        message: "Transaction failed, please retry",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
