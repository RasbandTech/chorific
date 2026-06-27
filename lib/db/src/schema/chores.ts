import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const choresTable = pgTable("chores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("Star"),
  dollarValue: numeric("dollar_value", { precision: 10, scale: 2 }).notNull().default("0.25"),
  frequency: text("frequency").notNull().default("daily"),
  scheduledDays: text("scheduled_days"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChoreSchema = createInsertSchema(choresTable).omit({ id: true, createdAt: true });
export type InsertChore = z.infer<typeof insertChoreSchema>;
export type Chore = typeof choresTable.$inferSelect;
