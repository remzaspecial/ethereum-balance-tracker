import { Module } from '@nestjs/common';
import { BalanceModule } from './balance/balance.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    BalanceModule,
  ],
})
export class AppModule {}
