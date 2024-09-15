# Stage 1: Build the application
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Сборка приложения
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости
COPY package*.json ./

# Устанавливаем только продакшн-зависимости
RUN npm ci --only=production

# Копируем сборку из предыдущего этапа
COPY --from=builder /app/dist ./dist

# Используем непривилегированного пользователя
USER node

# Экспонируем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/main.js"]
