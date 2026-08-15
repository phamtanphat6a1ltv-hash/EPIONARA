-- =========================================================================
-- EPIONARA - SUPABASE SQL SCHEMA FOR E2EE CLOUD SYNC
-- Copy and paste this script directly into your Supabase SQL Editor to initialize.
-- =========================================================================

-- 1. Create Journals table
CREATE TABLE IF NOT EXISTS public.journals (
    id text NOT NULL,
    user_id text NOT NULL,
    encrypted_data text NOT NULL,
    ts bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT journals_pkey PRIMARY KEY (id)
);

-- Enable RLS (Row Level Security) for journals
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous/authenticated access only if matching X-User-Id header
CREATE POLICY "Allow select for owner" ON public.journals FOR SELECT 
  USING (user_id = nullif(current_setting('request.headers', true)::json->>'x-user-id', ''));

CREATE POLICY "Allow all for owner" ON public.journals FOR ALL 
  USING (user_id = nullif(current_setting('request.headers', true)::json->>'x-user-id', ''))
  WITH CHECK (user_id = nullif(current_setting('request.headers', true)::json->>'x-user-id', ''));


-- 2. Create AI History table
CREATE TABLE IF NOT EXISTS public.ai_history (
    id text NOT NULL,
    user_id text NOT NULL,
    encrypted_data text NOT NULL,
    ts bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_history_pkey PRIMARY KEY (id)
);

ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for owner on ai_history" ON public.ai_history FOR ALL 
  USING (user_id = nullif(current_setting('request.headers', true)::json->>'x-user-id', ''))
  WITH CHECK (user_id = nullif(current_setting('request.headers', true)::json->>'x-user-id', ''));


-- 3. Create Letters table
CREATE TABLE IF NOT EXISTS public.letters (
    id text NOT NULL,
    user_id text NOT NULL,
    encrypted_data text NOT NULL,
    ts bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT letters_pkey PRIMARY KEY (id)
);

ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for owner on letters" ON public.letters FOR ALL 
  USING (user_id = nullif(current_setting('request.headers', true)::json->>'x-user-id', ''))
  WITH CHECK (user_id = nullif(current_setting('request.headers', true)::json->>'x-user-id', ''));


-- 4. Create CBT Records table
CREATE TABLE IF NOT EXISTS public.cbt_records (
    id text NOT NULL,
    user_id text NOT NULL,
    encrypted_data text NOT NULL,
    ts bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cbt_records_pkey PRIMARY KEY (id)
);

ALTER TABLE public.cbt_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for owner on cbt_records" ON public.cbt_records FOR ALL 
  USING (user_id = nullif(current_setting('request.headers', true)::json->>'x-user-id', ''))
  WITH CHECK (user_id = nullif(current_setting('request.headers', true)::json->>'x-user-id', ''));


-- 5. Update Users table (If not exists, users fields will be added)
CREATE TABLE IF NOT EXISTS public.users (
    id text NOT NULL,
    email text,
    phone text,
    name text,
    avatar text,
    birthday text,
    password text,
    join_date text,
    plan_type text DEFAULT 'FREE' NOT NULL,
    subscription_expires_at timestamp with time zone,
    payment_customer_id text,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- If users table already exists, add columns if they don't exist:
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'FREE' NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_customer_id text;

-- 6. Create Plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id text NOT NULL,
    name text NOT NULL,
    monthly_price decimal(12,2) NOT NULL,
    yearly_price decimal(12,2) NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT plans_pkey PRIMARY KEY (id)
);

-- Seed Plans data
INSERT INTO public.plans (id, name, monthly_price, yearly_price, features) VALUES
('free', 'FREE', 0.00, 0.00, '["2 nhật ký mỗi ngày", "Nhận dạng cảm xúc cơ bản", "1 bài test MBTI cơ bản", "Lưu trữ dữ liệu cục bộ"]')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
monthly_price = EXCLUDED.monthly_price,
yearly_price = EXCLUDED.yearly_price,
features = EXCLUDED.features;

INSERT INTO public.plans (id, name, monthly_price, yearly_price, features) VALUES
('pro', 'PRO', 79000.00, 790000.00, '["Không giới hạn nhật ký", "Phân tích cảm xúc AI chuyên sâu", "Toàn bộ trắc nghiệm MBTI, EQ, Stress", "Sao lưu đám mây Supabase an toàn", "Nhịp tim sinh học PPG"]')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
monthly_price = EXCLUDED.monthly_price,
yearly_price = EXCLUDED.yearly_price,
features = EXCLUDED.features;

INSERT INTO public.plans (id, name, monthly_price, yearly_price, features) VALUES
('ultra', 'ULTRA', 149000.00, 1490000.00, '["Tất cả quyền lợi của gói PRO", "Bản đồ phát hiện tính cách AI nâng cao", "Ưu tiên phản hồi AI tốc độ cao", "Mira MindBot AI Coach riêng tư 24/7", "Xuất báo cáo PDF chuyên sâu không giới hạn"]')
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
monthly_price = EXCLUDED.monthly_price,
yearly_price = EXCLUDED.yearly_price,
features = EXCLUDED.features;

-- 7. Create Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL,
    user_id text NOT NULL,
    plan_id text NOT NULL,
    billing_cycle text NOT NULL,
    amount decimal(12,2) NOT NULL,
    currency text DEFAULT 'VND' NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL,
    provider_transaction_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);
