import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';

@Module({
  imports: [HttpModule],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
