export interface EtherscanResponse<T> {
    status: string;
    message: string;
    result: T;
  }
  
  export interface BlockData {
    number: string;
    hash: string;
    parentHash: string;
    nonce: string;
    sha3Uncles: string;
    logsBloom: string;
    transactionsRoot: string;
    stateRoot: string;
    receiptsRoot: string;
    miner: string;
    difficulty: string;
    totalDifficulty: string;
    extraData: string;
    size: string;
    gasLimit: string;
    gasUsed: string;
    timestamp: string;
    transactions: TransactionData[];
    uncles: string[];
  }
  
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
