-- 1. Create Missing Tables

-- Managed Top Players Table
CREATE TABLE IF NOT EXISTS public.managed_top_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    runs INTEGER DEFAULT 0,
    wickets INTEGER DEFAULT 0,
    avatar_url TEXT,
    team_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wall of Fame Items Table
CREATE TABLE IF NOT EXISTS public.wall_of_frame_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    achievement_type TEXT NOT NULL,
    year TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    description TEXT,
    key_stats TEXT,
    venue TEXT,
    highlight_badge TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Performances Table
CREATE TABLE IF NOT EXISTS public.match_performances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    tournament_name TEXT NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    runs_scored INTEGER DEFAULT 0,
    balls_faced INTEGER DEFAULT 0,
    wickets_taken INTEGER DEFAULT 0,
    overs_bowled NUMERIC DEFAULT 0.0,
    runs_conceded INTEGER DEFAULT 0,
    is_out BOOLEAN DEFAULT TRUE,
    match_result TEXT CHECK (match_result IN ('won', 'lost')),
    team_name TEXT
);

-- 2. Enable Row Level Security (RLS) on All Tables

ALTER TABLE IF EXISTS public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.managed_top_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wall_of_frame_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_performances ENABLE ROW LEVEL SECURITY;

-- 3. Drop Existing Policies to Prevent Conflicts
DO \$\$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END\$\$;

-- 4. Create RLS Policies

-- Helper check for admin role
-- We will use direct subquery checks to keep policies simple and performant.

-- Memberships Policies
CREATE POLICY "Allow public read access to memberships" ON public.memberships
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write memberships" ON public.memberships
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- User Memberships Policies
CREATE POLICY "Allow users to read own memberships" ON public.user_memberships
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admins to write user memberships" ON public.user_memberships
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tournaments Policies
CREATE POLICY "Allow public read access to tournaments" ON public.tournaments
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write tournaments" ON public.tournaments
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Teams Policies
CREATE POLICY "Allow public read access to teams" ON public.teams
    FOR SELECT USING (true);
CREATE POLICY "Allow captains to write teams" ON public.teams
    FOR ALL USING (captain_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Team Members Policies
CREATE POLICY "Allow public read access to team members" ON public.team_members
    FOR SELECT USING (true);
CREATE POLICY "Allow captains to write team members" ON public.team_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_id AND teams.captain_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Registrations Policies
CREATE POLICY "Allow captains to view registrations" ON public.registrations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_id AND teams.captain_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Allow captains to insert registrations" ON public.registrations
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_id AND teams.captain_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Allow admins to full CRUD registrations" ON public.registrations
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Fixtures Policies
CREATE POLICY "Allow public read access to fixtures" ON public.fixtures
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write fixtures" ON public.fixtures
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Matches Policies
CREATE POLICY "Allow public read access to matches" ON public.matches
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write matches" ON public.matches
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Match Scores Policies
CREATE POLICY "Allow public read access to match scores" ON public.match_scores
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write match scores" ON public.match_scores
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Player Stats Policies
CREATE POLICY "Allow public read access to player stats" ON public.player_stats
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write player stats" ON public.player_stats
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Badges Policies
CREATE POLICY "Allow public read access to badges" ON public.badges
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write badges" ON public.badges
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- User Badges Policies
CREATE POLICY "Allow public read access to user badges" ON public.user_badges
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write user badges" ON public.user_badges
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Certificates Policies
CREATE POLICY "Allow users to read own certificates" ON public.certificates
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admins to write certificates" ON public.certificates
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Payments Policies
CREATE POLICY "Allow users to read own payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow users to insert own payments" ON public.payments
    FOR INSERT WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admins to write payments" ON public.payments
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notifications Policies
CREATE POLICY "Allow users to read own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow users to update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow system or admin to insert/delete notifications" ON public.notifications
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- QR Codes Policies
CREATE POLICY "Allow captains to read QR codes" ON public.qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM public.registrations 
            JOIN public.teams ON registrations.team_id = teams.id 
            WHERE registrations.id = registration_id AND teams.captain_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Allow admins to write QR codes" ON public.qr_codes
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Analytics Policies
CREATE POLICY "Allow admins to view analytics" ON public.analytics
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Allow admins to write analytics" ON public.analytics
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Managed Top Players Policies
CREATE POLICY "Allow public read access to managed top players" ON public.managed_top_players
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write managed top players" ON public.managed_top_players
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Wall of Fame Items Policies
CREATE POLICY "Allow public read access to wall of frame items" ON public.wall_of_frame_items
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write wall of frame items" ON public.wall_of_frame_items
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Match Performances Policies
CREATE POLICY "Allow public read access to match performances" ON public.match_performances
    FOR SELECT USING (true);
CREATE POLICY "Allow admins to write match performances" ON public.match_performances
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add original profile policy back if deleted by the cleanup script
CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Auto Confirm Sign-up Emails Trigger
-- Automatically confirms the email of any new user signing up, bypassing verification.
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_email();

