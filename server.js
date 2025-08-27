import express from "express"
import cors from "cors"
import reviews from "./api/reviews.route.js"

const app = express();

app.use(cors());
app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use("/api/v1/reviews", reviews);

app.use("/", (req, res) => res.status(404).json({error: "Not Found!"}));

export default app;
