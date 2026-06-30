import express from "express";
import session from "express-session";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { router } from "./routes";
import { seedDemoData } from "./storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "aria-ecommerce-agent-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

// API routes
app.use("/api", router);

// Vite / static serving
const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, "public");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = Number(process.env.PORT ?? 5000);

server.listen(PORT, "0.0.0.0", async () => {
  console.log(`Aria e-commerce agent running on port ${PORT}`);
  try {
    await seedDemoData();
    console.log("Demo data ready");
  } catch (err) {
    console.error("Seed error (DB may not be connected):", err);
  }
});
