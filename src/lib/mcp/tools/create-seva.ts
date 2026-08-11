import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_seva",
  title: "Create seva",
  description: "Create a new seva entry for the temple. Requires an admin account.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Seva title."),
    subtitle: z.string().trim().optional().describe("Short subtitle."),
    description: z.string().trim().optional().describe("Seva description."),
    date: z.string().trim().optional().describe("Seva date (ISO format)."),
    image_url: z.string().url().optional().describe("Optional image URL."),
    drive_link: z.string().url().optional().describe("Optional media drive link."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("sevas").insert(input).select().single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { seva: data },
    };
  },
});
