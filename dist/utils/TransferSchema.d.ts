import mongoose, { Document } from "mongoose";
export interface ITransfer extends Document {
    fromAddress: string;
    toAddress: string;
    value: string;
    valueWithDecimals: string;
}
declare let Transfers: mongoose.Model<ITransfer, {}, {}, {}, mongoose.Document<unknown, {}, ITransfer> & ITransfer & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default Transfers;
