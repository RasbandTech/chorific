import { Router } from "express";
import { db, choresTable, assignmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function parseScheduledDays(raw: string | null | undefined): number[] | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function formatChore(chore: typeof choresTable.$inferSelect, assignments: { memberId: number }[]) {
  return {
    id: chore.id,
    name: chore.name,
    icon: chore.icon,
    dollarValue: parseFloat(chore.dollarValue),
    frequency: chore.frequency,
    scheduledDays: parseScheduledDays(chore.scheduledDays),
    timeOfDay: chore.timeOfDay ?? null,
    assignedMemberIds: assignments.map(a => a.memberId),
    createdAt: chore.createdAt.toISOString(),
  };
}

router.get("/chores", async (req, res) => {
  try {
    const chores = await db.select().from(choresTable).orderBy(choresTable.createdAt);
    const allAssignments = await db.select().from(assignmentsTable);
    const result = chores.map(chore =>
      formatChore(chore, allAssignments.filter(a => a.choreId === chore.id))
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chores" });
  }
});

router.post("/chores", async (req, res) => {
  try {
    const { name, icon = "Star", dollarValue = 0.25, frequency = "daily", scheduledDays, timeOfDay } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }
    const [chore] = await db.insert(choresTable).values({
      name: name.trim(),
      icon,
      dollarValue: String(dollarValue),
      frequency,
      scheduledDays: scheduledDays ? JSON.stringify(scheduledDays) : null,
      timeOfDay: timeOfDay ?? null,
    }).returning();
    res.status(201).json(formatChore(chore, []));
  } catch (err) {
    res.status(500).json({ error: "Failed to create chore" });
  }
});

router.patch("/chores/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, icon, dollarValue, frequency, scheduledDays, timeOfDay } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (icon !== undefined) updates.icon = icon;
    if (dollarValue !== undefined) updates.dollarValue = String(dollarValue);
    if (frequency !== undefined) updates.frequency = frequency;
    if (scheduledDays !== undefined) updates.scheduledDays = scheduledDays ? JSON.stringify(scheduledDays) : null;
    if (timeOfDay !== undefined) updates.timeOfDay = timeOfDay ?? null;
    const [chore] = await db.update(choresTable).set(updates).where(eq(choresTable.id, id)).returning();
    if (!chore) return res.status(404).json({ error: "Chore not found" });
    const assignments = await db.select().from(assignmentsTable).where(eq(assignmentsTable.choreId, id));
    res.json(formatChore(chore, assignments));
  } catch (err) {
    res.status(500).json({ error: "Failed to update chore" });
  }
});

router.delete("/chores/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(choresTable).where(eq(choresTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete chore" });
  }
});

router.post("/chores/:id/assign", async (req, res) => {
  try {
    const choreId = parseInt(req.params.id, 10);
    const { memberId } = req.body;
    const [assignment] = await db.insert(assignmentsTable).values({ choreId, memberId }).returning();
    res.status(201).json({ id: assignment.id, choreId: assignment.choreId, memberId: assignment.memberId });
  } catch (err: any) {
    if (err?.code === "23505") return res.status(409).json({ error: "Already assigned" });
    res.status(500).json({ error: "Failed to assign chore" });
  }
});

router.delete("/chores/:id/assign/:memberId", async (req, res) => {
  try {
    const choreId = parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.memberId, 10);
    await db.delete(assignmentsTable)
      .where(eq(assignmentsTable.choreId, choreId))
      .where(eq(assignmentsTable.memberId, memberId));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to unassign chore" });
  }
});

export default router;
