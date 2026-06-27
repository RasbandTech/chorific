import { Router } from "express";
import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/members", async (req, res) => {
  try {
    const members = await db.select().from(membersTable).orderBy(membersTable.createdAt);
    res.json(members.map(m => ({
      id: m.id,
      name: m.name,
      avatarColor: m.avatarColor,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

router.post("/members", async (req, res) => {
  try {
    const { name, avatarColor = "#6366f1" } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }
    const [member] = await db.insert(membersTable).values({ name: name.trim(), avatarColor }).returning();
    res.status(201).json({
      id: member.id,
      name: member.name,
      avatarColor: member.avatarColor,
      createdAt: member.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create member" });
  }
});

router.patch("/members/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, avatarColor } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (avatarColor !== undefined) updates.avatarColor = avatarColor;
    const [member] = await db.update(membersTable).set(updates).where(eq(membersTable.id, id)).returning();
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json({
      id: member.id,
      name: member.name,
      avatarColor: member.avatarColor,
      createdAt: member.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update member" });
  }
});

router.delete("/members/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(membersTable).where(eq(membersTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete member" });
  }
});

export default router;
