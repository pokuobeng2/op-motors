
-- ===== Enums =====
create type public.app_role as enum ('super_admin', 'staff');
create type public.app_permission as enum ('add_vehicles','edit_vehicles','manage_photos','update_prices','mark_sold','manage_featured','manage_enquiries');
create type public.vehicle_status as enum ('draft','available','reserved','sold','withdrawn','archived');
create type public.enquiry_status as enum ('new','contacted','follow_up','inspection_booked','won','lost');

-- ===== Shared updated_at helper =====
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ===== Roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- ===== Staff permissions =====
create table public.staff_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission public.app_permission not null,
  created_at timestamptz not null default now(),
  unique (user_id, permission)
);
grant select, insert, delete on public.staff_permissions to authenticated;
grant all on public.staff_permissions to service_role;
alter table public.staff_permissions enable row level security;

-- ===== Access helper functions =====
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_active_member(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = _user_id and p.is_active
  )
$$;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = _user_id and r.role = 'super_admin' and p.is_active
  )
$$;

create or replace function public.has_permission(_user_id uuid, _perm public.app_permission)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin(_user_id)
    or (public.is_active_member(_user_id)
        and exists (select 1 from public.staff_permissions where user_id = _user_id and permission = _perm))
$$;

create or replace function public.owner_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'super_admin')
$$;
grant execute on function public.owner_exists() to anon, authenticated;

-- Profiles policies
create policy "Members view profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_active_member(auth.uid()));
create policy "Super admin updates profiles" on public.profiles for update to authenticated
  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Roles policies
create policy "View own or all as super admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_active_member(auth.uid()));

-- Permissions policies
create policy "View own permissions or as super admin" on public.staff_permissions for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin(auth.uid()));
create policy "Super admin grants permissions" on public.staff_permissions for insert to authenticated
  with check (public.is_super_admin(auth.uid()));
create policy "Super admin revokes permissions" on public.staff_permissions for delete to authenticated
  using (public.is_super_admin(auth.uid()));

-- New auth user -> profile; very first user becomes the owner (super admin)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('ahaban_owner_bootstrap'));
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict (id) do nothing;
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Activity logs =====
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);
grant select on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;
alter table public.activity_logs enable row level security;
create policy "Super admin reads activity" on public.activity_logs for select to authenticated
  using (public.is_super_admin(auth.uid()));

create or replace function public.log_activity(_action text, _entity_type text, _entity_id uuid, _summary text, _details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _name text;
begin
  if _uid is null then return; end if;
  select coalesce(nullif(full_name, ''), email) into _name from public.profiles where id = _uid;
  insert into public.activity_logs (actor_id, actor_name, action, entity_type, entity_id, summary, details)
  values (_uid, _name, _action, _entity_type, _entity_id, _summary, coalesce(_details, '{}'::jsonb));
end $$;
revoke execute on function public.log_activity(text, text, uuid, text, jsonb) from public, anon, authenticated;

-- Staff change logging
create or replace function public.log_profile_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_active is distinct from old.is_active then
    if new.id = auth.uid() and not new.is_active then
      raise exception 'You cannot deactivate your own account';
    end if;
    perform public.log_activity(case when new.is_active then 'staff_reactivated' else 'staff_deactivated' end,
      'staff', new.id, (case when new.is_active then 'Reactivated ' else 'Deactivated ' end) || coalesce(nullif(new.full_name,''), new.email));
  elsif new.full_name is distinct from old.full_name then
    perform public.log_activity('staff_updated', 'staff', new.id, 'Updated staff details for ' || coalesce(nullif(new.full_name,''), new.email));
  end if;
  return new;
end $$;
create trigger profiles_log after update on public.profiles for each row execute function public.log_profile_change();

create or replace function public.log_permission_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare _row public.staff_permissions; _who text;
begin
  _row := coalesce(new, old);
  select coalesce(nullif(full_name,''), email) into _who from public.profiles where id = _row.user_id;
  perform public.log_activity(case when tg_op = 'INSERT' then 'permission_granted' else 'permission_revoked' end,
    'staff', _row.user_id,
    (case when tg_op = 'INSERT' then 'Granted ' else 'Revoked ' end) || replace(_row.permission::text, '_', ' ') || ' for ' || coalesce(_who, 'staff member'));
  return _row;
end $$;
create trigger staff_permissions_log after insert or delete on public.staff_permissions for each row execute function public.log_permission_change();

-- ===== Vehicles =====
create sequence public.vehicle_ref_seq start 1001;
grant usage on sequence public.vehicle_ref_seq to authenticated, service_role;

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('OPM-' || nextval('public.vehicle_ref_seq')::text),
  slug text not null default '' ,
  make text not null,
  model text not null,
  year integer not null,
  trim text,
  price numeric(14,2) not null,
  mileage integer not null,
  engine_capacity text not null,
  fuel_type text not null,
  transmission text not null,
  body_type text not null,
  exterior_colour text not null,
  interior_colour text,
  drivetrain text,
  doors integer,
  condition text not null,
  country_of_import text,
  description text not null,
  features text[] not null default '{}',
  status public.vehicle_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index vehicles_slug_idx on public.vehicles (slug);
create index vehicles_status_idx on public.vehicles (status, published_at desc);
grant select on public.vehicles to anon;
grant select, insert, update, delete on public.vehicles to authenticated;
grant all on public.vehicles to service_role;
alter table public.vehicles enable row level security;

create policy "Public views listed vehicles" on public.vehicles for select to anon, authenticated
  using (status in ('available', 'reserved'));
create policy "Members view all vehicles" on public.vehicles for select to authenticated
  using (public.is_active_member(auth.uid()));
create policy "Permitted members add vehicles" on public.vehicles for insert to authenticated
  with check (public.has_permission(auth.uid(), 'add_vehicles'));
create policy "Permitted members update vehicles" on public.vehicles for update to authenticated
  using (public.is_active_member(auth.uid())) with check (public.is_active_member(auth.uid()));
create policy "Super admin deletes vehicles" on public.vehicles for delete to authenticated
  using (public.is_super_admin(auth.uid()));

-- ===== Vehicle images =====
create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  url text not null,
  storage_path text,
  position integer not null default 0,
  alt text,
  created_at timestamptz not null default now()
);
create index vehicle_images_vehicle_idx on public.vehicle_images (vehicle_id, position);
grant select on public.vehicle_images to anon;
grant select, insert, update, delete on public.vehicle_images to authenticated;
grant all on public.vehicle_images to service_role;
alter table public.vehicle_images enable row level security;

create policy "Public views images of listed vehicles" on public.vehicle_images for select to anon, authenticated
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id and v.status in ('available','reserved')));
create policy "Members view all images" on public.vehicle_images for select to authenticated
  using (public.is_active_member(auth.uid()));
create policy "Permitted members add images" on public.vehicle_images for insert to authenticated
  with check (public.has_permission(auth.uid(), 'manage_photos') or public.has_permission(auth.uid(), 'add_vehicles'));
create policy "Permitted members update images" on public.vehicle_images for update to authenticated
  using (public.has_permission(auth.uid(), 'manage_photos') or public.has_permission(auth.uid(), 'add_vehicles'))
  with check (public.has_permission(auth.uid(), 'manage_photos') or public.has_permission(auth.uid(), 'add_vehicles'));
create policy "Permitted members delete images" on public.vehicle_images for delete to authenticated
  using (public.has_permission(auth.uid(), 'manage_photos') or public.has_permission(auth.uid(), 'add_vehicles'));

-- Vehicle business rules
create or replace function public.vehicle_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if new.slug is null or new.slug = '' then
      new.slug := trim(both '-' from lower(regexp_replace(new.year::text || '-' || new.make || '-' || new.model || '-' || new.reference, '[^a-zA-Z0-9]+', '-', 'g')));
    end if;
    new.created_by := coalesce(new.created_by, _uid);
    new.updated_by := _uid;
    if new.status = 'available' then
      raise exception 'Add a main photograph before publishing this vehicle';
    end if;
    if new.status <> 'available' then new.is_featured := false; end if;
    return new;
  end if;

  -- UPDATE
  new.slug := old.slug;
  new.reference := old.reference;
  if _uid is not null then
    if new.price is distinct from old.price and not public.has_permission(_uid, 'update_prices') then
      raise exception 'You do not have permission to change vehicle prices';
    end if;
    if new.is_featured is distinct from old.is_featured and not public.has_permission(_uid, 'manage_featured') then
      raise exception 'You do not have permission to manage featured vehicles';
    end if;
    if new.status is distinct from old.status then
      if new.status = 'sold' and not public.has_permission(_uid, 'mark_sold') then
        raise exception 'You do not have permission to mark vehicles as sold';
      elsif new.status <> 'sold' and not (public.has_permission(_uid, 'edit_vehicles') or public.has_permission(_uid, 'mark_sold')) then
        raise exception 'You do not have permission to change vehicle status';
      end if;
    end if;
    if (to_jsonb(new) - array['price','status','is_featured','updated_at','updated_by','published_at'])
       is distinct from (to_jsonb(old) - array['price','status','is_featured','updated_at','updated_by','published_at'])
       and not (public.has_permission(_uid, 'edit_vehicles') or (old.created_by = _uid and public.has_permission(_uid, 'add_vehicles'))) then
      raise exception 'You do not have permission to edit vehicle details';
    end if;
  end if;

  if new.status = 'available' and old.status is distinct from 'available' then
    if not exists (select 1 from public.vehicle_images where vehicle_id = new.id) then
      raise exception 'Add a main photograph before publishing this vehicle';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  if new.status <> 'available' then new.is_featured := false; end if;
  new.updated_at := now();
  new.updated_by := _uid;
  return new;
end $$;
create trigger vehicles_before_write before insert or update on public.vehicles
  for each row execute function public.vehicle_before_write();

create or replace function public.vehicle_after_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare _label text;
begin
  if tg_op = 'DELETE' then
    _label := old.year || ' ' || old.make || ' ' || old.model || ' (' || old.reference || ')';
    perform public.log_activity('vehicle_deleted', 'vehicle', old.id, 'Deleted ' || _label);
    return old;
  end if;
  _label := new.year || ' ' || new.make || ' ' || new.model || ' (' || new.reference || ')';
  if tg_op = 'INSERT' then
    perform public.log_activity('vehicle_created', 'vehicle', new.id, 'Added ' || _label);
    return new;
  end if;
  if new.price is distinct from old.price then
    perform public.log_activity('price_changed', 'vehicle', new.id, 'Changed price of ' || _label,
      jsonb_build_object('from', old.price, 'to', new.price));
  end if;
  if new.status is distinct from old.status then
    if new.status = 'available' and old.status = 'draft' then
      perform public.log_activity('vehicle_published', 'vehicle', new.id, 'Published ' || _label);
    else
      perform public.log_activity('status_changed', 'vehicle', new.id, 'Changed status of ' || _label || ' to ' || new.status,
        jsonb_build_object('from', old.status, 'to', new.status));
    end if;
  end if;
  if new.is_featured is distinct from old.is_featured then
    perform public.log_activity('featured_changed', 'vehicle', new.id,
      (case when new.is_featured then 'Featured ' else 'Removed from featured: ' end) || _label);
  end if;
  if (to_jsonb(new) - array['price','status','is_featured','updated_at','updated_by','published_at'])
     is distinct from (to_jsonb(old) - array['price','status','is_featured','updated_at','updated_by','published_at']) then
    perform public.log_activity('vehicle_updated', 'vehicle', new.id, 'Edited ' || _label);
  end if;
  return new;
end $$;
create trigger vehicles_after_write after insert or update or delete on public.vehicles
  for each row execute function public.vehicle_after_write();

-- ===== Enquiries =====
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  contact_number text not null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_label text,
  enquiry_date date not null default current_date,
  notes text,
  status public.enquiry_status not null default 'new',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "Permitted members manage enquiries" on public.enquiries for all to authenticated
  using (public.has_permission(auth.uid(), 'manage_enquiries'))
  with check (public.has_permission(auth.uid(), 'manage_enquiries'));
create trigger enquiries_touch before update on public.enquiries for each row execute function public.touch_updated_at();

-- ===== Website settings =====
create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  dealership_name text not null default 'OP Motors',
  tagline text not null default 'Premium vehicles, honestly presented.',
  phone text not null default '+233 20 000 0000',
  whatsapp text not null default '233200000000',
  email text not null default 'hello@opmotors.com',
  address text not null default 'Spintex Road, Accra, Ghana',
  opening_hours text not null default 'Mon – Sat, 8:00am – 6:00pm',
  about_text text not null default 'OP Motors is a premier Ghanaian dealership offering carefully selected, inspected vehicles with transparent pricing in Ghana cedis.',
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon;
grant select, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Anyone reads settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Super admin updates settings" on public.site_settings for update to authenticated
  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
create trigger site_settings_touch before update on public.site_settings for each row execute function public.touch_updated_at();
insert into public.site_settings (id) values (1);

create or replace function public.log_settings_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.log_activity('settings_updated', 'settings', null, 'Updated website settings');
  return new;
end $$;
create trigger site_settings_log after update on public.site_settings for each row execute function public.log_settings_change();

-- ===== Demo inventory =====
insert into public.vehicles (id, make, model, year, trim, price, mileage, engine_capacity, fuel_type, transmission, body_type, exterior_colour, interior_colour, drivetrain, doors, condition, country_of_import, description, features) values
('11111111-0000-4000-8000-000000000001','Land Rover','Range Rover',2022,'Vogue P530',2450000,18500,'4.4L V8','Petrol','Automatic','SUV','Santorini Black','Ivory Leather','AWD',5,'Foreign Used','United Kingdom','A commanding, beautifully specified Range Rover in Santorini Black. Single owner from new, full dealer service history and inspected by our technicians.', array['Panoramic sunroof','Meridian sound system','Air suspension','360° camera','Massage seats','Adaptive cruise control']),
('11111111-0000-4000-8000-000000000002','Toyota','Land Cruiser',2022,'300 VX',1850000,24000,'3.5L V6 Twin Turbo','Petrol','Automatic','SUV','Pearl White','Black Leather','4WD',5,'Foreign Used','United Arab Emirates','The new-generation Land Cruiser 300 — legendary reliability with modern refinement. Ready for city roads and up-country trips alike.', array['Crawl control','Multi-terrain select','Heated & ventilated seats','JBL audio','Sunroof','Lane keep assist']),
('11111111-0000-4000-8000-000000000003','Lexus','RX 350',2020,'F Sport',780000,41000,'3.5L V6','Petrol','Automatic','SUV','Graphite Grey','Cream Leather','AWD',5,'Foreign Used','USA','Quiet, comfortable and exceptionally well kept. This RX 350 F Sport combines Lexus reliability with a sharp, sporty look.', array['Mark Levinson audio','Head-up display','Blind spot monitor','Power tailgate','Apple CarPlay']),
('11111111-0000-4000-8000-000000000004','Mercedes-Benz','C 300',2019,'AMG Line',520000,52000,'2.0L Turbo','Petrol','Automatic','Sedan','Iridium Silver','Black Leather','RWD',4,'Foreign Used','Germany','An elegant executive sedan with the AMG Line styling pack. Smooth, efficient and loaded with comfort features.', array['AMG body styling','Ambient lighting','Burmester audio','Parking assist','Keyless go']),
('11111111-0000-4000-8000-000000000005','Toyota','Hilux',2021,'Double Cab 2.8 GD-6',495000,38000,'2.8L Diesel','Diesel','Automatic','Pickup','Glacier White','Grey Cloth','4WD',4,'Foreign Used','South Africa','A tough, dependable double-cab Hilux — perfect for business or family. Recently serviced with new tyres.', array['Diff lock','Tow bar','Reverse camera','Cruise control','Bed liner']),
('11111111-0000-4000-8000-000000000006','Hyundai','Tucson',2021,'Limited',365000,29000,'2.5L','Petrol','Automatic','SUV','Intense Blue','Black Leather','FWD',5,'Foreign Used','South Korea','Modern, stylish and practical. This Tucson Limited offers generous space and the latest safety technology.', array['Digital cluster','Wireless charging','Lane follow assist','Heated seats','Smart tailgate']),
('11111111-0000-4000-8000-000000000007','Honda','CR-V',2019,'EX-L',330000,47000,'1.5L Turbo','Petrol','Automatic','SUV','Platinum White','Beige Leather','AWD',5,'Foreign Used','Canada','A spacious, fuel-efficient family SUV with a reputation for reliability. Clean inside and out.', array['Leather seats','Sunroof','Honda Sensing','Power tailgate','Remote start']),
('11111111-0000-4000-8000-000000000008','Toyota','Corolla',2020,'LE',215000,36000,'1.8L','Petrol','Automatic','Sedan','Supersonic Red','Black Cloth','FWD',4,'Foreign Used','USA','Economical and easy to own — the ideal first car or daily commuter. Low mileage and excellent condition.', array['Toyota Safety Sense','Apple CarPlay','Adaptive cruise','LED headlights']),
('11111111-0000-4000-8000-000000000009','Kia','Sportage',2023,'EX',410000,8000,'2.5L','Petrol','Automatic','SUV','Steel Grey','Black Leather','AWD',5,'Brand New','South Korea','Draft listing — photographs to follow.', array['Panoramic display','Wireless CarPlay']);

insert into public.vehicle_images (vehicle_id, url, position, alt) values
('11111111-0000-4000-8000-000000000001','/images/cars/range-rover.jpg',0,'Range Rover Vogue side profile'),
('11111111-0000-4000-8000-000000000001','/images/cars/interior-luxury.jpg',1,'Range Rover cabin with ivory leather'),
('11111111-0000-4000-8000-000000000002','/images/cars/land-cruiser.jpg',0,'Toyota Land Cruiser 300 front three-quarter'),
('11111111-0000-4000-8000-000000000003','/images/cars/lexus-rx.jpg',0,'Lexus RX 350 F Sport front three-quarter'),
('11111111-0000-4000-8000-000000000003','/images/cars/interior-luxury.jpg',1,'Lexus RX cream leather interior'),
('11111111-0000-4000-8000-000000000004','/images/cars/mercedes-c-class.jpg',0,'Mercedes-Benz C 300 front three-quarter'),
('11111111-0000-4000-8000-000000000005','/images/cars/toyota-hilux.jpg',0,'Toyota Hilux double cab front three-quarter'),
('11111111-0000-4000-8000-000000000006','/images/cars/hyundai-tucson.jpg',0,'Hyundai Tucson front three-quarter'),
('11111111-0000-4000-8000-000000000007','/images/cars/honda-crv.jpg',0,'Honda CR-V front three-quarter'),
('11111111-0000-4000-8000-000000000008','/images/cars/toyota-corolla.jpg',0,'Toyota Corolla front three-quarter');

update public.vehicles set status = 'available', published_at = now() - interval '20 days' where id = '11111111-0000-4000-8000-000000000004';
update public.vehicles set status = 'available', published_at = now() - interval '16 days' where id = '11111111-0000-4000-8000-000000000007';
update public.vehicles set status = 'available', published_at = now() - interval '12 days' where id = '11111111-0000-4000-8000-000000000003';
update public.vehicles set status = 'available', published_at = now() - interval '9 days' where id = '11111111-0000-4000-8000-000000000008';
update public.vehicles set status = 'available', published_at = now() - interval '6 days' where id = '11111111-0000-4000-8000-000000000002';
update public.vehicles set status = 'available', published_at = now() - interval '4 days' where id = '11111111-0000-4000-8000-000000000006';
update public.vehicles set status = 'available', published_at = now() - interval '2 days' where id = '11111111-0000-4000-8000-000000000001';
update public.vehicles set status = 'available', published_at = now() - interval '14 days' where id = '11111111-0000-4000-8000-000000000005';
update public.vehicles set status = 'reserved' where id = '11111111-0000-4000-8000-000000000005';
update public.vehicles set is_featured = true where id in ('11111111-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000003');
