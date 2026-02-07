FROM mcr.microsoft.com/playwright:v1.58.0-jammy
WORKDIR /bot
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 7070
CMD ["node", "bot.js"]
