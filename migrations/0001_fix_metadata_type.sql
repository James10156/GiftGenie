-- Migration: Fix metadata column type in performance_metrics table
ALTER TABLE performance_metrics
ALTER COLUMN metadata TYPE jsonb
USING metadata::jsonb;
