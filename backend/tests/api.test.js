process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Replace the Mongoose models with Jest mocks, so these tests never
// touch a real database.
jest.mock("../models/User");
jest.mock("../models/Reasoning");

const User = require("../models/User");
const Reasoning = require("../models/Reasoning");
const app = require("../app");
const { setLLMClient } = require("../controllers/reasoningController");
const { createFakeLLM } = require("./fakeLLM");

const USER_ID = "64b000000000000000000001";
const token = jwt.sign({ id: USER_ID }, "test-secret");
const auth = { Authorization: `Bearer ${token}` };

// Mongoose query chains like find().select().sort().limit()
const chain = (value) => {
    const query = {
        select: () => query,
        sort: () => query,
        limit: () => Promise.resolve(value)
    };
    return query;
};

beforeEach(() => {
    jest.resetAllMocks();
    setLLMClient(createFakeLLM());
});

describe("GET /", () => {
    test("reports the backend is running", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.text).toMatch(/Backend Running/);
    });
});

describe("POST /api/auth/register", () => {
    const valid = { name: "Arnav", email: "arnav@example.com", password: "password123" };

    test("rejects missing fields", async () => {
        const res = await request(app).post("/api/auth/register").send({ email: "a@b.co" });
        expect(res.status).toBe(400);
        expect(User.create).not.toHaveBeenCalled();
    });

    test("rejects an email that is already registered", async () => {
        User.findOne.mockResolvedValue({ _id: USER_ID });
        const res = await request(app).post("/api/auth/register").send(valid);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("User already exists");
        expect(User.create).not.toHaveBeenCalled();
    });

    test("creates the user with a hashed password and never returns it", async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockImplementation(async (doc) => ({ _id: USER_ID, ...doc }));

        const res = await request(app).post("/api/auth/register").send(valid);

        expect(res.status).toBe(201);
        expect(res.body.user).toEqual({ id: USER_ID, name: "Arnav", email: "arnav@example.com" });

        const saved = User.create.mock.calls[0][0];
        expect(saved.password).not.toBe("password123");
        expect(await bcrypt.compare("password123", saved.password)).toBe(true);
    });
});

describe("POST /api/auth/login", () => {
    const storedUser = async () => ({
        _id: USER_ID,
        name: "Arnav",
        email: "arnav@example.com",
        password: await bcrypt.hash("password123", 4)
    });

    test("returns a valid token for correct credentials", async () => {
        User.findOne.mockResolvedValue(await storedUser());

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "arnav@example.com", password: "password123" });

        expect(res.status).toBe(200);
        expect(jwt.verify(res.body.token, "test-secret").id).toBe(USER_ID);
        expect(res.body.user.password).toBeUndefined();
    });

    test("rejects a wrong password", async () => {
        User.findOne.mockResolvedValue(await storedUser());

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "arnav@example.com", password: "wrong-password" });

        expect(res.status).toBe(400);
        expect(res.body.token).toBeUndefined();
    });

    test("rejects an unknown email", async () => {
        User.findOne.mockResolvedValue(null);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@example.com", password: "password123" });

        expect(res.status).toBe(400);
        expect(res.body.token).toBeUndefined();
    });

    test("rejects missing fields", async () => {
        const res = await request(app).post("/api/auth/login").send({ email: "a@b.co" });
        expect(res.status).toBe(400);
    });
});

describe("auth middleware", () => {
    test("rejects a request with no token", async () => {
        const res = await request(app).get("/api/reasoning/history");
        expect(res.status).toBe(401);
    });

    test("rejects an invalid token", async () => {
        const res = await request(app)
            .get("/api/reasoning/history")
            .set("Authorization", "Bearer not-a-real-token");
        expect(res.status).toBe(401);
    });

    test("rejects a token signed with a different secret", async () => {
        const forged = jwt.sign({ id: USER_ID }, "someone-elses-secret");
        const res = await request(app)
            .get("/api/reasoning/history")
            .set("Authorization", `Bearer ${forged}`);
        expect(res.status).toBe(401);
    });
});

describe("POST /api/reasoning/create", () => {
    test("rejects an empty problem", async () => {
        const res = await request(app).post("/api/reasoning/create").set(auth).send({ problem: "   " });
        expect(res.status).toBe(400);
    });

    test("rejects a problem that is not a string", async () => {
        const res = await request(app).post("/api/reasoning/create").set(auth).send({ problem: 42 });
        expect(res.status).toBe(400);
    });

    test("rejects a problem over 2000 characters", async () => {
        const res = await request(app)
            .post("/api/reasoning/create")
            .set(auth)
            .send({ problem: "a".repeat(2001) });
        expect(res.status).toBe(400);
    });

    test("runs the pipeline and saves the result for the logged-in user", async () => {
        Reasoning.create.mockImplementation(async (doc) => ({ _id: "r1", ...doc }));

        const res = await request(app)
            .post("/api/reasoning/create")
            .set(auth)
            .send({ problem: "A train goes 120 km in 2 hours. What is its speed?" });

        expect(res.status).toBe(201);

        const saved = Reasoning.create.mock.calls[0][0];
        expect(saved.user).toBe(USER_ID);
        expect(saved.answer).toBe("60 km/h");
        expect(saved.routeType).toBe("analytical");
        expect(saved.verificationPassed).toBe(true);
        expect(saved.verification).toBe("Verified (confidence 95%).");
        expect(saved.trace).toHaveLength(6);
        expect(saved.tokens).toBe(90);
        expect(res.body.reasoning.finalAnswer).toMatch(/60 km\/h/);
    });

    test("saves an unverified answer with its open issues", async () => {
        setLLMClient(
            createFakeLLM({ verifier: { passed: false, issues: ["Units missing"], confidence: 0.4 } })
        );
        Reasoning.create.mockImplementation(async (doc) => doc);

        await request(app).post("/api/reasoning/create").set(auth).send({ problem: "Q?" });

        const saved = Reasoning.create.mock.calls[0][0];
        expect(saved.verificationPassed).toBe(false);
        expect(saved.revisions).toBe(2);
        expect(saved.verification).toBe(
            "Not fully verified after 2 revisions (confidence 40%). Open issues: Units missing"
        );
    });

    test("returns 502 and saves nothing when the LLM fails", async () => {
        setLLMClient(createFakeLLM({ router: new Error("Groq timeout") }));

        const res = await request(app).post("/api/reasoning/create").set(auth).send({ problem: "Q?" });

        expect(res.status).toBe(502);
        expect(res.body.message).not.toMatch(/Groq timeout/);
        expect(Reasoning.create).not.toHaveBeenCalled();
    });
});

describe("history, stats and delete", () => {
    test("GET /history returns only the logged-in user's sessions", async () => {
        Reasoning.find.mockReturnValue(chain([{ problem: "p1" }]));

        const res = await request(app).get("/api/reasoning/history").set(auth);

        expect(res.status).toBe(200);
        expect(res.body.history).toEqual([{ problem: "p1" }]);
        expect(Reasoning.find).toHaveBeenCalledWith({ user: USER_ID });
    });

    test("GET /stats returns verification rate and average response time", async () => {
        Reasoning.countDocuments.mockResolvedValue(4);
        Reasoning.find.mockReturnValue(chain([{ problem: "latest" }]));
        Reasoning.aggregate.mockResolvedValue([
            { verified: 3, checked: 4, revised: 1, avgMs: 4200.4 }
        ]);

        const res = await request(app).get("/api/reasoning/stats").set(auth);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            totalSessions: 4,
            latestProblem: "latest",
            verificationRate: 0.75,
            revisedSessions: 1,
            averageResponseMs: 4200
        });
    });

    test("GET /stats works for a new user with no sessions", async () => {
        Reasoning.countDocuments.mockResolvedValue(0);
        Reasoning.find.mockReturnValue(chain([]));
        Reasoning.aggregate.mockResolvedValue([]);

        const res = await request(app).get("/api/reasoning/stats").set(auth);

        expect(res.body).toMatchObject({
            totalSessions: 0,
            latestProblem: "No reasoning sessions yet",
            verificationRate: null
        });
    });

    test("DELETE rejects a malformed id", async () => {
        const res = await request(app).delete("/api/reasoning/not-an-id").set(auth);
        expect(res.status).toBe(400);
    });

    test("DELETE cannot remove another user's session", async () => {
        Reasoning.findOneAndDelete.mockResolvedValue(null);
        const id = "64b0000000000000000000ff";

        const res = await request(app).delete(`/api/reasoning/${id}`).set(auth);

        expect(res.status).toBe(404);
        expect(Reasoning.findOneAndDelete).toHaveBeenCalledWith({ _id: id, user: USER_ID });
    });

    test("DELETE removes the user's own session", async () => {
        Reasoning.findOneAndDelete.mockResolvedValue({ _id: "x" });
        const res = await request(app)
            .delete("/api/reasoning/64b0000000000000000000aa")
            .set(auth);
        expect(res.status).toBe(200);
    });
}
);