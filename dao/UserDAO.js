import mongodb from "mongodb";
const ObjectId = mongodb.ObjectId;

let users

export default class UserDAO {
    static async injectDB(connection) {
        if(users) {
            return;
        }

        try {
            users = await connection.db("user_records").collection("user_records");
        } catch (e) {
            console.error(`Unable to establish collection handles in userDAO: ${e}`);
        }
    }

    static async addUser(username, password) {
        try {
            const userDoc = {
                username: username,
                password: password,
                profilePic: 0
            };
            return await users.insertOne(userDoc);
        } catch (e) {
            console.log(`Unable to add user: ${e}`);
            return { error: e };
        }
    }

    static async getUser(username) {
        try {
            return await users.findOne({ username: username });
        } catch (e) {
            console.error(`Unable to find user: ${e}`);
            return { error: e };
        }
    }
    
    static async updateProfilePic(username, val) {
        try {
            const updateResponse = await users.updateOne(
                { username: username},
                { $set: {profilePic: val} }
            );
        } catch (e) {
            console.error(`Unable to update profile pic: ${e}`);
        }
    }

    static async deleteProfilePic(username) {
        try {
            const deleteResponse = await users.updateOne(
                { username: username },
                { $set: { profilePic: 0 } }
            );
        } catch (e) {
            console.error(`Profile picture could not be deleted: ${e}`);
        }
    }

    static async getHashedPassword(username) {
        try {
            const userData = await users.findOne(
                {username: username},
                { projection: { password: 1, _id: 0 } }
            );
            if(!userData) {
                return null;
            }
            return userData.password;
        } catch (e) {
            console.error(`Could not retrieve the password: ${e}`);
            throw e;
        }
    }

    static async findOrCreateGoogleUser(googleId, email, name, picture) {
        try {
            let user = await users.findOne({ googleId: googleId });
            if (!user) {
                const userDoc = {
                    googleId: googleId,
                    username: null,
                    email: email,
                    profilePic: picture || 0,
                    password: null,
                    isNewUser: true,
                };
                await users.insertOne(userDoc);
                user = await users.findOne({ googleId: googleId });
                return { ...user, isNewUser: true };
            }
            return { ...user, isNewUser: false };
        } catch (e) {
            console.error(`Unable to find or create Google user: ${e}`);
            throw e;
        }
    }

    static async setUsername(googleId, username) {
        try {
            const existing = await users.findOne({ username: username });
            if (existing) return { error: 'Username already taken' };
            const result = await users.updateOne(
                { googleId: googleId },
                { $set: { username: username, isNewUser: false } }
            );
            return result;
        } catch (e) {
            console.error(`Unable to set username: ${e}`);
            throw e;
        }
    }
}