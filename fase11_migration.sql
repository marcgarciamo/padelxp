-- ============================================================
-- FASE 11 — Sistema de Temporadas + Admin Panel
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Extender tabla seasons
ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS slug        TEXT,
  ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES players(id),
  ADD COLUMN IF NOT EXISTS closed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meta        JSONB DEFAULT '{}'::jsonb;

-- Migrar is_active → status
UPDATE seasons SET status = 'active' WHERE is_active = true;
UPDATE seasons SET status = 'closed' WHERE is_active = false;

-- Generar slug para filas existentes sin slug
UPDATE seasons
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
        || '-' || EXTRACT(YEAR FROM created_at)::text
WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);

-- 2. Añadir role y banned a players
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS role   TEXT NOT NULL DEFAULT 'player',
  ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_players_role ON players(role);

-- 3. season_id en league_matches y tournament_matches (si no existe)
ALTER TABLE league_matches     ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id);
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id);

-- 4. Tabla season_snapshots
CREATE TABLE IF NOT EXISTS season_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id           UUID NOT NULL REFERENCES seasons(id),
  player_id           UUID NOT NULL REFERENCES players(id),
  final_elo           INTEGER NOT NULL,
  final_media_global  NUMERIC(5,2) NOT NULL,
  final_xp            INTEGER NOT NULL,
  final_level         INTEGER NOT NULL,
  total_wins          INTEGER NOT NULL DEFAULT 0,
  total_losses        INTEGER NOT NULL DEFAULT 0,
  mvp_count           INTEGER NOT NULL DEFAULT 0,
  rank_position       INTEGER,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(season_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_season_snapshots_season ON season_snapshots(season_id);
CREATE INDEX IF NOT EXISTS idx_season_snapshots_player ON season_snapshots(player_id);

-- 5. Tabla admin_activity_log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES players(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_log_admin   ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_created ON admin_activity_log(created_at DESC);

-- 6. Asignar el primer admin (reemplaza <PLAYER_ID> con tu ID real)
-- UPDATE players SET role = 'admin' WHERE id = '<PLAYER_ID>';

-- ============================================================
-- FIN DEL MIGRATION
-- ============================================================
