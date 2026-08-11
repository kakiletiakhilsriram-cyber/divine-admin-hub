import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_event",
  title: "Create temple event",
  description: "Create a new temple event. Requires an admin account.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Event title."),
    description: z.string().trim().optional().describe("Event description."),
    date: z.string().trim().optional().describe("Event date (ISO format, e.g. 2026-04-12)."),
    image_url: z.string().url().optional().describe("Optional image URL for the event."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, description, date, image_url }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("events")
      .insert({ title, description, date, image_url })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { event: data },
    };
  },
});
