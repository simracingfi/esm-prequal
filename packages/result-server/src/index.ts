import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import laptimesRoutes from "./routes/laptimes";
import competitionsRoutes from "./routes/competitions";
import standingsRoutes from "./routes/standings";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// API key auth middleware for POST routes
app.use("/api/laptimes", async (c, next) => {
  if (c.req.method === "POST") {
    const apiKey = c.req.header("X-API-Key");
    if (!apiKey || apiKey !== c.env.API_KEY) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
  await next();
});

app.route("/api/laptimes", laptimesRoutes);
app.route("/api/competitions", competitionsRoutes);
app.route("/api/standings", standingsRoutes);

app.get("/", (c) => {
  return c.json({ name: "eSM Prequal Result Server", status: "ok" });
});

export default app;
