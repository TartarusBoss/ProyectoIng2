import express from "express";
import cors from "cors";
import { initDb } from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import surveyRoutes from "./routes/surveyRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const dbPromise = initDb();

app.use(async (req, res, next) => {
  req.db = await dbPromise;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
});
