import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import countriesRouter from "./countries.js";
import categoriesRouter from "./categories.js";
import restaurantsRouter from "./restaurants.js";
import dishesRouter from "./dishes.js";
import menusRouter from "./menus.js";
import bookingsRouter from "./bookings.js";
import offersRouter from "./offers.js";
import reviewsRouter from "./reviews.js";
import usersRouter from "./users.js";
import searchRouter from "./search.js";
import eventsRouter from "./events.js";
import referralsRouter from "./referrals.js";
import usernameRouter from "./username.js";
import adminStatsRouter from "./admin-stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
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
router.use(referralsRouter);
router.use(usernameRouter);
router.use(adminStatsRouter);

export default router;
