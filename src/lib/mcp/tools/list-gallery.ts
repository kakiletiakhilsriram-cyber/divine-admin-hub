import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_gallery",
  title: "List gallery media",
  description: "List photos and videos in the temple gallery, optionally filtered by category.",
  inputSchema: {
    category: z.string().trim().optional().describe("Filter by gallery category."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of items to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("gallery")
      .select("id, title, category, media_type, media_url, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { items: data ?? [] },
    };
  },
});
