import { Module } from '@nestjs/common';
import { BalanceModule } from './balance/balance.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    BalanceModule],
})
export class AppModule {}
