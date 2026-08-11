import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEvents from "./tools/list-events";
import createEvent from "./tools/create-event";
import listSevas from "./tools/list-sevas";
import createSeva from "./tools/create-seva";
import listGallery from "./tools/list-gallery";
import listMessages from "./tools/list-messages";
import markMessageRead from "./tools/mark-message-read";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "divine-admin-hub",
  title: "Divine Admin Hub",
  version: "0.1.0",
  instructions:
    "Tools for the Sri Ramalayam temple admin hub. Read and create events and sevas, browse gallery media, and review contact messages. Actions run as the signed-in temple account.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listEvents, createEvent, listSevas, createSeva, listGallery, listMessages, markMessageRead],
});
