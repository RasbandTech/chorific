import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULTS = { charityPercent: 10, savingsPercent: 20, spendingPercent: 70 };

async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, 1));
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(settingsTable).values({ id: 1, ...DEFAULTS }).returning();
  return created;
}

router.get("/settings", async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      charityPercent: settings.charityPercent,
      savingsPercent: settings.savingsPercent,
      spendingPercent: settings.spendingPercent,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const { charityPercent, savingsPercent, spendingPercent } = req.body;
    if (
      typeof charityPercent !== "number" ||
      typeof savingsPercent !== "number" ||
      typeof spendingPercent !== "number"
    ) {
      return res.status(400).json({ error: "charityPercent, savingsPercent, and spendingPercent are required numbers" });
    }
    if (charityPercent + savingsPercent + spendingPercent !== 100) {
      return res.status(400).json({ error: "Percentages must add up to 100" });
    }
    if ([charityPercent, savingsPercent, spendingPercent].some(p => p < 0 || p > 100)) {
      return res.status(400).json({ error: "Each percentage must be between 0 and 100" });
    }

    await getOrCreateSettings();
    const [updated] = await db
      .update(settingsTable)
      .set({ charityPercent, savingsPercent, spendingPercent })
      .where(eq(settingsTable.id, 1))
      .returning();

    res.json({
      charityPercent: updated.charityPercent,
      savingsPercent: updated.savingsPercent,
      spendingPercent: updated.spendingPercent,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
