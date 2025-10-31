import mongoose from "mongoose";

const dailyCountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    count: { type: Number, required: true },
    date: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split("T")[0], // YYYY-MM-DD
    },
  },
  { timestamps: true }
);

export default mongoose.model("DailyCount", dailyCountSchema);
