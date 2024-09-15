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
    "address": "0xf1da173228fcf015f43f3ea15abbb51f0d8f1123",
    "balanceChangeWei": "38163878885001605411",
    "balanceChangeGwei": "38163878885.001605411",
    "balanceChangeEther": "38.163878885001605411"
}
```