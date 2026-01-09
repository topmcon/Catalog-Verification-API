import mongoose, { Document } from 'mongoose';
import { RawProduct, CleanedProduct, VerifiedProduct } from '../types/product.types';
/**
 * Product Document Interface
 */
export interface IProduct extends Document {
    sessionId: string;
    originalId: string;
    rawData: RawProduct;
    cleanedData?: CleanedProduct;
    verifiedData?: VerifiedProduct;
    status: 'pending' | 'processing' | 'verified' | 'failed' | 'flagged';
    productErrors: string[];
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Product Model
 */
export declare const Product: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Product;
//# sourceMappingURL=product.model.d.ts.map