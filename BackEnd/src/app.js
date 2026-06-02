const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const userRouter = require("./routes/user.routes");
const captainRouter = require("./routes/captain.routes");
const mapRouter = require("./routes/map.routes");
const rideRouter = require("./routes/ride.routes");

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Uber Clone API Running",
  });
});

// API Routes
app.use("/api/user", userRouter);
app.use("/api/captain", captainRouter);
app.use("/api/map", mapRouter);
app.use("/api/ride", rideRouter);

// Production Setup
if (process.env.NODE_ENV === "production") {
  const rootDir = path.resolve();

  app.use(
    express.static(
      path.join(rootDir, "FrontEnd", "dist")
    )
  );

  app.use((req, res) => {
    res.sendFile(
      path.join(
        rootDir,
        "FrontEnd",
        "dist",
        "index.html"
      )
    );
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
