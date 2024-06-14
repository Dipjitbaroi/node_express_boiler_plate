import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
// import cron from "node-cron";
import userRoute from "./routes/users.js";
import transectionRoute from "./routes/transection.js";
import sportsRoute from "./routes/sports.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

const allowedOrigins = [
  "http://localhost:5001",
  "http://localhost:3000",
];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      // Allow requests with no origin (like mobile apps or curl requests)
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "device_id",
  ],
};

app.use(cors(corsOptions));

app.use(express.json());
const CONNECTION_URL = process.env.DB_URL;

mongoose.connect(CONNECTION_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB Connections successfull");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/files", express.static("files"));
app.use("/api/users/", userRoute);
app.use("/api/transection/", transectionRoute);
app.use("/api/sports/", sportsRoute);

app.listen(port, () => console.log(`Listening on port ${port}`));

// Schedule the cron job to run every 30 minutes
// cron.schedule(process.env.FANCY_CRON_SCHEDULE, async () => {
//   try {
//     // Call autoSettleFancy function every 30 minutes
//     const wls = await User.find({
//       status: "Active",
//       accountType: "white_level",
//     }).select("_id username");

//     console.log({ wls });
//     wls.forEach(async (wl) => {
//       await autoSettleFancy("cricket", wl._id, wl.username);
//     });
//     console.log("Auto settlement of fancy bets executed successfully.");
//   } catch (error) {
//     console.error("Error executing auto settlement of fancy bets:", error);
//   }
// });
