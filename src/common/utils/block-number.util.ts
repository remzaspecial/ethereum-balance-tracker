export function getLastNBlockNumbers(latestBlockNumber: number, n: number): number[] {
  const blockNumbers: number[] = [];

  for (let i = 0; i < n; i++) {
    const blockNumber = latestBlockNumber - i;
    if (blockNumber <= 0) {
      break;
    }
    blockNumbers.push(blockNumber);
  }

  return blockNumbers;
}
