import mongoose from "mongoose";

const expensesSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    expense: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    receipt: {
      url: String,
      filename: String
    },
  },
  { timestamps: true }
);

export default expensesSchema;
