import { build } from "vite";
import { build as esbuild } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Build client
await build({ root, logLevel: "info" });

// Build server
await esbuild({
  entryPoints: [path.join(root, "server/index.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: path.join(root, "dist/index.cjs"),
  external: ["pg-native"],
  alias: {
    "@shared": path.join(root, "shared"),
  },
  define: {
    "import.meta.dirname": "__dirname",
  },
});

console.log("Build complete");
