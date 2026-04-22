import { Hono } from "hono";
import type { Env } from "../types";
import { getDrivers } from "../db";

const app = new Hono<{ Bindings: Env }>();

app.get("/", async (c) => {
  const drivers = await getDrivers(c.env.DB);
  return c.json({ drivers });
});

export default app;
