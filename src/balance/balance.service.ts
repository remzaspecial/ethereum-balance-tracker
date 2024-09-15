import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BigNumber, ethers } from 'ethers';
import { lastValueFrom } from 'rxjs';
import axiosRetry from 'axios-retry';
import pLimit from 'p-limit';
import { ApiException } from '../common/exceptions/api.exception';
import { EtherscanResponse, BlockData } from '../etherscan/etherscan.interfaces';
import { AddressBalanceChangeDto } from './dto/address-balance-change.dto';
import { getLastNBlockNumbers } from '../common/utils/block-number.util';


@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);
  private readonly etherscanApiUrl: string;
  private readonly apiKey: string;
  private readonly numberOfBlocks: number;
  private readonly maxConcurrency: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.etherscanApiUrl = this.configService.get<string>('ETHERSCAN_API_URL');
    this.apiKey = this.configService.get<string>('ETHERSCAN_API_KEY');
    this.numberOfBlocks = this.configService.get<number>('NUMBER_OF_BLOCKS', 100);
    this.maxConcurrency = this.configService.get<number>('MAX_CONCURRENCY', 5);

    // Настройка повторных попыток для axios
    axiosRetry(this.httpService.axiosRef, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
      },
    });
  }

  /**
   * Находит адрес с наибольшим абсолютным изменением баланса за последние N блоков.
   */
  async findAddressWithLargestBalanceChange(): Promise<AddressBalanceChangeDto> {
    this.logger.log('Начало поиска адреса с наибольшим изменением баланса');

    try {
      const latestBlockNumber = await this.getLatestBlockNumber();
      this.logger.debug(`Последний номер блока: ${latestBlockNumber}`);

      const blockNumbers = getLastNBlockNumbers(latestBlockNumber, this.numberOfBlocks);
      this.logger.debug(
        `Обработка блоков с ${blockNumbers[blockNumbers.length - 1]} по ${blockNumbers[0]}`,
      );

      const blocks = await this.getBlocksByNumbers(blockNumbers);

      const addressBalanceChanges = new Map<string, BigNumber>();

      for (const blockData of blocks) {
        const transactions = blockData.transactions ?? [];

        for (const tx of transactions) {
          const value = BigNumber.from(tx.value);
          const from = tx.from?.toLowerCase();
          const to = tx.to?.toLowerCase();

          // Уменьшаем баланс отправителя
          if (from) {
            const prevBalance = addressBalanceChanges.get(from) ?? BigNumber.from(0);
            addressBalanceChanges.set(from, prevBalance.sub(value));
          }

          // Увеличиваем баланс получателя
          if (to) {
            const prevBalance = addressBalanceChanges.get(to) ?? BigNumber.from(0);
            addressBalanceChanges.set(to, prevBalance.add(value));
          }
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
      throw new HttpException(
        'Ошибка при поиске адреса с наибольшим изменением баланса',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Получает номер последнего блока в сети Ethereum.
   */
  private async getLatestBlockNumber(): Promise<number> {
    try {
      const response$ = this.httpService.get<EtherscanResponse<string>>(this.etherscanApiUrl, {
        params: {
          module: 'proxy',
          action: 'eth_blockNumber',
          apiKey: this.apiKey,
        },
      });

      const response = await lastValueFrom(response$);
      const blockNumberHex = response.data.result;
      const blockNumber = parseInt(blockNumberHex, 16);

      if (isNaN(blockNumber)) {
        throw new ApiException('Получен некорректный номер блока от API');
      }

      this.logger.debug(`Получен последний номер блока: ${blockNumber}`);
      return blockNumber;
    } catch (error) {
      this.logger.error(`Ошибка при получении последнего номера блока: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Получает данные блоков по их номерам с контролем конкурентности.
   */
  private async getBlocksByNumbers(blockNumbers: number[]): Promise<BlockData[]> {
    const limit = pLimit(this.maxConcurrency);
    const blockPromises = blockNumbers.map((blockNumber) =>
      limit(() => this.getBlockByNumber(blockNumber)),
    );

    const results = await Promise.allSettled(blockPromises);

    const blocks: BlockData[] = [];

    results.forEach((result, index) => {
      const blockNumber = blockNumbers[index];
      if (result.status === 'fulfilled' && result.value) {
        blocks.push(result.value);
      } else {
        this.logger.error(
          `Ошибка при получении блока ${blockNumber}: ${
            result.status === 'rejected' ? result.reason : 'Неизвестная ошибка'
          }`,
        );
      }
    });

    return blocks;
  }

  /**
   * Получает данные блока по его номеру.
   */
  private async getBlockByNumber(blockNumber: number): Promise<BlockData> {
    try {
      const hexBlockNumber = '0x' + blockNumber.toString(16);

      const response$ = this.httpService.get<EtherscanResponse<BlockData>>(this.etherscanApiUrl, {
        params: {
          module: 'proxy',
          action: 'eth_getBlockByNumber',
          tag: hexBlockNumber,
          boolean: 'true',
          apiKey: this.apiKey,
        },
      });

      const response = await lastValueFrom(response$);

      if (!response.data.result) {
        throw new ApiException(`API не вернул данные для блока ${blockNumber}`);
      }

      this.logger.debug(`Получены данные для блока ${blockNumber}`);
      return response.data.result;
    } catch (error) {
      this.logger.error(`Ошибка при получении блока ${blockNumber}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
