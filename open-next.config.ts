import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Next.js 16 uses Turbopack by default for builds.
  // Explicitly declare the build command so OpenNext activates its
  // Turbopack-compatible patch plugin (handles [root-of-the-server]__*.js chunks).
  buildCommand: "next build --turbopack",
});
