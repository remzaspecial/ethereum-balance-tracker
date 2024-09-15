# Ethereum Balance Change API

API-сервис для определения адреса с наибольшим абсолютным изменением баланса за последние 100 блоков в сети Ethereum.

## Требования

- **Node.js** версии 14 или выше
- **npm**
- **Docker** (опционально)

## Установка

1. **Клонируйте репозиторий:**

   ```bash
   git clone https://github.com/remzaspecial/ethereum-balance-tracker.git
   cd ethereum-balance-tracker
   ```

2. **Установите зависимости:**

   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**

   Скопируйте файл `.env.example` в `.env`:

   ```bash
   cp .env.example .env
   ```

   Отредактируйте файл `.env` и укажите ваш фактический API-ключ Etherscan:

   ```dotenv
   # .env

   # Конфигурация сервиса
   HTTP_PORT=3000

   # Конфигурация API Etherscan
   ETHERSCAN_API_KEY=Ваш_фактический_API_ключ_Etherscan
   ETHERSCAN_API_URL=https://api.etherscan.io/api

   # Настройки приложения
   NUMBER_OF_BLOCKS=100
   MAX_CONCURRENCY=5
   ```

4. **Запуск сервиса:**

   ```bash
   npm run start:dev
   ```

## Использование

### Пример запроса:

```bash
curl http://localhost:3000/balance/largest-change
```

### Пример ответа:

```json
{
    "address": "0x84b38bc60f3bd82640ecefa320dab2be62e2da15",
    "balanceChangeWei": "569999754175774941000",
    "balanceChangeGwei": "569999754175.774941",
    "balanceChangeEther": "569.999754175774941"
}
```