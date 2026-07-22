import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({});

export default {
  ...config,
  // Force webpack build because OpenNext's file tracing is more stable with Webpack
  // than Turbopack in some edge cases with chunk loading on Cloudflare
  buildCommand: "next build --webpack",
};
