-- Migration: Drop unused action column from user_analytics table
ALTER TABLE user_analytics DROP COLUMN IF EXISTS action;
