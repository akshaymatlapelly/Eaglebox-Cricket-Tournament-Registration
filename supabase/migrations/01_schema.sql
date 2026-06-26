-- SUPABASE DATABASE SCHEMA FOR CRICKETHUB PRO

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'player' CHECK (role IN ('player', 'captain', 'admin', 'venue_owner')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Memberships Table (Static Plans)
CREATE TABLE IF NOT EXISTS public.memberships (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    discount_pct NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    features TEXT[]
);

-- Insert Memberships seed
INSERT INTO public.memberships (id, name, discount_pct, price, features) VALUES
('silver', 'Silver Club', 5.0, 499.00, ARRAY['5% discount on registrations', 'Priority access to matches', 'Standard support']),
('gold', 'Gold Club', 10.0, 999.00, ARRAY['10% discount on registrations', 'Priority registration window', 'Exclusive digital badge', 'Free entry to match screenings']),
('platinum', 'Platinum Club', 20.0, 1999.00, ARRAY['20% discount on registrations', 'Express QR check-in lanes', 'Platinum profile badge', 'Free customized profile certificates', 'VIP seat allocations'])
ON CONFLICT (id) DO NOTHING;

-- 3. User Memberships
CREATE TABLE IF NOT EXISTS public.user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    membership_id TEXT NOT NULL REFERENCES public.memberships(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 4. Tournaments Table
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    banner_url TEXT,
    venue TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    prize_pool NUMERIC NOT NULL,
    entry_fee NUMERIC NOT NULL,
    team_limit INTEGER NOT NULL,
    rules TEXT,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'archived'))
);

-- Insert sample tournaments
INSERT INTO public.tournaments (id, name, description, banner_url, venue, start_date, end_date, prize_pool, entry_fee, team_limit, rules, status) VALUES
('a1000000-0000-0000-0000-000000000001', 'IPL Cricket Cup 2026', 'Experience the ultimate domestic cricket challenge with high intensity matches under floodlights.', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800', 'Wankhede Stadium, Mumbai', '2026-07-15', '2026-07-30', 250000.00, 2000.00, 16, 'Standard T20 Rules. Proper cricket kits required. Max 15 players per team.', 'upcoming'),
('a1000000-0000-0000-0000-000000000002', 'National Championship Trophy', 'The ultimate tournament where states battle to win the national bragging rights.', 'https://images.unsplash.com/photo-1540747737956-37872404efda?q=80&w=800', 'Chinnaswamy Stadium, Bangalore', '2026-08-01', '2026-08-20', 500000.00, 4500.00, 12, '50 Overs structure. ICC Rules apply. Professional umpires will officiate.', 'upcoming'),
('a1000000-0000-0000-0000-000000000003', 'Street Smash T10 Blast', 'Short, lightning fast T10 matches. High entertainment and maximum boundaries.', 'https://images.unsplash.com/photo-1593341606579-7f97d27b0c49?q=80&w=800', 'Hub Arena Turf, Delhi', '2026-06-25', '2026-06-28', 75000.00, 800.00, 24, 'T10 Rules. 5-overs bowling limits. 3 fieldsmen allowed outside circle.', 'upcoming')
ON CONFLICT (id) DO NOTHING;

-- 5. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    captain_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
);

-- 6. Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'player' CHECK (role IN ('player', 'captain', 'batsman', 'bowler', 'all_rounder', 'wicket_keeper'))
);

-- 7. Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    payment_id TEXT,
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

-- 8. Fixtures Table
CREATE TABLE IF NOT EXISTS public.fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    team1_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    team2_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed'))
);

-- 9. Matches Table (Detailed Live Score state)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID REFERENCES public.fixtures(id) ON DELETE CASCADE,
    toss_won_by UUID REFERENCES public.teams(id),
    toss_decision TEXT CHECK (toss_decision IN ('bat', 'bowl')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'abandoned')),
    winner_id UUID REFERENCES public.teams(id),
    team1_runs INTEGER DEFAULT 0,
    team1_wickets INTEGER DEFAULT 0,
    team1_overs NUMERIC DEFAULT 0.0,
    team2_runs INTEGER DEFAULT 0,
    team2_wickets INTEGER DEFAULT 0,
    team2_overs NUMERIC DEFAULT 0.0,
    current_batsman1_id UUID REFERENCES public.profiles(id),
    current_batsman2_id UUID REFERENCES public.profiles(id),
    current_bowler_id UUID REFERENCES public.profiles(id),
    balls_bowled INTEGER DEFAULT 0,
    partnership_runs INTEGER DEFAULT 0
);

-- 10. Match Scores
CREATE TABLE IF NOT EXISTS public.match_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    runs INTEGER NOT NULL DEFAULT 0,
    wickets INTEGER NOT NULL DEFAULT 0,
    overs NUMERIC NOT NULL DEFAULT 0.0
);

-- 11. Player Stats Table
CREATE TABLE IF NOT EXISTS public.player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    matches_played INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    wickets INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    best_bowling_figures TEXT DEFAULT '0/0',
    batting_average NUMERIC DEFAULT 0.0,
    bowling_economy NUMERIC DEFAULT 0.0,
    win_percentage NUMERIC DEFAULT 0.0
);

-- 12. Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirement_description TEXT NOT NULL,
    threshold INTEGER NOT NULL
);

-- Insert Badges seed
INSERT INTO public.badges (id, name, icon, requirement_description, threshold) VALUES
('century_king', 'Century King', '🏅', 'Scores 100 runs or more in career', 100),
('power_hitter', 'Power Hitter', '⚡', 'Scores 500 total career runs', 500),
('hattrick_hero', 'Hat-Trick Hero', '🎩', 'Takes 3 wickets in a single match', 3),
('bowling_star', 'Wicket Machine', '🎯', 'Takes 10 total career wickets', 10),
('mvp', 'MVP', '💎', 'Earns MVP player rating in a match', 1),
('champion', 'Champion', '🏆', 'Wins a tournament final match', 1),
('consistent_performer', 'Consistent Star', '🔥', 'Maintains win rate above 60% over 5 matches', 60)
ON CONFLICT (id) DO NOTHING;

-- 13. User Badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES public.badges(id),
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 14. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('winner', 'runner_up', 'mvp', 'participation')),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. QR Codes Table
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    code_string TEXT NOT NULL UNIQUE,
    qr_image_url TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Analytics Table
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    recorded_at DATE DEFAULT CURRENT_DATE
);

-- Enable Row Level Security (RLS) on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create triggers or triggers helper to automatically update profiles upon auth signup
-- Function to handle new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New Cricketer'),
    new.email,
    'player'
  );
  
  INSERT INTO public.player_stats (player_id, matches_played, runs, wickets)
  VALUES (new.id, 0, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to activate the function on insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
