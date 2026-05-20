import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from "./server.js";
import mongodb from "mongodb";
import ReviewDAO from "./dao/reviewsDAO.js";
import UserDAO from "./dao/UserDAO.js";
import ConnectionDAO from "./dao/ConnectionDAO.js";
import MessageDAO from "./dao/MessageDAO.js";
import { createWsServer } from "./ws/chatServer.js";

const MongoClient = mongodb.MongoClient;

const mongo_username = process.env['mongo_username'];
const mongo_password = process.env['mongo_password'];
const uri = `mongodb+srv://${mongo_username}:${mongo_password}@cluster0.pbpxcf2.mongodb.net/`;
const port = process.env.PORT || 8000;

MongoClient.connect(uri, { maxPoolSize: 50, waitQueueTimeoutMS: 2500 })
    .catch(err => { console.error(err.stack); process.exit(1); })
    .then(async client => {
        await UserDAO.injectDB(client);
        await ReviewDAO.injectDB(client);
        await ConnectionDAO.injectDB(client);
        await MessageDAO.injectDB(client);

        // Create HTTP server so WebSocket and Express share the same port
        const server = http.createServer(app);
        createWsServer(server);

        server.listen(port, () => {
            console.log(`listening on port ${port}`);
        });
    });

