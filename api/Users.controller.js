import UserDAO from "../dao/UserDAO.js";
import bcrypt from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

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

    static async apiGoogleAuth(req, res, next) {
        try {
            const { credential } = req.body;
            if (!credential) {
                return res.status(400).json({ success: false, message: 'Missing credential' });
            }
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const result = await UserDAO.findOrCreateGoogleUser(
                payload.sub,
                payload.email,
                payload.name,
                payload.picture
            );

            const token = jwt.sign(
                { googleId: result.googleId, email: result.email, username: result.username },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                token,
                isNewUser: result.isNewUser,
                user: {
                    googleId: result.googleId,
                    username: result.username,
                    email: result.email,
                    profilePic: result.profilePic,
                }
            });
        } catch (e) {
            console.error(`Google auth error: ${e.message}`);
            res.status(401).json({ success: false, message: 'Invalid Google token' });
        }
    }

    static async apiGoogleAuthCode(req, res, next) {
        try {
            const { code, redirectUri } = req.body;
            if (!code) {
                return res.status(400).json({ success: false, message: 'Missing code' });
            }
            const tokenClient = new OAuth2Client(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                redirectUri
            );
            const { tokens } = await tokenClient.getToken(code);
            const ticket = await tokenClient.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const result = await UserDAO.findOrCreateGoogleUser(
                payload.sub,
                payload.email,
                payload.name,
                payload.picture
            );
            const token = jwt.sign(
                { googleId: result.googleId, email: result.email, username: result.username },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            res.json({
                success: true,
                token,
                isNewUser: result.isNewUser,
                user: {
                    googleId: result.googleId,
                    username: result.username,
                    email: result.email,
                    profilePic: result.profilePic,
                }
            });
        } catch (e) {
            console.error(`Google auth code error: ${e.message}`);
            res.status(401).json({ success: false, message: 'Invalid authorization code' });
        }
    }
        try {
            const { username } = req.body;
            const googleId = req.user.googleId;

            if (!username || username.trim().length < 3) {
                return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
            }

            const result = await UserDAO.setUsername(googleId, username.trim());

            if (result.error) {
                return res.status(409).json({ success: false, message: result.error });
            }

            // Issue a new token with the updated username
            const token = jwt.sign(
                { googleId, email: req.user.email, username: username.trim() },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({ success: true, token, username: username.trim() });
        } catch (e) {
            console.error(`Set username error: ${e.message}`);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}