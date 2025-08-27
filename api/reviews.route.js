import express from "express";
import ReviewsCtrl from "./reviews.controller.js"

const router = express.Router();

router.route("/movie/:id").get(ReviewsCtrl.apiGetReview); 
router.route("/new").post(ReviewsCtrl.apiPostreview);
router.route("/:id").put(ReviewsCtrl.apiPostreview).delete(ReviewsCtrl.apiDeleteReview);

export default router;
