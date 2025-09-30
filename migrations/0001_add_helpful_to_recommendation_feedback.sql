-- Migration: Add 'helpful' column to recommendation_feedback table
ALTER TABLE recommendation_feedback ADD COLUMN helpful BOOLEAN DEFAULT false;
