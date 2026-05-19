-- Insert test donations for the current user to verify stats endpoints work
-- First, get your user ID from the frontend (check localStorage 'userId')
-- Replace <YOUR_USER_ID> with your actual UUID

-- Example device (if one doesn't exist)
INSERT INTO devices (serial_number, api_key_hash, status)
VALUES ('TEST-DEVICE-001', 'test-hash', 'ACTIVE')
ON CONFLICT (serial_number) DO NOTHING;

-- Example location
INSERT INTO locations (name, address, city)
VALUES ('Test Kiosk', '123 Test St', 'Test City')
ON CONFLICT DO NOTHING;

-- Insert test donations for THIS MONTH
INSERT INTO donations (user_id, device_id, location_id, weight_grams, impact_kwh, impact_co2_kg, timestamp)
SELECT 
  '<YOUR_USER_ID>'::uuid,
  (SELECT id FROM devices LIMIT 1),
  (SELECT id FROM locations LIMIT 1),
  weight_grams,
  impact_kwh,
  impact_co2_kg,
  NOW() - (interval '1 day' * (row_number() OVER () - 1))
FROM (
  VALUES
    (500::numeric, 2.5::numeric, 5.2::numeric),
    (750::numeric, 3.75::numeric, 7.8::numeric),
    (1000::numeric, 5.0::numeric, 10.4::numeric)
) AS data(weight_grams, impact_kwh, impact_co2_kg);

-- Verify stats updated
SELECT * FROM user_stats WHERE user_id = '<YOUR_USER_ID>'::uuid;
SELECT * FROM donations WHERE user_id = '<YOUR_USER_ID>'::uuid ORDER BY created_at DESC;
