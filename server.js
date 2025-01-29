import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { HfInference } from "@huggingface/inference";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.error("MongoDB Connection Error", err));

const hf = new HfInference(process.env.HF_API_KEY);

const chatSchema = new mongoose.Schema({
  userMessage: String,
  botReply: String,
});
const Chat = mongoose.model("Chat", chatSchema);

app.get("/", (req, res) => {
  res.send({ message: "Application is Running" });
});

async function queryAI(message) {
  try {
    const response = await hf.textGeneration({
      model: "google/flan-t5-small",
      inputs: message,
    });

    return response.generated_text;
  } catch (error) {
    console.error("AI API Error:", error.message);
    throw new Error("AI service failed");
  }
}

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const botReply = await queryAI(message);

    const chat = new Chat({ userMessage: message, botReply });
    await chat.save();

    res.json({ message: botReply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} `));
