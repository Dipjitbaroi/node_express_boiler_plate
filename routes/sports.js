import { Router } from "express";
import { checkToken } from "../middleware/checkToken.js";
import { getAllSports, getEvent, getScoresById, getSportsOddByEventId, getSportsOdds,getOddsByEventID } from "../controllers/sports.controller.js";

const router = Router();

router.get("/get-all-odds", checkToken, getSportsOdds);
router.get("/get-odd-by-eventid", checkToken, getSportsOddByEventId);
router.get("/get-all-sports", checkToken, getAllSports);
router.get("/get-scores-by-eventid", checkToken, getScoresById);
router.get("/get-event", getEvent);
router.get("/get-odds/:eventid", getOddsByEventID)


export default router;