import mongoose from "mongoose";

const Schema = mongoose.Schema;

export const MessageSchema = new Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    toUser: { type: String, required: true, enum: ["user", "downline", "all"] },
    title: { type: String },
    isLocked: { type: Boolean, default: false },
    isShowing: { type: Boolean, default: true },
    date: { type: Date, default: Date.now() },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);

export default Message;
