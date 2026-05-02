require("dotenv").config();

const path = require("path");

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const { uploadsRoot } = require("./utils/uploadPaths");


const homeRoutes = require("./modules/home/home.routes");
const expensesRoutes = require("./modules/expenses/expenses.routes");
const gymRoutes = require("./modules/gym/gym.routes");
const jobsRoutes = require("./modules/jobs/jobs.routes");
const lootRoutes = require("./modules/loot/loot.routes");
const mediaRoutes = require("./modules/media/media.routes");
const bucketListRoutes = require("./modules/bucketList/bucketList.routes");
const placesRoutes = require("./modules/places/places.routes");
const errorHandler = require("./middleware/errorHandler");
const libraryRoutes = require("./modules/library/library.routes");
const settingsRoutes = require("./modules/settings/settings.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(uploadsRoot));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Life OS API is running"
  });
});

app.get("/api/db-test", async (req, res) => {
  const [rows] = await db.query("SELECT DATABASE() AS database_name, NOW() AS server_time");

  res.json({
    ok: true,
    message: "MySQL connection is working",
    data: rows[0]
  });
});

app.use("/api/home-items", homeRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/gym", gymRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/loot", lootRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/bucket-list", bucketListRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/settings", settingsRoutes);



app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    message: "API route not found"
  });
});

if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.resolve(__dirname, "../../client/dist");

  app.use(express.static(clientDistPath));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use(errorHandler);




app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    ok: false,
    message: err.message || "Something went wrong"
  });
});

module.exports = app;