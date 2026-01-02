-- Interview Sessions Table
-- Mülakat oturumlarını ve AI raporlarını saklamak için tablo

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT,
    score_10 NUMERIC(3, 1), -- 0-10 arası puan (örn. 8.5)
    status_label TEXT, -- 'Güçlü Aday', 'İkinci Görüşme', 'Uygun Değil'
    interview_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    report_json JSONB, -- Gemini raporunun tamamı
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_id ON interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_interview_date ON interview_sessions(interview_date DESC);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status_label ON interview_sessions(status_label);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_sessions_updated_at 
    BEFORE UPDATE ON interview_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - şimdilik kapalı, admin servis key ile erişim
-- ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

