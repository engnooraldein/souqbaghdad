import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sitemapRouter from "./sitemap";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sitemapRouter);
router.use(uploadRouter);

export default router;

