export function getLastNBlockNumbers(latestBlockNumber: number, n: number): number[] {
    return Array.from({ length: n }, (_, i) => latestBlockNumber - i);
  }
