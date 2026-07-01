import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { membersTable } from "./members";
import { choresTable } from "./chores";

export const adhocPendingTable = pgTable("adhoc_pending", {
  id: serial("id").primaryKey(),
  choreId: integer("chore_id").notNull().references(() => choresTable.id, { onDelete: "cascade" }),
  memberId: integer("member_id").notNull().references(() => membersTable.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export type AdhocPending = typeof adhocPendingTable.$inferSelect;
