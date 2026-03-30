import express from "express";
import ReviewsCtrl from "./reviews.controller.js"
import UserCtrl from "./Users.controller.js";
import { authMiddleware } from "./authMiddleware.js";

const router = express.Router();

router.route("/movie/:id").get(ReviewsCtrl.apiGetReview);
router.route("/new").post(authMiddleware, ReviewsCtrl.apiPostreview);
router.route("/newUser").post(UserCtrl.apiAddUser);
router.route("/getUser/:username").get(UserCtrl.apiGetUser);
router.route("/authenticate").post(UserCtrl.apiCheckPassword);
router.route("/googleAuth").post(UserCtrl.apiGoogleAuth);
router.route("/setUsername").post(authMiddleware, UserCtrl.apiSetUsername);
router.route("/updateProfilePic/:username").put(authMiddleware, UserCtrl.apiUpdateProfilePic);
router.route("/removeProfilePic/:username").put(authMiddleware, UserCtrl.apiDeleteProfilePic);
router.route("/:id").get(ReviewsCtrl.apiGetReview).put(authMiddleware, ReviewsCtrl.apiPostreview).delete(authMiddleware, ReviewsCtrl.apiDeleteReview);

export default router;
