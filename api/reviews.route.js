import express from "express";
import ReviewsCtrl from "./reviews.controller.js"
import UserCtrl from "./Users.controller.js";

const router = express.Router();

router.route("/movie/:id").get(ReviewsCtrl.apiGetReview); 
router.route("/new").post(ReviewsCtrl.apiPostreview);
router.route("/:id").get(ReviewsCtrl.apiGetReview).put(ReviewsCtrl.apiPostreview).delete(ReviewsCtrl.apiDeleteReview);

router.route("/newUser").post(UserCtrl.apiAddUser);
router.route("/getUser/:username").get(UserCtrl.apiGetUser);
router.route("/authenticate").post(UserCtrl.apiCheckPassword);
router.route("/updateProfilePic/:username").put(UserCtrl.apiUpdateProfilePic);
router.route("/removeProfilePic/:username").put(UserCtrl.apiDeleteProfilePic);

export default router;
