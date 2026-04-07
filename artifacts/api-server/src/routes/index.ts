import { Router, type IRouter } from "express";
import healthRouter from "./health";
import blogRouter from "./blog";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(blogRouter);
router.use(contactRouter);

export default router;
