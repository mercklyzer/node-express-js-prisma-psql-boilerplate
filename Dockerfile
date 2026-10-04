FROM node:24-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# generate does not connect to the database, but the Prisma config requires DATABASE_URL to be set
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
