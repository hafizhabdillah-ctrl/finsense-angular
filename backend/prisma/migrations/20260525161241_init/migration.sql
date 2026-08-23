/*
  Warnings:

  - You are about to drop the `AiModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnomalyDetection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FinancialForecast` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FinancialGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FinancialReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MonthlyBudget` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnomalyDetection" DROP CONSTRAINT "AnomalyDetection_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "AnomalyDetection" DROP CONSTRAINT "AnomalyDetection_user_id_fkey";

-- DropForeignKey
ALTER TABLE "FinancialForecast" DROP CONSTRAINT "FinancialForecast_model_id_fkey";

-- DropForeignKey
ALTER TABLE "FinancialForecast" DROP CONSTRAINT "FinancialForecast_user_id_fkey";

-- DropForeignKey
ALTER TABLE "FinancialGoal" DROP CONSTRAINT "FinancialGoal_user_id_fkey";

-- DropForeignKey
ALTER TABLE "FinancialReport" DROP CONSTRAINT "FinancialReport_user_id_fkey";

-- DropForeignKey
ALTER TABLE "MonthlyBudget" DROP CONSTRAINT "MonthlyBudget_category_id_fkey";

-- DropForeignKey
ALTER TABLE "MonthlyBudget" DROP CONSTRAINT "MonthlyBudget_user_id_fkey";

-- DropTable
DROP TABLE "AiModel";

-- DropTable
DROP TABLE "AnomalyDetection";

-- DropTable
DROP TABLE "FinancialForecast";

-- DropTable
DROP TABLE "FinancialGoal";

-- DropTable
DROP TABLE "FinancialReport";

-- DropTable
DROP TABLE "MonthlyBudget";

-- DropEnum
DROP TYPE "GoalStatus";

-- DropEnum
DROP TYPE "ModelType";

-- DropEnum
DROP TYPE "PeriodType";

-- DropEnum
DROP TYPE "SeverityEnum";
