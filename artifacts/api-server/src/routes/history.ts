import { Router } from "express";
import { db, completionsTable, choresTable, membersTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";

const router = Router();

router.get("/history", async (req, res) => {
  try {
    const memberIdRaw = req.query.memberId;
    const limit = parseInt(String(req.query.limit || "50"), 10);
    const offset = parseInt(String(req.query.offset || "0"), 10);

    const memberId = memberIdRaw ? parseInt(String(memberIdRaw), 10) : null;

    const completions = await db.select({
      id: completionsTable.id,
      choreId: completionsTable.choreId,
      choreName: choresTable.name,
      choreIcon: choresTable.icon,
      memberId: completionsTable.memberId,
      memberName: membersTable.name,
      memberAvatarColor: membersTable.avatarColor,
      amountEarned: completionsTable.amountEarned,
      completedAt: completionsTable.completedAt,
    })
      .from(completionsTable)
      .innerJoin(choresTable, eq(completionsTable.choreId, choresTable.id))
      .innerJoin(membersTable, eq(completionsTable.memberId, membersTable.id))
      .where(memberId ? eq(completionsTable.memberId, memberId) : undefined)
      .orderBy(desc(completionsTable.completedAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db.select({ total: count() })
      .from(completionsTable)
      .where(memberId ? eq(completionsTable.memberId, memberId) : undefined);

    const total = totalResult[0]?.total ?? 0;

    res.json({
      entries: completions.map(c => ({
        id: c.id,
        choreId: c.choreId,
        choreName: c.choreName,
        choreIcon: c.choreIcon,
        memberId: c.memberId,
        memberName: c.memberName,
        memberAvatarColor: c.memberAvatarColor,
        amountEarned: parseFloat(c.amountEarned),
        completedAt: c.completedAt.toISOString(),
      })),
      total,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
