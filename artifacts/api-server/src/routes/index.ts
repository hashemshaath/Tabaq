import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import categoriesRouter from "./categories";
import restaurantsRouter from "./restaurants";
import dishesRouter from "./dishes";
import menusRouter from "./menus";
import bookingsRouter from "./bookings";
import offersRouter from "./offers";
import reviewsRouter from "./reviews";
import usersRouter from "./users";
import searchRouter from "./search";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(countriesRouter);
router.use(categoriesRouter);
router.use(restaurantsRouter);
router.use(dishesRouter);
router.use(menusRouter);
router.use(bookingsRouter);
router.use(offersRouter);
router.use(reviewsRouter);
router.use(usersRouter);
router.use(searchRouter);
router.use(eventsRouter);

export default router;
