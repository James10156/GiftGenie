-- Migration: Add 'created_at' column to recommendation_feedback table
ALTER TABLE recommendation_feedback ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
