import { pgTable, serial, integer, unique } from "drizzle-orm/pg-core";
import { membersTable } from "./members";
import { choresTable } from "./chores";

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),
  choreId: integer("chore_id").notNull().references(() => choresTable.id, { onDelete: "cascade" }),
  memberId: integer("member_id").notNull().references(() => membersTable.id, { onDelete: "cascade" }),
}, (t) => [
  unique().on(t.choreId, t.memberId),
]);

export type Assignment = typeof assignmentsTable.$inferSelect;
