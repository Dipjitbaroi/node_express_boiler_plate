import mongoose from "mongoose";
import User from "../user.model.js";
const Schema = mongoose.Schema;

export const TransectionSchema = new Schema(
  {
    uniqueId: {
      type: String,
      required: false,
    },
    transection_to: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    transection_from: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    transection_amount: { type: Number, required: true },
    transection_type: {
      type: String,
      required: true,
      enum: ["deposit", "withdraw"],
    },
    transect_full_amount: { type: Boolean, required: true },
    remark: { type: String, required: false },
    balance_downline: { type: Number, required: false },
    available_balance: { type: Number, required: false },
    exposer_in_downline: { type: Number, required: false },
    reference_profit_loss: { type: String, required: false },
  },
  { timestamps: true }
);

// Define pre-save hook to generate uniqueId if not provided
TransectionSchema.pre("save", function (next) {
  if (!this.uniqueId) {
    const uniqueNumber = Math.floor(100000000 + Math.random() * 900000000);
    this.uniqueId = uniqueNumber.toString();
  }
  next();
});

const Transection = mongoose.model("Transection", TransectionSchema);

export default Transection;
