-- Migration: Add 'purchased' column to recommendation_feedback table
ALTER TABLE recommendation_feedback ADD COLUMN purchased BOOLEAN DEFAULT false;
