import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AddressBalanceChange } from './domain/entities/address-balance-change.entity';
import { BigNumber, ethers } from 'ethers';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);
  private readonly apiKey = process.env.ETHERSCAN_API_KEY;
  private readonly etherscanApiUrl = 'https://api.etherscan.io/api';

  constructor(private readonly httpService: HttpService) {}

  async findAddressWithLargestBalanceChange(): Promise<AddressBalanceChange> {
    this.logger.log('Начало поиска адреса с наибольшим изменением баланса');

    try {
      const latestBlockNumber = await this.getLatestBlockNumber();
      this.logger.debug(`Последний номер блока: ${latestBlockNumber}`);

      const blockNumbers = this.getLastNBlockNumbers(latestBlockNumber, 100);
      this.logger.debug(
        `Обработка блоков с ${blockNumbers[blockNumbers.length - 1]} по ${blockNumbers[0]}`,
      );

      const addressBalanceChanges = new Map<string, BigNumber>();

      for (const blockNumber of blockNumbers) {
        try {
          const blockData = await this.getBlockByNumber(blockNumber);
          const transactions = blockData.transactions;

          for (const tx of transactions) {
            const value = BigNumber.from(tx.value);
            const from = tx.from?.toLowerCase();
            const to = tx.to?.toLowerCase();

            // Уменьшаем баланс отправителя
            if (from) {
              const prevBalance = addressBalanceChanges.get(from) || BigNumber.from(0);
              addressBalanceChanges.set(from, prevBalance.sub(value));
            }

            // Увеличиваем баланс получателя
            if (to) {
              const prevBalance = addressBalanceChanges.get(to) || BigNumber.from(0);
              addressBalanceChanges.set(to, prevBalance.add(value));
            }
          }
        } catch (blockError) {
          this.logger.error(
            `Ошибка при обработке блока ${blockNumber}: ${blockError.message}`,
            blockError.stack,
          );
          continue;
        }
      }

      // Находим адрес с наибольшим абсолютным изменением баланса
      let maxChangeAddress = '';
      let maxChangeValue = BigNumber.from(0);

      for (const [address, balanceChange] of addressBalanceChanges.entries()) {
        const absChange = balanceChange.abs();
        if (absChange.gt(maxChangeValue)) {
          maxChangeAddress = address;
          maxChangeValue = absChange;
        }
      }

      // Конвертируем баланс в разные единицы
      const balanceChangeWei = maxChangeValue.toString();
      const balanceChangeGwei = ethers.utils.formatUnits(maxChangeValue, 'gwei');
      const balanceChangeEther = ethers.utils.formatEther(maxChangeValue);

      this.logger.log(
        `Адрес с наибольшим изменением баланса: ${maxChangeAddress}, изменение: ${balanceChangeEther} ETH`,
      );

      return {
        address: maxChangeAddress,
        balanceChangeWei,
        balanceChangeGwei,
        balanceChangeEther,
      };
    } catch (error) {
      this.logger.error(
        `Ошибка при поиске адреса с наибольшим изменением баланса: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async getLatestBlockNumber(): Promise<number> {
    try {
      const response$ = this.httpService.get(this.etherscanApiUrl, {
        params: {
          module: 'proxy',
          action: 'eth_blockNumber',
          apiKey: this.apiKey,
        },
      });
      const response = await lastValueFrom(response$);
      const blockNumber = parseInt(response.data.result, 16);
      this.logger.debug(`Получен последний номер блока: ${blockNumber}`);
      return blockNumber;
    } catch (error) {
      this.logger.error(
        `Ошибка при получении последнего номера блока: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getLastNBlockNumbers(latestBlockNumber: number, n: number): number[] {
    return Array.from({ length: n }, (_, i) => latestBlockNumber - i);
  }

  private async getBlockByNumber(blockNumber: number): Promise<any> {
    try {
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
      this.logger.debug(`Получены данные для блока ${blockNumber}`);
      return response.data.result;
    } catch (error) {
      this.logger.error(
        `Ошибка при получении данных блока ${blockNumber}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
