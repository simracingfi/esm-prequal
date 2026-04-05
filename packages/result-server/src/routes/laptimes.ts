import { Hono } from "hono";
import type { Env } from "../types";
import { LaptimeBatchSchema } from "../types";
import { insertLaptimes, getLaptimes } from "../db";

const app = new Hono<{ Bindings: Env }>();

app.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = LaptimeBatchSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }

  const { competition, laptimes } = parsed.data;
  const inserted = await insertLaptimes(c.env.DB, competition, laptimes);

  return c.json({ inserted }, 201);
});

app.get("/", async (c) => {
  const competition = c.req.query("competition");
  if (!competition) {
    return c.json({ error: "competition query parameter is required" }, 400);
  }

  const laptimes = await getLaptimes(c.env.DB, competition);
  return c.json({ laptimes });
});

export default app;
