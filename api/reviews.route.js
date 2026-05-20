import express from "express";
import ReviewsCtrl from "./reviews.controller.js"
import UserCtrl from "./Users.controller.js";
import { authMiddleware } from "./authMiddleware.js";

const router = express.Router();

router.route("/movie/:id").get(ReviewsCtrl.apiGetReview);
router.route("/user/:username").get(ReviewsCtrl.apiGetReviewsByUser);
router.route("/matches/:username").get(ReviewsCtrl.apiGetMatches);
router.route("/new").post(authMiddleware, ReviewsCtrl.apiPostreview);
router.route("/getUser/:username").get(UserCtrl.apiGetUser);
router.route("/googleAuth").post(UserCtrl.apiGoogleAuth);
router.route("/googleAuthCode").post(UserCtrl.apiGoogleAuthCode);
router.route("/setUsername").post(authMiddleware, UserCtrl.apiSetUsername);
router.route("/watchlist/add").post(authMiddleware, UserCtrl.apiAddToWatchlist);
router.route("/watchlist/remove/:movieId").delete(authMiddleware, UserCtrl.apiRemoveFromWatchlist);
router.route("/watchlist/:username").get(UserCtrl.apiGetWatchlist);
router.route("/updateProfilePic/:username").put(authMiddleware, UserCtrl.apiUpdateProfilePic);
router.route("/removeProfilePic/:username").put(authMiddleware, UserCtrl.apiDeleteProfilePic);
router.route("/:id").get(ReviewsCtrl.apiGetReview).put(authMiddleware, ReviewsCtrl.apiPostreview).delete(authMiddleware, ReviewsCtrl.apiDeleteReview);

export default router;
