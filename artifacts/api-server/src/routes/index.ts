import { Router, type IRouter } from "express";
import healthRouter from "./health";
import membersRouter from "./members";
import choresRouter from "./chores";
import checklistRouter from "./checklist";
import historyRouter from "./history";
import balancesRouter from "./balances";

const router: IRouter = Router();

router.use(healthRouter);
router.use(membersRouter);
router.use(choresRouter);
router.use(checklistRouter);
router.use(historyRouter);
router.use(balancesRouter);

export default router;
