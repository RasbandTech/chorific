import { Router } from "express";
import { db, choresTable, completionsTable, assignmentsTable } from "@workspace/db";
import { eq, and, gte, lt } from "drizzle-orm";

const router = Router();

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

router.get("/adhoc", async (_req, res) => {
  try {
    const { start, end } = todayRange();

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

    res.json({ chores: choresWithMembers, completions: todayCompletions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ad hoc data" });
  }
});

export default router;
