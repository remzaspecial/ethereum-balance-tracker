import { Controller, Get } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { AddressBalanceChangeDto } from './dto/address-balance-change.dto';


@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('largest-change')
  async getAddressWithLargestBalanceChange(): Promise<AddressBalanceChangeDto> {
    return this.balanceService.findAddressWithLargestBalanceChange();
  }
}
