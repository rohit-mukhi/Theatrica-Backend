import ReviewsDAO from "../dao/reviewsDAO.js";
import UserDAO from "../dao/UserDAO.js";

function cosineSimilarity(vecA, vecB, sharedMovies) {
    let dot = 0, magA = 0, magB = 0
    for (const movieId of sharedMovies) {
        dot  += vecA[movieId] * vecB[movieId]
        magA += vecA[movieId] ** 2
        magB += vecB[movieId] ** 2
    }
    if (magA === 0 || magB === 0) return 0
    return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

export default class ReviewsController {
    static async apiPostreview(req, res, next) {
        try {
            const movieId = req.body.movieId;
            const review = req.body.review;
            const user = req.body.user;
            const rating = req.body.rating;

            const reviewResponse = await ReviewsDAO.addReview(
                movieId,
                user,
                review,
                rating
            )
            res.json({status: "success"});
        } catch (e) {
            res.status(500).json({error: e.message});
        }
    }

   /*  static async apiGetReview(req, res, next) {
        try {
            let id = req.params.id || {}
            let review = await ReviewsDAO.getReview(id);
                if(!review) {
                res.status(404).json({error: "Not Found"});
                return;
            }
            res.json(review);
        } catch(e) {
            console.log(`api, ${e}`);
            res.status(500).json({error: e});
        }
    } */

    static async apiUpdateReview(req, res, next) {
        try {
            const reviewId = req.params.id;
            const review = req.body.review;
            const user = req.body.user;

            const reviewResponse = await ReviewsDAO.updateReview(
                reviewId,
                user,
                review
            )

            var { error } = reviewResponse;
            if(error) {
                res.status(400).json({ error });
            }

            if(reviewResponse.modifiedCount === 0) {
                throw new Error (
                    "Unable to update review",
                )
            }

            res.json({ status: "Success" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async apiDeleteReview(req, res, next) {
        try {
            const reviewId = req.params.id;
            const reviewResponse = await ReviewsDAO.deleteReview(reviewId);
            res.json({ status: "Success" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async apiGetReview(req, res, next) {
        try {
            let id = req.params.id || {}
            let reviews = await ReviewsDAO.getReviewsByMovieId(id);
            if(!reviews) {
                res.status(404).json({ error: "Not Found" });
                return;
            }
            res.json(reviews);
        } catch (e) {
            console.log(`api, ${e}`);
            res.status(500).json({ error: e });
        }
    }

    static async apiGetReviewsByUser(req, res, next) {
        try {
            const username = req.params.username;
            const reviews = await ReviewsDAO.getReviewsByUsername(username);
            res.json(reviews);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    static async apiGetMatches(req, res, next) {
        try {
            const { username } = req.params
            const MIN_SHARED = 2
            const TOP_N = 10

            // 1. Get requesting user's reviews
            const myReviews = await ReviewsDAO.getReviewsByUsername(username)
            if (myReviews.length === 0) return res.json([])

            // Build my rating vector { movieId: rating }
            const myVec = {}
            for (const r of myReviews) myVec[r.movieId] = Number(r.rating)
            const myMovieIds = Object.keys(myVec)

            // 2. Fetch all reviews by other users on the same movies
            const candidates = await ReviewsDAO.getMatchCandidates(username, myMovieIds)
            if (candidates.length === 0) return res.json([])

            // 3. Group candidate reviews by user
            const byUser = {}
            for (const r of candidates) {
                if (!byUser[r.user]) byUser[r.user] = {}
                byUser[r.user][r.movieId] = Number(r.rating)
            }

            // 4. Score each candidate
            const scores = []
            for (const [otherUser, otherVec] of Object.entries(byUser)) {
                const sharedMovies = myMovieIds.filter(id => otherVec[id] !== undefined)
                if (sharedMovies.length < MIN_SHARED) continue

                const ratingSim  = cosineSimilarity(myVec, otherVec, sharedMovies)
                const overlapScore = sharedMovies.length / Math.min(myMovieIds.length, Object.keys(otherVec).length)
                const finalScore = 0.6 * ratingSim + 0.4 * overlapScore

                // Top shared movie = shared movie where ratings are closest
                const topSharedMovie = sharedMovies.reduce((best, id) => {
                    const diff = Math.abs(myVec[id] - otherVec[id])
                    return diff < best.diff ? { id, diff } : best
                }, { id: sharedMovies[0], diff: Infinity }).id

                scores.push({ username: otherUser, score: finalScore, sharedMovies: sharedMovies.length, topSharedMovieId: topSharedMovie })
            }

            scores.sort((a, b) => b.score - a.score)
            const top = scores.slice(0, TOP_N)

            // 5. Enrich with profile pics
            const userProfiles = await UserDAO.getUsersByUsernames(top.map(s => s.username))
            const profileMap = {}
            for (const u of userProfiles) profileMap[u.username] = u.profilePic

            const result = top.map(s => ({
                username: s.username,
                profilePic: profileMap[s.username] ?? null,
                score: Math.round(s.score * 100),
                sharedMovies: s.sharedMovies,
                topSharedMovieId: s.topSharedMovieId,
            }))

            res.json(result)
        } catch (e) {
            res.status(500).json({ error: e.message })
        }
    }
}