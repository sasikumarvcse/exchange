-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  gpk_id text unique not null,
  name text not null,
  email text unique not null,
  phone text,
  referral_code text unique not null,
  sponsor_id uuid references profiles(id) on delete set null,
  wallet_address text,
  transaction_password text,
  current_package text default 'none',
  is_active boolean default true,
  is_admin boolean default false,
  join_date timestamp default now(),
  total_earnings numeric default 0,
  wallet_balance numeric default 0,
  team_size integer default 0,
  direct_referrals integer default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Admin configuration table
create table if not exists admin_config (
  id serial primary key,
  direct_referral_percent numeric not null default 25,
  level_income_percents numeric[] default array[1,1,1,1,1,1,1,2,3,3],
  global_royalty_percent numeric default 15,
  global_royalty_cycle_days integer default 90,
  deposit_wallet_address text,
  minimum_withdrawal numeric default 100,
  minimum_deposit numeric default 100,
  withdrawal_fee_percent numeric default 5,
  deposit_fee_percent numeric default 2,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Seed default admin config
insert into admin_config (direct_referral_percent) values (25)
on conflict do nothing;

-- Packages table
create table if not exists packages (
  id text primary key,
  name text not null,
  price numeric not null,
  order_index integer not null,
  global_royalty_eligible boolean default false,
  global_royalty_share_percent numeric default 0,
  description text,
  benefits text[],
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Insert GrowwPark packages
insert into packages (id, name, price, order_index, global_royalty_eligible, global_royalty_share_percent, description, benefits, is_active) values
('starter', 'Starter', 2500, 1, false, 0, 'Entry level package to get started', array['Basic support', 'Access to community'], true),
('silver', 'Silver', 9500, 2, true, 2, 'Silver package with global royalty eligibility', array['Priority support', 'Training materials', '2% Global royalty share'], true),
('gold', 'Gold', 25000, 3, true, 3, 'Gold package with enhanced benefits', array['Premium support', 'Advanced training', '3% Global royalty share'], true),
('platinum', 'Platinum', 95000, 4, true, 4, 'Platinum package for serious builders', array['VIP support', 'Exclusive events', '4% Global royalty share'], true),
('diamond', 'Diamond', 250000, 5, true, 6, 'Ultimate Diamond package', array['Personal mentor', 'Diamond events', '6% Global royalty share'], true)
on conflict (id) do update set
name = excluded.name,
price = excluded.price,
order_index = excluded.order_index,
global_royalty_eligible = excluded.global_royalty_eligible,
global_royalty_share_percent = excluded.global_royalty_share_percent,
description = excluded.description,
benefits = excluded.benefits,
updated_at = now();

-- User packages table (track user's package purchases)
create table if not exists user_packages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  package_id text references packages(id),
  purchase_date timestamp default now(),
  amount_paid numeric not null,
  is_active boolean default true,
  created_at timestamp default now(),
  unique(user_id, package_id)
);

-- Incomes table
create table if not exists incomes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  from_user_id uuid references profiles(id) on delete set null,
  amount numeric not null,
  type text check (type in ('direct', 'level', 'global_royalty')),
  level integer,
  package_id text references packages(id),
  description text,
  date timestamp default now(),
  created_at timestamp default now()
);

-- Referrals table
create table if not exists referrals (
  referrer_id uuid references profiles(id) on delete cascade,
  referred_id uuid references profiles(id) on delete cascade,
  referral_date timestamp default now(),
  primary key (referrer_id, referred_id)
);

-- Level qualifications table (track which levels users have qualified for)
create table if not exists level_qualifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  level integer not null,
  qualified_at timestamp default now(),
  team_size_at_qualification integer default 0,
  unique(user_id, level)
);

-- Global royalty distributions table
create table if not exists global_royalty_distributions (
  id uuid default uuid_generate_v4() primary key,
  cycle_start_date timestamp not null,
  cycle_end_date timestamp not null,
  total_pool_amount numeric not null,
  total_eligible_users integer default 0,
  distributed_amount numeric default 0,
  status text default 'pending' check (status in ('pending', 'distributed', 'completed')),
  created_at timestamp default now()
);

-- Global royalty payments table
create table if not exists global_royalty_payments (
  id uuid default uuid_generate_v4() primary key,
  distribution_id uuid references global_royalty_distributions(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  package_id text references packages(id),
  share_percent numeric not null,
  amount numeric not null,
  created_at timestamp default now()
);

-- Transactions table
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text check (type in ('deposit', 'withdrawal', 'package_purchase', 'income_credit')),
  amount numeric not null,
  tx_hash text,
  wallet_address text,
  status text default 'pending' check (status in ('pending', 'verified', 'rejected', 'completed')),
  admin_fee numeric default 0,
  reference_id text,
  package_id text references packages(id),
  description text,
  date timestamp default now(),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create indexes for better performance
create index if not exists idx_profiles_sponsor_id on profiles(sponsor_id);
create index if not exists idx_profiles_referral_code on profiles(referral_code);
create index if not exists idx_incomes_user_id on incomes(user_id);
create index if not exists idx_incomes_from_user_id on incomes(from_user_id);
create index if not exists idx_incomes_type on incomes(type);
create index if not exists idx_transactions_user_id on transactions(user_id);
create index if not exists idx_transactions_type on transactions(type);
create index if not exists idx_user_packages_user_id on user_packages(user_id);
create index if not exists idx_referrals_referrer_id on referrals(referrer_id);

-- RLS (Row Level Security) policies
alter table profiles enable row level security;
alter table incomes enable row level security;
alter table transactions enable row level security;
alter table user_packages enable row level security;
alter table referrals enable row level security;
alter table level_qualifications enable row level security;
alter table global_royalty_payments enable row level security;

-- Profiles policies
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Users can view referral tree" on profiles for select using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and p.is_admin = true
  ) or 
  sponsor_id = auth.uid() or 
  id in (
    select referred_id from referrals where referrer_id = auth.uid()
  )
);

-- Incomes policies
create policy "Users can view their own incomes" on incomes for select using (user_id = auth.uid());

-- Transactions policies
create policy "Users can view their own transactions" on transactions for select using (user_id = auth.uid());
create policy "Users can insert their own transactions" on transactions for insert with check (user_id = auth.uid());

-- User packages policies
create policy "Users can view their own packages" on user_packages for select using (user_id = auth.uid());
create policy "Users can insert their own packages" on user_packages for insert with check (user_id = auth.uid());

-- Functions for MLM calculations
create or replace function get_user_level_qualification(user_id uuid)
returns integer as $$
declare
  direct_count integer;
  max_level integer := 0;
begin
  -- Get direct referral count
  select count(*) into direct_count
  from referrals
  where referrer_id = user_id;
  
  -- Calculate qualification level based on team size
  if direct_count >= 5 then
    -- Check each level requirement
    for i in 1..10 loop
      declare
        required_team_size integer := power(5, i);
        actual_team_size integer;
      begin
        -- Calculate actual team size at this level (simplified)
        select count(*) into actual_team_size
        from profiles
        where sponsor_id = user_id;
        
        if actual_team_size >= required_team_size then
          max_level := i;
        else
          exit;
        end if;
      end;
    end loop;
  end if;
  
  return max_level;
end;
$$ language plpgsql;

-- Function to calculate and distribute level income
create or replace function distribute_level_income(buyer_id uuid, package_price numeric)
returns void as $$
declare
  current_user_id uuid := buyer_id;
  level_count integer := 1;
  level_percents numeric[] := array[1,1,1,1,1,1,1,2,3,3];
  level_percent numeric;
  income_amount numeric;
begin
  -- Traverse up the sponsor tree for 10 levels
  while current_user_id is not null and level_count <= 10 loop
    -- Get the sponsor
    select sponsor_id into current_user_id
    from profiles
    where id = current_user_id;
    
    if current_user_id is not null then
      -- Check if sponsor is qualified for this level
      if get_user_level_qualification(current_user_id) >= level_count then
        level_percent := level_percents[level_count];
        income_amount := (package_price * level_percent / 100);
        
        -- Credit level income
        insert into incomes (user_id, from_user_id, amount, type, level, package_id, description)
        values (
          current_user_id,
          buyer_id,
          income_amount,
          'level',
          level_count,
          (select package_id from user_packages where user_id = buyer_id order by created_at desc limit 1),
          format('Level %s income from %s', level_count, (select name from profiles where id = buyer_id))
        );
        
        -- Update user's total earnings and wallet balance
        update profiles
        set total_earnings = total_earnings + income_amount,
            wallet_balance = wallet_balance + income_amount,
            updated_at = now()
        where id = current_user_id;
      end if;
      
      level_count := level_count + 1;
    end if;
  end loop;
end;
$$ language plpgsql;

-- Function to handle package purchase and income distribution
create or replace function handle_package_purchase(user_id uuid, package_id text, amount_paid numeric)
returns void as $$
declare
  sponsor_id uuid;
  direct_income_amount numeric;
  config_direct_percent numeric;
begin
  -- Get admin config
  select direct_referral_percent into config_direct_percent
  from admin_config
  limit 1;
  
  -- Get user's sponsor
  select p.sponsor_id into sponsor_id
  from profiles p
  where p.id = user_id;
  
  -- Record package purchase
  insert into user_packages (user_id, package_id, amount_paid)
  values (user_id, package_id, amount_paid)
  on conflict (user_id, package_id) do update set
    amount_paid = excluded.amount_paid,
    created_at = now();
  
  -- Update user's current package
  update profiles
  set current_package = package_id,
      updated_at = now()
  where id = user_id;
  
  -- Distribute direct referral income (only for first package purchase)
  if sponsor_id is not null then
    -- Check if this is the first package purchase by this user
    if not exists (
      select 1 from incomes 
      where user_id = sponsor_id 
      and from_user_id = user_id 
      and type = 'direct'
    ) then
      direct_income_amount := (amount_paid * config_direct_percent / 100);
      
      -- Credit direct referral income
      insert into incomes (user_id, from_user_id, amount, type, package_id, description)
      values (
        sponsor_id,
        user_id,
        direct_income_amount,
        'direct',
        package_id,
        format('Direct referral income from %s', (select name from profiles where id = user_id))
      );
      
      -- Update sponsor's earnings
      update profiles
      set total_earnings = total_earnings + direct_income_amount,
          wallet_balance = wallet_balance + direct_income_amount,
          updated_at = now()
      where id = sponsor_id;
    end if;
  end if;
  
  -- Distribute level income
  perform distribute_level_income(user_id, amount_paid);
  
  -- Record transaction
  insert into transactions (user_id, type, amount, package_id, status, description)
  values (
    user_id,
    'package_purchase',
    amount_paid,
    package_id,
    'completed',
    format('Purchase of %s package', (select name from packages where id = package_id))
  );
end;
$$ language plpgsql;

-- Trigger to update team size when referrals are added
create or replace function update_team_sizes()
returns trigger as $$
begin
  -- Update direct referrals count for the referrer
  update profiles
  set direct_referrals = direct_referrals + 1,
      updated_at = now()
  where id = new.referrer_id;
  
  -- Update team size for all uplines
  with recursive upline_tree as (
    select sponsor_id as user_id, 1 as level
    from profiles
    where id = new.referred_id
    
    union all
    
    select p.sponsor_id, ut.level + 1
    from profiles p
    join upline_tree ut on p.id = ut.user_id
    where p.sponsor_id is not null and ut.level < 20
  )
  update profiles
  set team_size = team_size + 1,
      updated_at = now()
  where id in (select user_id from upline_tree where user_id is not null);
  
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_team_sizes
  after insert on referrals
  for each row
  execute function update_team_sizes();

-- Function to generate unique referral code
create or replace function generate_referral_code()
returns text as $$
declare
  code text;
  exists_check boolean;
begin
  loop
    code := 'GPK' || lpad(floor(random() * 999999)::text, 6, '0');
    
    select exists(select 1 from profiles where referral_code = code) into exists_check;
    
    if not exists_check then
      return code;
    end if;
  end loop;
end;
$$ language plpgsql;

-- Function to generate unique GPK ID
create or replace function generate_gpk_id()
returns text as $$
declare
  gpk_id text;
  exists_check boolean;
begin
  loop
    gpk_id := 'GPK' || lpad(floor(random() * 9999999)::text, 7, '0');
    
    select exists(select 1 from profiles where gpk_id = gpk_id) into exists_check;
    
    if not exists_check then
      return gpk_id;
    end if;
  end loop;
end;
$$ language plpgsql;