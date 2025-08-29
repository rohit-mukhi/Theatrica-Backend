import mongodb from "mongodb";
const ObjectId = mongodb.ObjectId;

let reviews

export default class ReviewsDAO {
    static async injectDB(connection) {
        if(reviews) {
            return;
        }

        try {
            reviews = await connection.db("theatrica").collection("theatrica");
        } catch(e) {
            console.error(`Unable to establish collection handles in userDAO: ${e}`)
        }
    }

    static async addReview(movieId, user, review) {
        try {
            const reviewDoc = {
                movieId: movieId,
                user: user,
                review: review,
            }
            return await reviews.insertOne(reviewDoc);
        } catch (e) {
            console.log(`Unable to post review: ${e}`);
            return { error: e};
        }
    }

    static async getReview(reviewId) {
        try {
            return await reviews.findOne({ _id: ObjectId(reviewId) });
        } catch(e) {
            console.error(`Unable to get review; ${e}`);
            return { error: e };
        }
    }

    static async updateReview(reviewId, user, review) {
        console.log("rev", reviewId);
        try {
            const updateResponse = await reviews.updateOne(
                { _id: ObjectId(reviewId) },
                { $set: { user: user, review:review } }
            );

            return updateResponse
        } catch (e) {
            console.error(`Unable to update review: ${e}`);
        }
    }

    static async deleteReview(reviewId) {
        try {
            const deleteResponse = await reviews.deleteOne(
                { _id: ObjectId(reviewId) }
            );

            return deleteResponse;
        } catch (e) {
            console.log(`Unable to delete review: ${e}`);
            return { error: e };
        }
    }

    static async getReviewsByMovieId(movieId) {
        console.log("mov", movieId);
        try {
            const cursor = await reviews.find({ movieId: movieId });
            return cursor.toArray();
        } catch (e) {
            console.log(`Unable to get review: ${e}`);
            return { error: e };
        }
    }
}