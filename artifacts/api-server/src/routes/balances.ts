import { Router } from "express";
import { db, membersTable, completionsTable, payoutsTable } from "@workspace/db";
import { eq, sum, count, gte, desc } from "drizzle-orm";

const router = Router();

router.get("/balances", async (req, res) => {
  try {
    const members = await db.select().from(membersTable).orderBy(membersTable.createdAt);

    const earnedRows = await db.select({
      memberId: completionsTable.memberId,
      totalEarned: sum(completionsTable.amountEarned),
    }).from(completionsTable).groupBy(completionsTable.memberId);

    const paidRows = await db.select({
      memberId: payoutsTable.memberId,
      totalPaid: sum(payoutsTable.amount),
    }).from(payoutsTable).groupBy(payoutsTable.memberId);

    const result = members.map(member => {
      const earned = earnedRows.find(r => r.memberId === member.id);
      const paid = paidRows.find(r => r.memberId === member.id);
      const totalEarned = parseFloat(earned?.totalEarned ?? "0");
      const totalPaidOut = parseFloat(paid?.totalPaid ?? "0");
      return {
        member: {
          id: member.id,
          name: member.name,
          avatarColor: member.avatarColor,
          createdAt: member.createdAt.toISOString(),
        },
        balance: Math.max(0, totalEarned - totalPaidOut),
        totalEarned,
        totalPaidOut,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch balances" });
  }
});

router.get("/payouts", async (req, res) => {
  try {
    const payouts = await db.select({
      id: payoutsTable.id,
      memberId: payoutsTable.memberId,
      memberName: membersTable.name,
      amount: payoutsTable.amount,
      paidAt: payoutsTable.paidAt,
    })
      .from(payoutsTable)
      .innerJoin(membersTable, eq(payoutsTable.memberId, membersTable.id))
      .orderBy(desc(payoutsTable.paidAt));

    res.json(payouts.map(p => ({
      id: p.id,
      memberId: p.memberId,
      memberName: p.memberName,
      amount: parseFloat(p.amount),
      paidAt: p.paidAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payouts" });
  }
});

router.post("/payouts", async (req, res) => {
  try {
    const { memberId, amount } = req.body;
    if (!memberId || amount === undefined || amount < 0) {
      return res.status(400).json({ error: "memberId and amount are required" });
    }
    const member = await db.select().from(membersTable).where(eq(membersTable.id, memberId)).then(r => r[0]);
    if (!member) return res.status(404).json({ error: "Member not found" });
    const [payout] = await db.insert(payoutsTable).values({
      memberId,
      amount: String(amount),
    }).returning();
    res.status(201).json({
      id: payout.id,
      memberId: payout.memberId,
      memberName: member.name,
      amount: parseFloat(payout.amount),
      paidAt: payout.paidAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to record payout" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const allEarned = await db.select({ total: sum(completionsTable.amountEarned) }).from(completionsTable);
    const totalEarnedAllTime = parseFloat(allEarned[0]?.total ?? "0");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const todayCount = await db.select({ total: count() })
      .from(completionsTable)
      .where(gte(completionsTable.completedAt, todayStart));
    const totalChoresCompletedToday = todayCount[0]?.total ?? 0;

    const weekCount = await db.select({ total: count() })
      .from(completionsTable)
      .where(gte(completionsTable.completedAt, weekStart));
    const totalChoresCompletedThisWeek = weekCount[0]?.total ?? 0;

    const members = await db.select().from(membersTable);
    const earnedRows = await db.select({
      memberId: completionsTable.memberId,
      totalEarned: sum(completionsTable.amountEarned),
    }).from(completionsTable).groupBy(completionsTable.memberId);
    const paidRows = await db.select({
      memberId: payoutsTable.memberId,
      totalPaid: sum(payoutsTable.amount),
    }).from(payoutsTable).groupBy(payoutsTable.memberId);

    let topEarnerName: string | null = null;
    let topEarnerBalance: number | null = null;
    let totalOutstandingBalance = 0;

    for (const member of members) {
      const earned = parseFloat(earnedRows.find(r => r.memberId === member.id)?.totalEarned ?? "0");
      const paid = parseFloat(paidRows.find(r => r.memberId === member.id)?.totalPaid ?? "0");
      const balance = Math.max(0, earned - paid);
      totalOutstandingBalance += balance;
      if (topEarnerBalance === null || balance > topEarnerBalance) {
        topEarnerBalance = balance;
        topEarnerName = member.name;
      }
    }

    res.json({
      totalEarnedAllTime,
      totalChoresCompletedToday,
      totalChoresCompletedThisWeek,
      topEarnerName,
      topEarnerBalance,
      totalOutstandingBalance,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

export default router;
