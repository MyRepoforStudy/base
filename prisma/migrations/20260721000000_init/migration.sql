-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('PROD', 'STANDBY', 'TEST', 'DEV');

-- CreateEnum
CREATE TYPE "Datacenter" AS ENUM ('MAIN', 'DR');

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "environment" "Environment" NOT NULL DEFAULT 'PROD',
    "datacenter" "Datacenter" NOT NULL DEFAULT 'MAIN',
    "virtual" BOOLEAN NOT NULL DEFAULT true,
    "vendor" TEXT,
    "model" TEXT,
    "supportEnd" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Server_hostname_key" ON "Server"("hostname");
