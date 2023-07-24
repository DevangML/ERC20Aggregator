import mongoose, { Schema, Document } from "mongoose";

export interface ITransfer extends Document {
  fromAddress: string;
  toAddress: string;
  value: string;
  valueWithDecimals: string;
}

const transferSchema: Schema = new Schema(
  {
    fromAddress: {
      type: String,
    },
    toAddress: {
      type: String,
    },
    value: {
      type: String,
    },
    valueWithDecimals: {
      type: String,
    },
  },
  { timestamps: true }
);

let Transfers = mongoose.model<ITransfer>("Transfer", transferSchema);

export default Transfers;
