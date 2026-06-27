import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { membersTable } from "./members";
import { choresTable } from "./chores";

export const completionsTable = pgTable("completions", {
  id: serial("id").primaryKey(),
  choreId: integer("chore_id").notNull().references(() => choresTable.id, { onDelete: "cascade" }),
  memberId: integer("member_id").notNull().references(() => membersTable.id, { onDelete: "cascade" }),
  amountEarned: numeric("amount_earned", { precision: 10, scale: 2 }).notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export type Completion = typeof completionsTable.$inferSelect;
