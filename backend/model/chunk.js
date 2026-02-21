import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema({
  text: { type: String, required: true },
  embedding: { type: [Number], required: true }
});

const Chunk = mongoose.model("Chunk", chunkSchema);
export default Chunk;