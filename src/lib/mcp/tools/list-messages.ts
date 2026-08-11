import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_messages",
  title: "List contact messages",
  description: "List contact-form messages sent to the temple. Requires an admin account.",
  inputSchema: {
    unread_only: z.boolean().default(false).describe("Return only unread messages."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of messages to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ unread_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("messages")
      .select("id, name, email, phone, subject, message, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (unread_only) query = query.eq("is_read", false);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { messages: data ?? [] },
    };
  },
});
