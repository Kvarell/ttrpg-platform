-- AlterTable: Додаємо нові поля профілю до User

-- Робимо username унікальним
ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");

-- Додаємо нові поля профілю
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN "timezone" TEXT;
ALTER TABLE "User" ADD COLUMN "language" TEXT DEFAULT 'uk';
ALTER TABLE "User" ADD COLUMN "lastActiveAt" TIMESTAMP(3);

-- Додаємо updatedAt з дефолтним значенням (поточний час для існуючих записів)
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
