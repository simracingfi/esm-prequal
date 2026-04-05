import { Hono } from "hono";
import type { Env } from "../types";
import { getCompetitions } from "../db";

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const competitions = await getCompetitions(c.env.DB);
  return c.json({ competitions });
});

export default app;
