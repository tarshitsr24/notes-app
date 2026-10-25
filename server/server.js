const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Allow credentials and handle CORS
app.use(cors({
  origin: true, // or your frontend Render URL once generated
  credentials: true,
}));

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/docs", require("./routes/docs"));

// Use Render's dynamic port or fallback to 5000
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => console.error("Database connection error:", err));

  app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running smoothly" });
});