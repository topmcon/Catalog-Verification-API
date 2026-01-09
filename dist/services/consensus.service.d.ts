import { CleanedProduct, VerifiedProduct } from '../types/product.types';
import { ConsensusResult } from '../types/ai.types';
/**
 * Build consensus from dual AI validation results
 */
export declare function buildConsensus(product: CleanedProduct, sessionId: string): Promise<{
    consensusResult: ConsensusResult;
    verifiedProduct?: VerifiedProduct;
}>;
/**
 * Process multiple products through consensus
 */
export declare function processProducts(products: CleanedProduct[], sessionId: string): Promise<Array<{
    consensusResult: ConsensusResult;
    verifiedProduct?: VerifiedProduct;
}>>;
declare const _default: {
    buildConsensus: typeof buildConsensus;
    processProducts: typeof processProducts;
};
export default _default;
//# sourceMappingURL=consensus.service.d.ts.map