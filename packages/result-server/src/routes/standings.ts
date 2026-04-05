import { Hono } from "hono";
import type { Env } from "../types";
import { getStandings } from "../db";

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const competition = c.req.query("competition");
  if (!competition) {
    return c.json({ error: "competition query parameter is required" }, 400);
  }

  const standings = await getStandings(c.env.DB, competition);
  return c.json({ standings });
});

export default app;
