-- ====================================================================
-- SCHEMA DE BASE DE DONNÉES DE PRODUCTION - BOBDO TRADING AND FINANCE (BTF)
-- Compatible avec PostgreSQL, Supabase, ElephantSQL ou MySQL (avec ajustements mineurs)
-- Représente l'état authentique et souverain du système de trading
-- Zone UEMOA, Burkina Faso
-- ====================================================================

-- 1. Table de configuration générale du système (Paramètres globaux)
CREATE TABLE IF NOT EXISTS btf_system_config (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global_config',
    is_veto_active BOOLEAN NOT NULL DEFAULT FALSE,
    daily_drawdown_limit_reached BOOLEAN NOT NULL DEFAULT FALSE,
    total_volume_traded_fcfa BIGINT NOT NULL DEFAULT 2110000,
    total_admin_commissions_usdt NUMERIC(15, 4) NOT NULL DEFAULT 125.0000,
    admin_binance_withdraw_address VARCHAR(255) DEFAULT 'TYJpqo78QndhXswZ69YgsaA31V (TRC-20)',
    admin_referral_link VARCHAR(255) DEFAULT 'https://accounts.binance.com/register?ref=BTF_772W',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seeding initial de la config système si elle n'existe pas
INSERT INTO btf_system_config (id, is_veto_active, daily_drawdown_limit_reached, total_volume_traded_fcfa, total_admin_commissions_usdt)
VALUES ('global_config', FALSE, FALSE, 2110000, 125.0000)
ON CONFLICT (id) DO NOTHING;


-- 2. Table des Utilisateurs et Abonnés
CREATE TABLE IF NOT EXISTS btf_users (
    id VARCHAR(100) PRIMARY KEY, -- ex: 'user-default' ou adresse email
    email VARCHAR(150) UNIQUE NOT NULL,
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    subscription_type VARCHAR(50) NOT NULL DEFAULT 'PAID', -- 'PAID', 'FREE_COMMISSION'
    balance_fcfa DOUBLE PRECISION NOT NULL DEFAULT 1500000.0,
    balance_usdt DOUBLE PRECISION NOT NULL DEFAULT 2500.0,
    referral_code VARCHAR(50) UNIQUE DEFAULT NULL,
    referred_by VARCHAR(50) DEFAULT NULL,
    referral_earnings_fcfa DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    referral_count INTEGER NOT NULL DEFAULT 0,
    accumulated_free_commission_fcfa DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    
    -- Clés API cryptées raccordées
    binance_key VARCHAR(255) DEFAULT NULL,
    binance_secret VARCHAR(255) DEFAULT NULL,
    okx_key VARCHAR(255) DEFAULT NULL,
    bybit_key VARCHAR(255) DEFAULT NULL,
    brvm_id VARCHAR(255) DEFAULT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seeding de l'utilisateur de démonstration par défaut
INSERT INTO btf_users (
    id, email, trial_start_date, is_subscribed, subscription_type, balance_fcfa, balance_usdt, referral_code, referred_by, referral_count, binance_key, binance_secret, brvm_id
) VALUES (
    'user-default',
    'ibsawadogo54@gmail.com',
    CURRENT_TIMESTAMP,
    FALSE,
    'PAID',
    1500000.0,
    2500.0,
    'SESS54OBD',
    'UEMOA_ADMIN',
    4,
    'bin_683921048_test',
    'bsec_uemoa_secured_btf_920',
    'brvm_coris_99182'
) ON CONFLICT (id) DO NOTHING;


-- 3. Table des Ordres de Trading réels et démo
CREATE TABLE IF NOT EXISTS btf_orders (
    id VARCHAR(100) PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL, -- ex: 'SONATEL', 'BTC/USDT'
    type VARCHAR(20) NOT NULL, -- 'BUY', 'SELL'
    price DOUBLE PRECISION NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    total_fcfa DOUBLE PRECISION NOT NULL,
    mode VARCHAR(20) NOT NULL DEFAULT 'DEMO', -- 'DEMO', 'REAL'
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- 'OPEN', 'COMPLETED', 'CANCELLED'
    stop_loss DOUBLE PRECISION NOT NULL,
    take_profit DOUBLE PRECISION NOT NULL,
    is_autonomous BOOLEAN NOT NULL DEFAULT FALSE,
    risk_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer le chargement des ordres récents
CREATE INDEX IF NOT EXISTS idx_btf_orders_timestamp ON btf_orders (timestamp DESC);


-- 4. Table des rapports d'enquêtes sur les marchés physiques locaux (Corridors logistiques)
CREATE TABLE IF NOT EXISTS btf_physical_reports (
    id VARCHAR(100) PRIMARY KEY,
    corridor VARCHAR(100) NOT NULL, -- ex: 'Bobo-Dioulasso', 'Abidjan-Ouagadougou'
    product VARCHAR(150) NOT NULL, -- 'Sorgo', 'Maïs', 'Poisson'
    scarcity_index INTEGER NOT NULL DEFAULT 50, -- 0 à 100
    trend VARCHAR(20) NOT NULL DEFAULT 'STABLE', -- 'UP', 'DOWN', 'STABLE'
    observed_price_fcfa DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50) NOT NULL, -- 'sac 100kg', 'tonne'
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED', -- 'PENDING', 'PUBLISHED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_btf_reports_created ON btf_physical_reports (created_at DESC);


-- Seeding initial de rapports de corridores logistiques
INSERT INTO btf_physical_reports (id, corridor, product, scarcity_index, trend, observed_price_fcfa, unit, description) VALUES
('phys-1', 'Bobo-Dioulasso', 'Sorgo et Maïs blanc (Hub local)', 35, 'STABLE', 14500.0, 'sac 100kg', 'Disponibilité forte après récolte dans les fermes environnantes de Bobo. Demande stable.'),
('phys-2', 'Abidjan-Ouagadougou', 'Poisson frais & Banane plantain', 78, 'UP', 1200000.0, 'tonne', 'Pénurie temporaire due à un goulot d''étranglement logistique à la frontière. Forte augmentation des prix attendue sur les marchés de Ouagadougou.')
ON CONFLICT (id) DO NOTHING;


-- 5. Table des analyses de sentiments IA du scanner Web (Gemini Search Grounded)
CREATE TABLE IF NOT EXISTS btf_sentiments (
    id VARCHAR(100) PRIMARY KEY,
    source VARCHAR(100) NOT NULL, -- ex: 'BRVM Economie'
    entity VARCHAR(150) NOT NULL, -- ex: 'Coris Bank International'
    sentiment_score DOUBLE PRECISION NOT NULL DEFAULT 0.0, -- de -1.0 à +1.0
    summary TEXT NOT NULL,
    impact_on_trading TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_btf_sentiments_time ON btf_sentiments (timestamp DESC);


-- Seeding d'analyses IA initiales
INSERT INTO btf_sentiments (id, source, entity, sentiment_score, summary, impact_on_trading) VALUES
('sent-1', 'BRVM Economie', 'Coris Bank International', 0.85, 'Résultats annuels exceptionnels et expansion confirmée dans les pays du golfe de Guinée.', 'Acheter à l''ouverture pour cibler +5% de valorisation à court terme.'),
('sent-2', 'Global News (Grounding)', 'Bitcoin (Crypto)', -0.40, 'Pressions réglementaires accrues aux États-Unis entraînant une prudence temporaire des baleines.', 'Suspension temporaire du trading autonome sur levier crypto.')
ON CONFLICT (id) DO NOTHING;


-- 6. Table des demandes de paiements pour validation d'accès SaaS (Orange/Moov Money proof)
CREATE TABLE IF NOT EXISTS btf_payments (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    operator VARCHAR(50) NOT NULL, -- 'Orange Money', 'Moov Money', 'Wave'
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    phone_sender VARCHAR(50) NOT NULL,
    proof_details TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_btf_payments_time ON btf_payments (timestamp DESC);


-- 7. Table des Journaux de sécurité Firewall / Trace d'audit
CREATE TABLE IF NOT EXISTS btf_security_logs (
    id VARCHAR(100) PRIMARY KEY,
    action VARCHAR(100) NOT NULL, -- ex: 'ORDER_EXECUTED', 'ADMIN_MFA_SUCCESS'
    ip VARCHAR(50) NOT NULL,
    details TEXT,
    severity VARCHAR(30) NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARNING', 'CRITICAL'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_btf_security_logs_time ON btf_security_logs (timestamp DESC);

-- Seeding initial de sécurité
INSERT INTO btf_security_logs (id, action, ip, details, severity) VALUES
('log-1', 'SECURE_BOOT', '127.0.0.1', 'BTF Firewall & Risk Manager initialisés avec succès en mode base de données PostgreSQL de production. Standard UTC NTP appliqué.', 'INFO')
ON CONFLICT (id) DO NOTHING;
