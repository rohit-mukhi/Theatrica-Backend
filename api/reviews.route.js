import express from "express";
import ReviewsCtrl from "./reviews.controller.js"
import cors from 'cors';

const router = express.Router();
router.use(cors({
  origin: 'https://theatrica.netlify.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

router.route("/movie/:id").get(ReviewsCtrl.apiGetReview); 
router.route("/new").post(ReviewsCtrl.apiPostreview);
router.route("/:id").put(ReviewsCtrl.apiUpdateReview).delete(ReviewsCtrl.apiDeleteReview);

export default router;
