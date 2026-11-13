const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const reasoningRoutes = require("./routes/reasoningRoutes");

// The Express app is defined here without connecting to MongoDB or
// listening on a port, so tests can import it and send requests to it
// directly with Supertest. server.js does the connecting and listening.
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/reasoning", reasoningRoutes);

app.get("/", (req, res) => {
    res.send("Smart Reasoning Assistant Backend Running");
});

module.exports = app;