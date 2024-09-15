export interface EtherscanResponse<T> {
    status?: string;
    message?: string;
    result: T;
    error?: {
      code: number;
      message: string;
    };
  }
  