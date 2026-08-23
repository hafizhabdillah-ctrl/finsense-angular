-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "SourceEnum" AS ENUM ('manual', 'voice', 'ai');

-- CreateEnum
CREATE TYPE "SeverityEnum" AS ENUM ('low', 'mid', 'high');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('active', 'achieved', 'failed');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('monthly', 'weekly');

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('classify', 'forecast', 'anomaly');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('pending', 'partial', 'paid', 'overdue');

-- CreateEnum
CREATE TYPE "StockLogType" AS ENUM ('in', 'out', 'adjust');

-- CreateEnum
CREATE TYPE "StockLogStatus" AS ENUM ('completed', 'pending_audit');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UmkmProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT,
    "province" TEXT,
    "city" TEXT,
    "monthly_revenue_est" DOUBLE PRECISION,
    "employee_count" INTEGER,
    "onboarding_done" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UmkmProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "coicop_code" TEXT,
    "type" "TransactionType" NOT NULL,
    "parent_id" INTEGER,
    "icon" TEXT,
    "color_hex" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TransactionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "SourceEnum" NOT NULL,
    "is_anomaly" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionItem" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "category_id" INTEGER,
    "ai_confidence" DOUBLE PRECISION,
    "product_id" TEXT,

    CONSTRAINT "TransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT,
    "price" DOUBLE PRECISION,
    "min_stock" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLog" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "StockLogType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "operator" TEXT NOT NULL,
    "status" "StockLogStatus" NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "total_debt" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtPayment" (
    "id" TEXT NOT NULL,
    "debt_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "DebtPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "type" "ModelType" NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "model_path" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "deployed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiChatSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_title" TEXT,
    "context_summary" TEXT,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "token_used" INTEGER,
    "model_used" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialGoal" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_name" TEXT NOT NULL,
    "target_amount" DOUBLE PRECISION NOT NULL,
    "current_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "FinancialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyBudget" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "budget_amount" DOUBLE PRECISION NOT NULL,
    "alert_threshold" DOUBLE PRECISION NOT NULL DEFAULT 80,

    CONSTRAINT "MonthlyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnomalyDetection" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "anomaly_type" TEXT NOT NULL,
    "severity" "SeverityEnum" NOT NULL,
    "deviation_pct" DOUBLE PRECISION NOT NULL,
    "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnomalyDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialForecast" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "forecast_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "predicted_balance" DOUBLE PRECISION NOT NULL,
    "predicted_expense" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "model_id" INTEGER,

    CONSTRAINT "FinancialForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialReport" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_type" "PeriodType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_income" DOUBLE PRECISION NOT NULL,
    "total_expense" DOUBLE PRECISION NOT NULL,
    "net_balance" DOUBLE PRECISION NOT NULL,
    "pdf_url" TEXT,

    CONSTRAINT "FinancialReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_created_at_idx" ON "User"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "UmkmProfile_user_id_key" ON "UmkmProfile"("user_id");

-- CreateIndex
CREATE INDEX "UmkmProfile_user_id_idx" ON "UmkmProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategory_name_key" ON "TransactionCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategory_coicop_code_key" ON "TransactionCategory"("coicop_code");

-- CreateIndex
CREATE INDEX "TransactionCategory_type_idx" ON "TransactionCategory"("type");

-- CreateIndex
CREATE INDEX "TransactionCategory_parent_id_idx" ON "TransactionCategory"("parent_id");

-- CreateIndex
CREATE INDEX "Transaction_user_id_idx" ON "Transaction"("user_id");

-- CreateIndex
CREATE INDEX "Transaction_category_id_idx" ON "Transaction"("category_id");

-- CreateIndex
CREATE INDEX "Transaction_transaction_date_idx" ON "Transaction"("transaction_date");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_source_idx" ON "Transaction"("source");

-- CreateIndex
CREATE INDEX "Transaction_is_anomaly_idx" ON "Transaction"("is_anomaly");

-- CreateIndex
CREATE INDEX "TransactionItem_transaction_id_idx" ON "TransactionItem"("transaction_id");

-- CreateIndex
CREATE INDEX "TransactionItem_category_id_idx" ON "TransactionItem"("category_id");

-- CreateIndex
CREATE INDEX "TransactionItem_product_id_idx" ON "TransactionItem"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_user_id_idx" ON "Product"("user_id");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "StockLog_product_id_idx" ON "StockLog"("product_id");

-- CreateIndex
CREATE INDEX "StockLog_user_id_idx" ON "StockLog"("user_id");

-- CreateIndex
CREATE INDEX "StockLog_created_at_idx" ON "StockLog"("created_at");

-- CreateIndex
CREATE INDEX "StockLog_type_idx" ON "StockLog"("type");

-- CreateIndex
CREATE INDEX "StockLog_status_idx" ON "StockLog"("status");

-- CreateIndex
CREATE INDEX "Debt_user_id_idx" ON "Debt"("user_id");

-- CreateIndex
CREATE INDEX "Debt_status_idx" ON "Debt"("status");

-- CreateIndex
CREATE INDEX "Debt_due_date_idx" ON "Debt"("due_date");

-- CreateIndex
CREATE INDEX "DebtPayment_debt_id_idx" ON "DebtPayment"("debt_id");

-- CreateIndex
CREATE INDEX "DebtPayment_paid_at_idx" ON "DebtPayment"("paid_at");

-- CreateIndex
CREATE INDEX "AiModel_type_idx" ON "AiModel"("type");

-- CreateIndex
CREATE INDEX "AiModel_is_active_idx" ON "AiModel"("is_active");

-- CreateIndex
CREATE INDEX "AiChatSession_user_id_idx" ON "AiChatSession"("user_id");

-- CreateIndex
CREATE INDEX "AiChatSession_last_active_at_idx" ON "AiChatSession"("last_active_at");

-- CreateIndex
CREATE INDEX "AiMessage_session_id_idx" ON "AiMessage"("session_id");

-- CreateIndex
CREATE INDEX "AiMessage_created_at_idx" ON "AiMessage"("created_at");

-- CreateIndex
CREATE INDEX "AiMessage_role_idx" ON "AiMessage"("role");

-- CreateIndex
CREATE INDEX "FinancialGoal_user_id_idx" ON "FinancialGoal"("user_id");

-- CreateIndex
CREATE INDEX "FinancialGoal_status_idx" ON "FinancialGoal"("status");

-- CreateIndex
CREATE INDEX "FinancialGoal_deadline_idx" ON "FinancialGoal"("deadline");

-- CreateIndex
CREATE INDEX "MonthlyBudget_user_id_idx" ON "MonthlyBudget"("user_id");

-- CreateIndex
CREATE INDEX "MonthlyBudget_year_month_idx" ON "MonthlyBudget"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBudget_user_id_category_id_month_year_key" ON "MonthlyBudget"("user_id", "category_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "AnomalyDetection_transaction_id_key" ON "AnomalyDetection"("transaction_id");

-- CreateIndex
CREATE INDEX "AnomalyDetection_user_id_idx" ON "AnomalyDetection"("user_id");

-- CreateIndex
CREATE INDEX "AnomalyDetection_severity_idx" ON "AnomalyDetection"("severity");

-- CreateIndex
CREATE INDEX "AnomalyDetection_detected_at_idx" ON "AnomalyDetection"("detected_at");

-- CreateIndex
CREATE INDEX "AnomalyDetection_is_reviewed_idx" ON "AnomalyDetection"("is_reviewed");

-- CreateIndex
CREATE INDEX "FinancialForecast_user_id_idx" ON "FinancialForecast"("user_id");

-- CreateIndex
CREATE INDEX "FinancialForecast_forecast_date_idx" ON "FinancialForecast"("forecast_date");

-- CreateIndex
CREATE INDEX "FinancialForecast_model_id_idx" ON "FinancialForecast"("model_id");

-- CreateIndex
CREATE INDEX "FinancialReport_user_id_idx" ON "FinancialReport"("user_id");

-- CreateIndex
CREATE INDEX "FinancialReport_period_start_period_end_idx" ON "FinancialReport"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "FinancialReport_period_type_idx" ON "FinancialReport"("period_type");

-- AddForeignKey
ALTER TABLE "UmkmProfile" ADD CONSTRAINT "UmkmProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCategory" ADD CONSTRAINT "TransactionCategory_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "TransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "TransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "TransactionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLog" ADD CONSTRAINT "StockLog_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLog" ADD CONSTRAINT "StockLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtPayment" ADD CONSTRAINT "DebtPayment_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChatSession" ADD CONSTRAINT "AiChatSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "AiChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyBudget" ADD CONSTRAINT "MonthlyBudget_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyBudget" ADD CONSTRAINT "MonthlyBudget_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "TransactionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnomalyDetection" ADD CONSTRAINT "AnomalyDetection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnomalyDetection" ADD CONSTRAINT "AnomalyDetection_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialForecast" ADD CONSTRAINT "FinancialForecast_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialForecast" ADD CONSTRAINT "FinancialForecast_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "AiModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialReport" ADD CONSTRAINT "FinancialReport_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
