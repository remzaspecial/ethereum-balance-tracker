export interface TransactionData {
    blockHash: string;
    blockNumber: string;
    from: string;
    gas: string;
    gasPrice: string;
    hash: string;
    input: string;
    nonce: string;
    to: string | null;
    transactionIndex: string;
    value: string;
    type: string;
    chainId: string;
    v: string;
    r: string;
    s: string;
}
