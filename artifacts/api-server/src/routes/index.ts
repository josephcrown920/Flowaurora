import { Router, type IRouter } from "express";
import healthRouter from "./health";
import charactersRouter from "./characters";
import projectsRouter from "./projects";
import shotsRouter from "./shots";
import directorRouter from "./director";
import generateRouter from "./generate";
import modelarkRouter from "./modelark";
import modelsRouter from "./models";

const router: IRouter = Router();

router.use(healthRouter);
router.use(charactersRouter);
router.use(projectsRouter);
router.use(shotsRouter);
router.use(directorRouter);
router.use(generateRouter);
router.use(modelarkRouter);
router.use(modelsRouter);

export default router;
