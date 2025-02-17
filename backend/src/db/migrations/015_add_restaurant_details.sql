ALTER TABLE restaurants
ADD COLUMN contact JSONB NOT NULL DEFAULT '{
  "email": "",
  "phone": "",
  "website": null
}',
ADD COLUMN location JSONB NOT NULL DEFAULT '{
  "address": "",
  "city": "",
  "postal_code": ""
}',
ADD COLUMN operating_hours JSONB NOT NULL DEFAULT '{
  "monday": {"open": "09:00", "close": "22:00"},
  "tuesday": {"open": "09:00", "close": "22:00"},
  "wednesday": {"open": "09:00", "close": "22:00"},
  "thursday": {"open": "09:00", "close": "22:00"},
  "friday": {"open": "09:00", "close": "22:00"},
  "saturday": {"open": "09:00", "close": "22:00"},
  "sunday": {"open": "09:00", "close": "22:00"}
}';

-- Add indexes for better query performance on JSONB fields
CREATE INDEX idx_restaurants_contact ON restaurants USING gin (contact);
CREATE INDEX idx_restaurants_location ON restaurants USING gin (location);
CREATE INDEX idx_restaurants_operating_hours ON restaurants USING gin (operating_hours);
