import mongoose from "mongoose";

const Schema = mongoose.Schema;

export const TransectionLogSchema = new Schema(
  {
    // deposit_by_upline: { type: Number, required: false },
    // deposit_to_downline: { type: Number, required: false },
    deposit: { type: Number, required: false, default: 0 },
    // withdraw_by_upline: { type: Number, required: false },
    // withdraw_from_downline: { type: Number, required: false },
    withdraw: { type: Number, required: false, default: 0 },
    balance: { type: Number, required: false, default: 0 },
    balance_remark: { type: String, default: " ", required: false },
    from_to: { type: Object, required: true },
    ip_address: { type: String, required: false, default: "" },
  },
  { timestamps: true }
);

const TransectionLog = mongoose.model("TransectionLog", TransectionLogSchema);

export default TransectionLog;
