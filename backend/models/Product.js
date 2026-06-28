const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    retailPrice: {
      type: Number,
      default: 0,
    },
    wholesalePrice: {
      type: Number,
      default: 0,
    },
    productType: {
      type: String,
      enum: ["Retail", "Wholesale", "Both"],
      default: "Retail",
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      default: null,
    },
    stock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  },
);

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
