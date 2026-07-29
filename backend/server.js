const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const authRoutes = require("./routes/authRoutes");
const reasoningRoutes = require("./routes/reasoningRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/reasoning", reasoningRoutes);

app.get("/", (req, res) => {
    res.send("Smart Reasoning Assistant Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});