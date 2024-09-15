import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AddressBalanceChange } from './domain/entities/address-balance-change.entity';

@Injectable()
export class BalanceService {
  private readonly apiKey = process.env.ETHERSCAN_API_KEY;
  private readonly etherscanApiUrl = 'https://api.etherscan.io/api';

  constructor(private readonly httpService: HttpService) {}

  async findAddressWithLargestBalanceChange(): Promise<AddressBalanceChange> {
    const latestBlockNumber = await this.getLatestBlockNumber();
    const blockNumbers = this.getLastNBlockNumbers(latestBlockNumber, 100);

    const addressBalanceChanges = new Map<string, bigint>();

    for (const blockNumber of blockNumbers) {
      const blockData = await this.getBlockByNumber(blockNumber);
      const transactions = blockData.transactions;

      for (const tx of transactions) {
        const value = BigInt(tx.value);
        const from = tx.from?.toLowerCase();
        const to = tx.to?.toLowerCase();

        // Уменьшаем баланс отправителя
        if (from) {
          addressBalanceChanges.set(
            from,
            (addressBalanceChanges.get(from) || BigInt(0)) - value,
          );
        }

        // Увеличиваем баланс получателя
        if (to) {
          addressBalanceChanges.set(
            to,
            (addressBalanceChanges.get(to) || BigInt(0)) + value,
          );
        }
      }
    }

    // Находим адрес с наибольшим абсолютным изменением баланса
    let maxChangeAddress = '';
    let maxChangeValue = BigInt(0);

    for (const [address, balanceChange] of addressBalanceChanges.entries()) {
      const absChange = balanceChange >= BigInt(0) ? balanceChange : -balanceChange;
      if (absChange > maxChangeValue) {
        maxChangeAddress = address;
        maxChangeValue = absChange;
      }
    }

    return {
      address: maxChangeAddress,
      balanceChange: maxChangeValue.toString(),
    };
  }

  private async getLatestBlockNumber(): Promise<number> {
    const response$ = this.httpService.get(this.etherscanApiUrl, {
      params: {
        module: 'proxy',
        action: 'eth_blockNumber',
        apiKey: this.apiKey,
      },
    });
    const response = await lastValueFrom(response$);
    return parseInt(response.data.result, 16);
  }

  private getLastNBlockNumbers(latestBlockNumber: number, n: number): number[] {
    return Array.from({ length: n }, (_, i) => latestBlockNumber - i);
  }

  private async getBlockByNumber(blockNumber: number): Promise<any> {
    const hexBlockNumber = '0x' + blockNumber.toString(16);
    const response$ = this.httpService.get(this.etherscanApiUrl, {
      params: {
        module: 'proxy',
        action: 'eth_getBlockByNumber',
        tag: hexBlockNumber,
        boolean: 'true',
        apiKey: this.apiKey,
      },
    });
    const response = await lastValueFrom(response$);
    return response.data.result;
  }
}
