// models/ProductCount.js
const mongoose = require("mongoose");

const productCountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  count: { type: Number, default: 0 },
  date: {
    type: Date,
    default: () => new Date().setHours(0, 0, 0, 0), // ✅ store by day
  },
});

module.exports = mongoose.model("ProductCount", productCountSchema);
