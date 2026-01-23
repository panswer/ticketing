import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { app } from "../app";

declare global {
    var signin: () => string[];
}

jest.mock('../nats-wrapper');

let mongo: any;
beforeAll(async () => {
    process.env.JWT_KEY = 'secret';

    mongo = await MongoMemoryServer.create();
    const mongoUri = mongo.getUri();

    await mongoose.connect(mongoUri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });
});

beforeEach(async () => {
    jest.clearAllMocks();

    if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.collections();

        for (let collection of collections) {
            await collection.deleteMany({});
        }
    }
});

afterAll(async () => {
    if (mongo) {
        await mongo.stop();
    }

    await mongoose.connection.close();
}, 1000 * 60);

global.signin = () => {
    // Build a JWT payload. { id, email }
    const payload = {
        id: mongoose.Types.ObjectId(),
        email: "test@test.com",
    };

    // Create the JWT!
    const token = jwt.sign(payload, process.env.JWT_KEY!);

    // Build a session Object. { jwt: MY_JWT }
    const session = { jwt: token };

    // Turn that session into JSON
    const sessionJson = JSON.stringify(session);

    // Take JSON and encode it as base64
    const base64 = Buffer.from(sessionJson).toString('base64');

    // return a string that the cookie with the encoded data
    return [`session=${base64}`];
}