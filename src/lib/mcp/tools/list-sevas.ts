import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_sevas",
  title: "List sevas",
  description: "List the temple's sevas (rituals/services) with descriptions and media links.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of sevas to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("sevas")
      .select("id, title, subtitle, description, date, image_url, drive_link, media_links, created_at")
      .order("date", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { sevas: data ?? [] },
    };
  },
});
