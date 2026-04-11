import { z } from "zod";

export const LaptimeSchema = z.object({
  driverId: z.number().int(),
  driverName: z.string().min(1),
  sessionId: z.number().int(),
  lapNumber: z.number().int().min(0),
  lapTime: z.number().positive().nullable(),
});

export const LaptimeBatchSchema = z.object({
  competition: z.string().min(1),
  laptimes: z.array(LaptimeSchema).min(1),
});

export type Laptime = z.infer<typeof LaptimeSchema>;
export type LaptimeBatchRequest = z.infer<typeof LaptimeBatchSchema>;

export interface LaptimeRow {
  id: number;
  driver_id: number;
  driver_name: string;
  session_id: number;
  competition: string;
  lap_number: number;
  lap_time: number | null;
  created_at: string;
}

export interface StandingEntry {
  driverId: number;
  driverName: string;
  bestTime: number;
  lapCount: number;
  bestTimeAt: string;
}

export interface Env {
  DB: D1Database;
  API_KEY: string;
}
