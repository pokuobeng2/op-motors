-- Migration: Rebrand to OP Motors & update stock ID sequence prefix
alter table public.vehicles 
  alter column reference set default ('OPM-' || nextval('public.vehicle_ref_seq')::text);

-- Update existing vehicle stock IDs and slugs from AHB- to OPM-
update public.vehicles
set 
  reference = replace(reference, 'AHB-', 'OPM-'),
  slug = replace(slug, 'ahb-', 'opm-')
where reference like 'AHB-%';

-- Update site settings default & existing rows
update public.site_settings
set 
  dealership_name = 'OP Motors',
  email = replace(email, 'ahabancars.com', 'opmotors.com'),
  about_text = replace(about_text, 'Ahaban Cars', 'OP Motors')
where id = 1;
