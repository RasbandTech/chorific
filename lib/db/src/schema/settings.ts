import { pgTable, serial, integer } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  charityPercent: integer("charity_percent").notNull().default(10),
  savingsPercent: integer("savings_percent").notNull().default(20),
  spendingPercent: integer("spending_percent").notNull().default(70),
});

export type Settings = typeof settingsTable.$inferSelect;
