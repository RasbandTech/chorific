import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { membersTable } from "./members";

export const payoutsTable = pgTable("payouts", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => membersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at").notNull().defaultNow(),
});

export type Payout = typeof payoutsTable.$inferSelect;
