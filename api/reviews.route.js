import express from "express";
import ReviewsCtrl from "./reviews.controller.js"

const router = express.Router();

router.route("/movie/:id").get(ReviewsCtrl.apiGetReview); 
router.route("/new").post(ReviewsCtrl.apiPostReview);
router.route("/:id").put(ReviewsCtrl.apiUpdateReview).delete(ReviewsCtrl.apiDeleteReview);

export default router;
