import { Router } from "express";
import { db, membersTable, choresTable, assignmentsTable, completionsTable } from "@workspace/db";
import { eq, and, gte, lt } from "drizzle-orm";

const router = Router();

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

router.get("/checklist", async (req, res) => {
  try {
    const { start, end } = todayRange();
    const members = await db.select().from(membersTable).orderBy(membersTable.createdAt);
    const chores = await db.select().from(choresTable);
    const allAssignments = await db.select().from(assignmentsTable);
    const todayCompletions = await db.select().from(completionsTable)
      .where(and(gte(completionsTable.completedAt, start), lt(completionsTable.completedAt, end)));

    const result = members.map(member => {
      const memberAssignments = allAssignments.filter(a => a.memberId === member.id);
      const assignedChores = chores.filter(c => memberAssignments.some(a => a.choreId === c.id));
      const allChoresAssignments = allAssignments;
      const choreItems = assignedChores.map(chore => {
        const completion = todayCompletions.find(
          c => c.choreId === chore.id && c.memberId === member.id
        );
        const choreAssignments = allChoresAssignments.filter(a => a.choreId === chore.id);
        return {
          chore: {
            id: chore.id,
            name: chore.name,
            icon: chore.icon,
            dollarValue: parseFloat(chore.dollarValue),
            frequency: chore.frequency,
            assignedMemberIds: choreAssignments.map(a => a.memberId),
            createdAt: chore.createdAt.toISOString(),
          },
          completionId: completion ? completion.id : null,
          completedAt: completion ? completion.completedAt.toISOString() : null,
        };
      });
      return {
        member: {
          id: member.id,
          name: member.name,
          avatarColor: member.avatarColor,
          createdAt: member.createdAt.toISOString(),
        },
        chores: choreItems,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch checklist" });
  }
});

router.post("/completions", async (req, res) => {
  try {
    const { choreId, memberId } = req.body;
    const chore = await db.select().from(choresTable).where(eq(choresTable.id, choreId)).then(r => r[0]);
    if (!chore) return res.status(404).json({ error: "Chore not found" });
    const [completion] = await db.insert(completionsTable).values({
      choreId,
      memberId,
      amountEarned: chore.dollarValue,
    }).returning();
    res.status(201).json({
      id: completion.id,
      choreId: completion.choreId,
      memberId: completion.memberId,
      amountEarned: parseFloat(completion.amountEarned),
      completedAt: completion.completedAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to record completion" });
  }
});

router.delete("/completions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(completionsTable).where(eq(completionsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to remove completion" });
  }
});

export default router;
