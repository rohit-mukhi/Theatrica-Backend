import UserDAO from "../dao/UserDAO.js";
import bcrypt from 'bcrypt'

export default class UserController {
    static async apiAddUser(req, res, next) {
        try {
            const username = req.body.username;
            const password = req.body.password;

            const hashedPassword = await bcrypt.hash(password, 10);

            const addResponse = await UserDAO.addUser(username, hashedPassword)
            res.json({ status: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async apiGetUser(req, res, next) {
        try {
             let username = req.params.username
             let findUser = await UserDAO.getUser(username);
             if(!findUser) {
                res.status(404).json({ error: "User not found" });
                return;
             }
             res.json(findUser);
        } catch (error) {
            console.log(`api, ${error}`);
            res.status(404).json({ error: error });
        }
    }

    static async apiCheckPassword(req, res, next) {
        try {
            let username = req.body.username;
            let password = req.body.password;
            
            if(!username || !password) {
                return res.status(400).json({ success: false, message: 'Missing username or password' });
            }

            const storedPassword = await UserDAO.getHashedPassword(username);

            if(!storedPassword) {
                return res.status(401).json({  success: false, message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, storedPassword);

            if(isMatch) {
                return res.status(200).json({  success: true, message: 'Login successful' })
            } else {
                return res.status(401).json({  success: false, message: 'Invalid credentials' });
            }
        } catch (e) {
            console.error(`API Check Password error: ${e.message}`);
             return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    static async apiUpdateProfilePic(req, res, next) {
        try {
            const username = req.params.username;
            const profilePic = req.body.profilePic;

            const updateResponse = await UserDAO.updateProfilePic(username, profilePic);

            var { error } = updateResponse;
            if(error) {
                res.status(400).json({ error });
            }

            if(updateResponse.modifiedCount == 0) {
                throw new Error(
                    "Unable to update profile picture"
                );
            }

            res.json({ status: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async apiDeleteProfilePic(req, res, next) {
        try {
            const username = req.params.username;
            const response = await UserDAO.deleteProfilePic(username);
            res.json({ status: "Success" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}