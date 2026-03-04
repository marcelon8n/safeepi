-- Add 'owner' and 'editor' values to the user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'editor';

-- Update the get_my_role function to handle the new roles (no change needed, it already returns user_role)

-- Update the Constants in types will happen automatically on next sync
