-- Add 'private' value to event_visibility enum
ALTER TYPE public.event_visibility ADD VALUE IF NOT EXISTS 'private';