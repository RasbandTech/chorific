import { Router } from "express";
import { db, choresTable, completionsTable, assignmentsTable, adhocPendingTable, settingsTable } from "@workspace/db";
import { eq, and, gte, lt } from "drizzle-orm";
import { todayRangeInTz } from "../utils/timezone";

const router = Router();

async function getTimezone(): Promise<string> {
  const rows = await db.select({ timezone: settingsTable.timezone }).from(settingsTable).where(eq(settingsTable.id, 1));
  return rows[0]?.timezone ?? "UTC";
}

router.get("/adhoc", async (_req, res) => {
  try {
    const timezone = await getTimezone();
    const { start, end } = todayRangeInTz(timezone);

    const adhocChores = await db
      .select()
      .from(choresTable)
      .where(eq(choresTable.frequency, "adhoc"));

    const allAssignments = await db.select().from(assignmentsTable);

    const choresWithMembers = adhocChores.map(chore => {
      const choreAssignments = allAssignments.filter(a => a.choreId === chore.id);
      return {
        id: chore.id,
        name: chore.name,
        icon: chore.icon,
        dollarValue: parseFloat(chore.dollarValue),
        frequency: chore.frequency,
        scheduledDays: null,
        timeOfDay: chore.timeOfDay ?? null,
        assignedMemberIds: choreAssignments.map(a => a.memberId),
        createdAt: chore.createdAt.toISOString(),
      };
    });

    const adhocChoreIds = adhocChores.map(c => c.id);

    const allPending = await db.select().from(adhocPendingTable);
    const todayPending = allPending
      .filter(p => p.assignedAt >= start && p.assignedAt < end)
      .map(p => {
        const chore = adhocChores.find(c => c.id === p.choreId);
        return {
          id: p.id,
          choreId: p.choreId,
          choreName: chore?.name ?? "",
          choreIcon: chore?.icon ?? "",
          dollarValue: chore ? parseFloat(chore.dollarValue) : 0,
          memberId: p.memberId,
          assignedAt: p.assignedAt.toISOString(),
        };
      });

    let todayCompletions: any[] = [];
    if (adhocChoreIds.length > 0) {
      const allTodayCompletions = await db
        .select()
        .from(completionsTable)
        .where(and(gte(completionsTable.completedAt, start), lt(completionsTable.completedAt, end)));

      todayCompletions = allTodayCompletions
        .filter(c => adhocChoreIds.includes(c.choreId))
        .map(c => {
          const chore = adhocChores.find(ch => ch.id === c.choreId);
          return {
            id: c.id,
            choreId: c.choreId,
            choreName: chore?.name ?? "",
            choreIcon: chore?.icon ?? "",
            dollarValue: parseFloat(c.amountEarned),
            memberId: c.memberId,
            completedAt: c.completedAt.toISOString(),
          };
        });
    }

    res.json({ chores: choresWithMembers, pending: todayPending, completions: todayCompletions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ad hoc data" });
  }
});

router.post("/adhoc/assign", async (req, res) => {
  try {
    const { choreId, memberId } = req.body as { choreId: number; memberId: number };

    const [pending] = await db
      .insert(adhocPendingTable)
      .values({ choreId, memberId })
      .returning();

    const chore = await db
      .select()
      .from(choresTable)
      .where(eq(choresTable.id, choreId))
      .then(rows => rows[0]);

    res.status(201).json({
      id: pending.id,
      choreId: pending.choreId,
      choreName: chore?.name ?? "",
      choreIcon: chore?.icon ?? "",
      dollarValue: chore ? parseFloat(chore.dollarValue) : 0,
      memberId: pending.memberId,
      assignedAt: pending.assignedAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to assign ad hoc chore" });
  }
});

router.post("/adhoc/complete/:pendingId", async (req, res) => {
  try {
    const pendingId = parseInt(req.params.pendingId, 10);

    const pendingRows = await db
      .select()
      .from(adhocPendingTable)
      .where(eq(adhocPendingTable.id, pendingId));

    if (pendingRows.length === 0) {
      return res.status(404).json({ error: "Pending assignment not found" });
    }

    const pending = pendingRows[0];

    const chore = await db
      .select()
      .from(choresTable)
      .where(eq(choresTable.id, pending.choreId))
      .then(rows => rows[0]);

    if (!chore) {
      return res.status(404).json({ error: "Chore not found" });
    }

    const [completion] = await db
      .insert(completionsTable)
      .values({
        choreId: pending.choreId,
        memberId: pending.memberId,
        amountEarned: chore.dollarValue,
      })
      .returning();

    await db
      .delete(adhocPendingTable)
      .where(eq(adhocPendingTable.id, pendingId));

    res.status(201).json({
      id: completion.id,
      choreId: completion.choreId,
      choreName: chore.name,
      choreIcon: chore.icon,
      dollarValue: parseFloat(completion.amountEarned),
      memberId: completion.memberId,
      completedAt: completion.completedAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete ad hoc chore" });
  }
});

router.delete("/adhoc/pending/:pendingId", async (req, res) => {
  try {
    const pendingId = parseInt(req.params.pendingId, 10);
    await db.delete(adhocPendingTable).where(eq(adhocPendingTable.id, pendingId));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to remove pending assignment" });
  }
});

export default router;
