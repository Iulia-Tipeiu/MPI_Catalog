import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Serverul rulează pe http://localhost:${PORT}`);
  console.log(`Versiune API - ${new Date().toLocaleDateString()}`);
});
