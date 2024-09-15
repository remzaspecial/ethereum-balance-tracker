import { Controller, Get } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { AddressBalanceChange } from './domain/entities/address-balance-change.entity';


@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('largest-change')
  async getAddressWithLargestBalanceChange(): Promise<AddressBalanceChange> {
    return this.balanceService.findAddressWithLargestBalanceChange();
  }
}
