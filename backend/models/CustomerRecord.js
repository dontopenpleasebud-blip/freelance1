const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      default: "Anonymous",
    },
    customerPhone: {
      type: String,
      default: "Anonymous",
    },
    optOut: {
      type: Boolean,
      default: false,
    },
    // loyalityPoints: {
    //   type: Number,
    //   default: 0,
    // },
    // productsHistory: [
    //   {
    //     product: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Product",
    //       required: true,
    //     },
    //     quantity: {
    //       type: Number,
    //       required: true,
    //     },
    //   },
    // ],
  },
  {
    timestamps: true,
  },
);

const CustomerRecord = mongoose.model("CustomerRecord", BillSchema);

module.exports = CustomerRecord;
