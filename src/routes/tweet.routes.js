import { Router } from "express";
import {
  addTweet,
  deleteTweet,
  getAllTweet,
} from "../controllers/tweet.controllers.js";
import { updateTweet } from "../controllers/tweet.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(addTweet);
router.route("/user/:userId").get(getAllTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
