-- Insert sample analytics events for testing
INSERT INTO user_analytics (id, user_id, session_id, event_type, event_data, timestamp, user_agent, ip_address)
VALUES
  ('a1', 'bd7e40b3-e207-439e-9575-f25774dbf6d5', 'sess1', 'page_view', '{"page": "dashboard"}', CURRENT_TIMESTAMP, 'Mozilla/5.0', '127.0.0.1'),
  ('a2', 'bd7e40b3-e207-439e-9575-f25774dbf6d5', 'sess1', 'click', '{"button": "generate"}', CURRENT_TIMESTAMP, 'Mozilla/5.0', '127.0.0.1'),
  ('a3', 'bd7e40b3-e207-439e-9575-f25774dbf6d5', 'sess1', 'search', '{"query": "gift ideas"}', CURRENT_TIMESTAMP, 'Mozilla/5.0', '127.0.0.1'),
  ('a4', 'bd7e40b3-e207-439e-9575-f25774dbf6d5', 'sess1', 'budget_change', '{"oldBudget": 50, "newBudget": 100, "currency": "USD"}', CURRENT_TIMESTAMP, 'Mozilla/5.0', '127.0.0.1');
