'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Data types interfaces
export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  role: 'player' | 'captain' | 'admin' | 'venue_owner';
  avatar_url?: string;
  created_at: string;
}

export interface Membership {
  id: string;
  name: string;
  discount_pct: number;
  price: number;
  features: string[];
}

export interface UserMembership {
  id: string;
  user_id: string;
  membership_id: string;
  status: 'active' | 'expired' | 'pending';
  created_at: string;
  expires_at?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  banner_url: string;
  venue: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  entry_fee: number;
  team_limit: number;
  rules: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'archived';
  players_per_team: number;
}

export interface Team {
  id: string;
  name: string;
  logo_url?: string;
  captain_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
}

export interface TeamMember {
  id: string;
  team_id: string;
  player_name: string;
  email?: string;
  phone?: string;
  role: 'player' | 'captain' | 'batsman' | 'bowler' | 'all_rounder' | 'wicket_keeper';
}

export interface Registration {
  id: string;
  tournament_id: string;
  team_id: string;
  status: 'pending' | 'confirmed' | 'rejected';
  payment_id?: string;
  qr_code_url?: string;
  created_at: string;
}

export interface Fixture {
  id: string;
  tournament_id: string;
  round: number;
  team1_id: string;
  team2_id: string;
  match_date: string;
  status: 'scheduled' | 'ongoing' | 'completed';
}

export interface MatchScoreState {
  id: string;
  fixture_id?: string;
  tournament_id: string;
  toss_won_by?: string;
  toss_decision?: 'bat' | 'bowl';
  status: 'scheduled' | 'ongoing' | 'completed' | 'abandoned';
  winner_id?: string;
  team1_id: string;
  team2_id: string;
  team1_runs: number;
  team1_wickets: number;
  team1_overs: number;
  team2_runs: number;
  team2_wickets: number;
  team2_overs: number;
  current_batsman1?: string;
  current_batsman1_runs?: number;
  current_batsman2?: string;
  current_batsman2_runs?: number;
  current_bowler?: string;
  current_bowler_wickets?: number;
  current_bowler_runs?: number;
  balls_bowled: number;
  partnership_runs: number;
  target_runs?: number;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  matches_played: number;
  runs: number;
  wickets: number;
  highest_score: number;
  best_bowling_figures: string;
  batting_average: number;
  bowling_economy: number;
  win_percentage: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  requirement_description: string;
  threshold: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  tournament_id: string;
  type: 'winner' | 'runner_up' | 'mvp' | 'participation';
  pdf_url?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface QRCodeData {
  id: string;
  registration_id: string;
  code_string: string;
  qr_image_url?: string;
  scanned_at?: string;
  created_at: string;
}

export interface ManagedTopPlayer {
  id: string;
  name: string;
  runs: number;
  wickets: number;
  avatar_url?: string;
  team_name?: string;
  created_at: string;
}

export interface WallOfFrameItem {
  id: string;
  title: string;
  achievement_type: string;
  year: string;
  subject_name: string; // Team or Player Name
  description: string;
  key_stats?: string;
  venue?: string;
  highlight_badge?: string;
  image_url?: string;
  created_at: string;
}

export interface MatchPerformance {
  id: string;
  player_id: string;
  player_name: string;
  tournament_name: string;
  match_date: string;
  runs_scored: number;
  balls_faced: number;
  wickets_taken: number;
  overs_bowled: number;
  runs_conceded: number;
  is_out: boolean;
  match_result: 'won' | 'lost';
  team_name: string;
}

// Context state interface
interface DatabaseContextType {
  profiles: Profile[];
  tournaments: Tournament[];
  teams: Team[];
  teamMembers: TeamMember[];
  registrations: Registration[];
  fixtures: Fixture[];
  matches: MatchScoreState[];
  playerStats: PlayerStats[];
  badges: Badge[];
  userBadges: UserBadge[];
  certificates: Certificate[];
  payments: Payment[];
  notifications: Notification[];
  qrCodes: QRCodeData[];
  memberships: Membership[];
  userMemberships: UserMembership[];
  managedTopPlayers: ManagedTopPlayer[];
  wallOfFrameItems: WallOfFrameItem[];
  matchPerformances: MatchPerformance[];
  
  // Database mutations & APIs
  addMatchPerformance: (performance: Omit<MatchPerformance, 'id'>) => Promise<void>;
  addManagedTopPlayer: (player: Omit<ManagedTopPlayer, 'id' | 'created_at'>) => Promise<ManagedTopPlayer>;
  editManagedTopPlayer: (id: string, player: Partial<ManagedTopPlayer>) => Promise<boolean>;
  deleteManagedTopPlayer: (id: string) => Promise<boolean>;
  addWallOfFrameItem: (item: Omit<WallOfFrameItem, 'id' | 'created_at'>) => Promise<WallOfFrameItem>;
  editWallOfFrameItem: (id: string, item: Partial<WallOfFrameItem>) => Promise<boolean>;
  deleteWallOfFrameItem: (id: string) => Promise<boolean>;
  registerTeam: (
    tournamentId: string, 
    teamName: string, 
    captainName: string, 
    captainEmail: string, 
    members: Array<string | { name: string; email?: string; phone?: string; role?: string }>,
    entryFeePaid: number
  ) => Promise<{ success: boolean; registration?: Registration; qrCode?: string }>;
  
  addTournament: (tournament: Omit<Tournament, 'id'>) => Promise<Tournament>;
  editTournament: (id: string, tournament: Partial<Tournament>) => Promise<boolean>;
  deleteTournament: (id: string) => Promise<boolean>;
  updateTournamentStatus: (id: string, status: Tournament['status']) => Promise<boolean>;
  approveTeam: (teamId: string, approve: boolean) => Promise<boolean>;
  generateFixtures: (tournamentId: string, format: 'knockout' | 'round_robin') => Promise<Fixture[]>;
  updateLiveMatch: (matchId: string, matchState: Partial<MatchScoreState>) => Promise<MatchScoreState>;
  processLiveBall: (
    matchId: string, 
    runs: number, 
    isWicket: boolean, 
    isExtra: boolean, 
    extraType?: 'wide' | 'no-ball' | 'bye'
  ) => Promise<MatchScoreState>;
  upgradeMembership: (userId: string, tier: string) => Promise<UserMembership>;
  awardBadge: (userId: string, badgeId: string) => Promise<UserBadge | null>;
  generateCertificate: (userId: string, tournamentId: string, type: Certificate['type']) => Promise<Certificate>;
  scanQRCode: (codeString: string) => Promise<{ success: boolean; registration?: Registration; teamName?: string; tournamentName?: string }>;
  addNotification: (userId: string, title: string, message: string) => Promise<Notification>;
  markNotificationRead: (id: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetAllData: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// Seeds Definition
const INITIAL_MEMBERSHIPS: Membership[] = [
  { id: 'silver', name: 'Silver Club', discount_pct: 5, price: 499, features: ['5% discount on registrations', 'Priority access to matches', 'Standard support'] },
  { id: 'gold', name: 'Gold Club', discount_pct: 10, price: 999, features: ['10% discount on registrations', 'Priority registration window', 'Exclusive digital badge', 'Free entry to match screenings'] },
  { id: 'platinum', name: 'Platinum Club', discount_pct: 20, price: 1999, features: ['20% discount on registrations', 'Express QR check-in lanes', 'Platinum profile badge', 'Free customized profile certificates', 'VIP seat allocations'] }
];

const INITIAL_MANAGED_TOP_PLAYERS: ManagedTopPlayer[] = [];

const INITIAL_WALL_OF_FRAME_ITEMS: WallOfFrameItem[] = [];

const INITIAL_BADGES: Badge[] = [
  { id: 'century_king', name: 'Century King', icon: '🏅', requirement_description: 'Scores 100 runs or more in a career match', threshold: 100 },
  { id: 'power_hitter', name: 'Power Hitter', icon: '⚡', requirement_description: 'Scores 500 total career runs', threshold: 500 },
  { id: 'hattrick_hero', name: 'Hat-Trick Hero', icon: '🎩', requirement_description: 'Takes 3 wickets in a single match', threshold: 3 },
  { id: 'bowling_star', name: 'Wicket Machine', icon: '🎯', requirement_description: 'Takes 10 total career wickets', threshold: 10 },
  { id: 'mvp', name: 'MVP', icon: '💎', requirement_description: 'Earns MVP player rating in a match', threshold: 1 },
  { id: 'champion', name: 'Champion', icon: '🏆', requirement_description: 'Wins a tournament final match', threshold: 1 },
  { id: 'consistent_performer', name: 'Consistent Star', icon: '🔥', requirement_description: 'Maintains win rate above 60% over 5 matches', threshold: 60 }
];

const INITIAL_TOURNAMENTS: Tournament[] = [];

// Seed Profiles & Stats
const INITIAL_PROFILES: Profile[] = [
  { id: 'd1000000-0000-0000-0000-000000000009', name: 'Hub Admin', email: 'admin@crickethub.com', role: 'admin', created_at: new Date().toISOString() }
];

const INITIAL_PLAYER_STATS: PlayerStats[] = [];

const INITIAL_TEAMS: Team[] = [];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [];

const INITIAL_REGISTRATIONS: Registration[] = [];

const INITIAL_FIXTURES: Fixture[] = [];

const INITIAL_MATCHES: MatchScoreState[] = [];

const INITIAL_USER_BADGES: UserBadge[] = [];

const INITIAL_CERTIFICATES: Certificate[] = [];

const INITIAL_QR: QRCodeData[] = [];

// Helper functions to keep DatabaseProvider pure for React rules
function generateMockPaymentId() {
  return `rzp_mock_${Math.random().toString(36).substring(2, 11)}`;
}

function getOneYearExpiry() {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
}

function shuffleTeams(teamsList: string[]) {
  return [...teamsList].sort(() => Math.random() - 0.5);
}

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try loading from localStorage, otherwise use initial seeds
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [matches, setMatches] = useState<MatchScoreState[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [badges] = useState<Badge[]>(INITIAL_BADGES);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [memberships] = useState<Membership[]>(INITIAL_MEMBERSHIPS);
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [managedTopPlayers, setManagedTopPlayers] = useState<ManagedTopPlayer[]>([]);
  const [wallOfFrameItems, setWallOfFrameItems] = useState<WallOfFrameItem[]>([]);
  const [matchPerformances, setMatchPerformances] = useState<MatchPerformance[]>([]);

  // Sync to localStorage on state change
  const saveToStorage = (key: string, data: unknown) => {
    localStorage.setItem(`crickethub_${key}`, JSON.stringify(data));
  };

  useEffect(() => {
    const initializeDatabase = async () => {
      // ─── One-time migration: Remove hardcoded default player IDs ───────────────
      // These were seeded during development and should not appear in production.
      const DEFAULT_PLAYER_IDS = [
        'd1000000-0000-0000-0000-000000000001',
        'd1000000-0000-0000-0000-000000000002',
        'd1000000-0000-0000-0000-000000000003',
      ];
      const DEFAULT_TEAM_IDS = [
        'b1000000-0000-0000-0000-000000000001',
        'b1000000-0000-0000-0000-000000000002',
        'b1000000-0000-0000-0000-000000000003',
        'b1000000-0000-0000-0000-000000000004',
      ];
      const DEFAULT_TOURNAMENT_IDS = [
        'a1000000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000002',
        'a1000000-0000-0000-0000-000000000003',
      ];
      try {
        // Remove default players from profiles
        const storedProfiles = JSON.parse(localStorage.getItem('crickethub_profiles') || '[]');
        const cleanedProfiles = storedProfiles.filter((p: { id: string }) => !DEFAULT_PLAYER_IDS.includes(p.id));
        if (cleanedProfiles.length !== storedProfiles.length) {
          localStorage.setItem('crickethub_profiles', JSON.stringify(cleanedProfiles));
        }

        // Remove default player stats
        const storedStats = JSON.parse(localStorage.getItem('crickethub_playerStats') || '[]');
        const cleanedStats = storedStats.filter((s: { player_id: string }) => !DEFAULT_PLAYER_IDS.includes(s.player_id));
        if (cleanedStats.length !== storedStats.length) {
          localStorage.setItem('crickethub_playerStats', JSON.stringify(cleanedStats));
        }

        // Remove default tournaments
        const storedTournaments = JSON.parse(localStorage.getItem('crickethub_tournaments') || '[]');
        const cleanedTournaments = storedTournaments.filter((t: { id: string }) => !DEFAULT_TOURNAMENT_IDS.includes(t.id));
        if (cleanedTournaments.length !== storedTournaments.length) {
          localStorage.setItem('crickethub_tournaments', JSON.stringify(cleanedTournaments));
        }

        // Remove default teams
        const storedTeams = JSON.parse(localStorage.getItem('crickethub_teams') || '[]');
        const cleanedTeams = storedTeams.filter((t: { id: string }) => !DEFAULT_TEAM_IDS.includes(t.id));
        if (cleanedTeams.length !== storedTeams.length) {
          localStorage.setItem('crickethub_teams', JSON.stringify(cleanedTeams));
        }

        // Remove default team members
        const storedMembers = JSON.parse(localStorage.getItem('crickethub_teamMembers') || '[]');
        const cleanedMembers = storedMembers.filter((m: { team_id: string }) => !DEFAULT_TEAM_IDS.includes(m.team_id));
        if (cleanedMembers.length !== storedMembers.length) {
          localStorage.setItem('crickethub_teamMembers', JSON.stringify(cleanedMembers));
        }

        // Remove default registrations
        const storedRegs = JSON.parse(localStorage.getItem('crickethub_registrations') || '[]');
        const cleanedRegs = storedRegs.filter(
          (r: { team_id: string; tournament_id: string }) =>
            !DEFAULT_TEAM_IDS.includes(r.team_id) && !DEFAULT_TOURNAMENT_IDS.includes(r.tournament_id)
        );
        if (cleanedRegs.length !== storedRegs.length) {
          localStorage.setItem('crickethub_registrations', JSON.stringify(cleanedRegs));
        }

        // Remove default fixtures
        const storedFixtures = JSON.parse(localStorage.getItem('crickethub_fixtures') || '[]');
        const cleanedFixtures = storedFixtures.filter(
          (f: { team1_id: string; team2_id: string; tournament_id: string }) =>
            !DEFAULT_TEAM_IDS.includes(f.team1_id) &&
            !DEFAULT_TEAM_IDS.includes(f.team2_id) &&
            !DEFAULT_TOURNAMENT_IDS.includes(f.tournament_id)
        );
        if (cleanedFixtures.length !== storedFixtures.length) {
          localStorage.setItem('crickethub_fixtures', JSON.stringify(cleanedFixtures));
        }

        // Remove default match scores
        const storedMatches = JSON.parse(localStorage.getItem('crickethub_matches') || '[]');
        const cleanedMatches = storedMatches.filter(
          (m: { team1_id: string; team2_id: string }) =>
            !DEFAULT_TEAM_IDS.includes(m.team1_id) && !DEFAULT_TEAM_IDS.includes(m.team2_id)
        );
        if (cleanedMatches.length !== storedMatches.length) {
          localStorage.setItem('crickethub_matches', JSON.stringify(cleanedMatches));
        }

        // Remove default match performances
        const storedPerfs = JSON.parse(localStorage.getItem('crickethub_match_performances') || '[]');
        const cleanedPerfs = storedPerfs.filter((p: { player_id: string }) => !DEFAULT_PLAYER_IDS.includes(p.player_id));
        if (cleanedPerfs.length !== storedPerfs.length) {
          localStorage.setItem('crickethub_match_performances', JSON.stringify(cleanedPerfs));
        }

        // Remove default badges
        const storedBadges = JSON.parse(localStorage.getItem('crickethub_userBadges') || '[]');
        const cleanedBadges = storedBadges.filter((b: { user_id: string }) => !DEFAULT_PLAYER_IDS.includes(b.user_id));
        if (cleanedBadges.length !== storedBadges.length) {
          localStorage.setItem('crickethub_userBadges', JSON.stringify(cleanedBadges));
        }

        // Remove default certificates
        const storedCerts = JSON.parse(localStorage.getItem('crickethub_certificates') || '[]');
        const cleanedCerts = storedCerts.filter((c: { user_id: string }) => !DEFAULT_PLAYER_IDS.includes(c.user_id));
        if (cleanedCerts.length !== storedCerts.length) {
          localStorage.setItem('crickethub_certificates', JSON.stringify(cleanedCerts));
        }

        // Remove default QR codes (linked to default registrations)
        const storedQR = JSON.parse(localStorage.getItem('crickethub_qrCodes') || '[]');
        const validRegIds = (JSON.parse(localStorage.getItem('crickethub_registrations') || '[]') as { id: string }[]).map(r => r.id);
        const cleanedQR = storedQR.filter((q: { registration_id: string }) => validRegIds.includes(q.registration_id));
        if (cleanedQR.length !== storedQR.length) {
          localStorage.setItem('crickethub_qrCodes', JSON.stringify(cleanedQR));
        }
      } catch (_) {
        // Migration errors are non-fatal — ignore silently
      }
      // ──────────────────────────────────────────────────────────────────────────
      try {
        // 1. Profiles
        const { data: dbProfiles, error: pErr } = await supabase.from('profiles').select('*');
        if (!pErr && dbProfiles && dbProfiles.length > 0) {
          setProfiles(dbProfiles);
          saveToStorage('profiles', dbProfiles);
        } else {
          const { error: seedPErr } = await supabase.from('profiles').upsert(INITIAL_PROFILES);
          if (!seedPErr) {
            setProfiles(INITIAL_PROFILES);
            saveToStorage('profiles', INITIAL_PROFILES);
          }
        }

        // 2. Tournaments
        const { data: dbTourneys, error: tErr } = await supabase.from('tournaments').select('*');
        if (!tErr && dbTourneys && dbTourneys.length > 0) {
          setTournaments(dbTourneys);
          saveToStorage('tournaments', dbTourneys);
        } else {
          const { error: seedTErr } = await supabase.from('tournaments').upsert(INITIAL_TOURNAMENTS);
          if (!seedTErr) {
            setTournaments(INITIAL_TOURNAMENTS);
            saveToStorage('tournaments', INITIAL_TOURNAMENTS);
          }
        }

        // 3. Teams
        const { data: dbTeams, error: tmErr } = await supabase.from('teams').select('*');
        if (!tmErr && dbTeams && dbTeams.length > 0) {
          setTeams(dbTeams);
          saveToStorage('teams', dbTeams);
        } else {
          const { error: seedTmErr } = await supabase.from('teams').upsert(INITIAL_TEAMS);
          if (!seedTmErr) {
            setTeams(INITIAL_TEAMS);
            saveToStorage('teams', INITIAL_TEAMS);
          }
        }

        // 4. Team Members
        const { data: dbMembers, error: memErr } = await supabase.from('team_members').select('*');
        if (!memErr && dbMembers && dbMembers.length > 0) {
          setTeamMembers(dbMembers);
          saveToStorage('teamMembers', dbMembers);
        } else {
          const { error: seedMemErr } = await supabase.from('team_members').upsert(INITIAL_TEAM_MEMBERS);
          if (!seedMemErr) {
            setTeamMembers(INITIAL_TEAM_MEMBERS);
            saveToStorage('teamMembers', INITIAL_TEAM_MEMBERS);
          }
        }

        // 5. Registrations
        const { data: dbRegs, error: rErr } = await supabase.from('registrations').select('*');
        if (!rErr && dbRegs && dbRegs.length > 0) {
          setRegistrations(dbRegs);
          saveToStorage('registrations', dbRegs);
        } else {
          const { error: seedRErr } = await supabase.from('registrations').upsert(INITIAL_REGISTRATIONS);
          if (!seedRErr) {
            setRegistrations(INITIAL_REGISTRATIONS);
            saveToStorage('registrations', INITIAL_REGISTRATIONS);
          }
        }

        // 6. Fixtures
        const { data: dbFixt, error: fErr } = await supabase.from('fixtures').select('*');
        if (!fErr && dbFixt && dbFixt.length > 0) {
          setFixtures(dbFixt);
          saveToStorage('fixtures', dbFixt);
        } else {
          const { error: seedFErr } = await supabase.from('fixtures').upsert(INITIAL_FIXTURES);
          if (!seedFErr) {
            setFixtures(INITIAL_FIXTURES);
            saveToStorage('fixtures', INITIAL_FIXTURES);
          }
        }

        // 7. Matches
        const { data: dbMatches, error: mErr } = await supabase.from('matches').select('*');
        if (!mErr && dbMatches && dbMatches.length > 0) {
          setMatches(dbMatches);
          saveToStorage('matches', dbMatches);
        } else {
          const { error: seedMErr } = await supabase.from('matches').upsert(INITIAL_MATCHES);
          if (!seedMErr) {
            setMatches(INITIAL_MATCHES);
            saveToStorage('matches', INITIAL_MATCHES);
          }
        }

        // 8. Player Stats
        const { data: dbStats, error: sErr } = await supabase.from('player_stats').select('*');
        if (!sErr && dbStats && dbStats.length > 0) {
          setPlayerStats(dbStats);
          saveToStorage('playerStats', dbStats);
        } else {
          const { error: seedSErr } = await supabase.from('player_stats').upsert(INITIAL_PLAYER_STATS);
          if (!seedSErr) {
            setPlayerStats(INITIAL_PLAYER_STATS);
            saveToStorage('playerStats', INITIAL_PLAYER_STATS);
          }
        }

        // 9. User Badges
        const { data: dbUB, error: ubErr } = await supabase.from('user_badges').select('*');
        if (!ubErr && dbUB && dbUB.length > 0) {
          setUserBadges(dbUB);
          saveToStorage('userBadges', dbUB);
        } else {
          const { error: seedUBErr } = await supabase.from('user_badges').upsert(INITIAL_USER_BADGES);
          if (!seedUBErr) {
            setUserBadges(INITIAL_USER_BADGES);
            saveToStorage('userBadges', INITIAL_USER_BADGES);
          }
        }

        // 10. Certificates
        const { data: dbCert, error: certErr } = await supabase.from('certificates').select('*');
        if (!certErr && dbCert && dbCert.length > 0) {
          setCertificates(dbCert);
          saveToStorage('certificates', dbCert);
        } else {
          const { error: seedCertErr } = await supabase.from('certificates').upsert(INITIAL_CERTIFICATES);
          if (!seedCertErr) {
            setCertificates(INITIAL_CERTIFICATES);
            saveToStorage('certificates', INITIAL_CERTIFICATES);
          }
        }

        // 11. Payments
        const { data: dbPay, error: payErr } = await supabase.from('payments').select('*');
        if (!payErr && dbPay) {
          setPayments(dbPay);
          saveToStorage('payments', dbPay);
        }

        // 12. QR Codes
        const { data: dbQR, error: qrErr } = await supabase.from('qr_codes').select('*');
        if (!qrErr && dbQR && dbQR.length > 0) {
          setQrCodes(dbQR);
          saveToStorage('qrCodes', dbQR);
        } else {
          const { error: seedQRErr } = await supabase.from('qr_codes').upsert(INITIAL_QR);
          if (!seedQRErr) {
            setQrCodes(INITIAL_QR);
            saveToStorage('qrCodes', INITIAL_QR);
          }
        }

        // 13. Notifications
        const { data: dbNotif, error: nErr } = await supabase.from('notifications').select('*');
        if (!nErr && dbNotif && dbNotif.length > 0) {
          setNotifications(dbNotif);
          saveToStorage('notifications', dbNotif);
        } else {
          const initialNotif: Notification[] = [
            { id: generateUUID(), user_id: 'd1000000-0000-0000-0000-000000000001', title: 'Welcome Cricketer!', message: 'Explore tournaments, upgrade your membership, or check upcoming match fixtures.', is_read: false, created_at: new Date().toISOString() }
          ];
          const { error: seedNErr } = await supabase.from('notifications').upsert(initialNotif);
          if (!seedNErr) {
            setNotifications(initialNotif);
            saveToStorage('notifications', initialNotif);
          }
        }

        // 14. User Memberships
        const { data: dbUM, error: umErr } = await supabase.from('user_memberships').select('*');
        if (!umErr && dbUM && dbUM.length > 0) {
          setUserMemberships(dbUM);
          saveToStorage('userMemberships', dbUM);
        } else {
          const initialUM: UserMembership[] = [
            { id: '41000000-0000-0000-0000-000000000001', user_id: 'd1000000-0000-0000-0000-000000000001', membership_id: 'gold', status: 'active', created_at: new Date().toISOString() }
          ];
          const { error: seedUMErr } = await supabase.from('user_memberships').upsert(initialUM);
          if (!seedUMErr) {
            setUserMemberships(initialUM);
            saveToStorage('userMemberships', initialUM);
          }
        }

        // Helper to query local storage during init
        const getLocalStorageItem = (key: string, defaultValue: unknown) => {
          const stored = localStorage.getItem(`crickethub_${key}`);
          if (stored) {
            try {
              return JSON.parse(stored);
            } catch (e) {
              console.error(e);
            }
          }
          return defaultValue;
        };

        // 15. Managed Top Players
        try {
          const { data: dbTopPlayers, error: tpErr } = await supabase.from('managed_top_players').select('*');
          if (!tpErr && dbTopPlayers && dbTopPlayers.length > 0) {
            setManagedTopPlayers(dbTopPlayers);
            saveToStorage('managedTopPlayers', dbTopPlayers);
          } else {
            const { error: seedTpErr } = await supabase.from('managed_top_players').upsert(INITIAL_MANAGED_TOP_PLAYERS);
            if (!seedTpErr) {
              setManagedTopPlayers(INITIAL_MANAGED_TOP_PLAYERS);
              saveToStorage('managedTopPlayers', INITIAL_MANAGED_TOP_PLAYERS);
            } else {
              const fallback = getLocalStorageItem('managedTopPlayers', INITIAL_MANAGED_TOP_PLAYERS);
              setManagedTopPlayers(fallback);
              saveToStorage('managedTopPlayers', fallback);
            }
          }
        } catch (e) {
          const fallback = getLocalStorageItem('managedTopPlayers', INITIAL_MANAGED_TOP_PLAYERS);
          setManagedTopPlayers(fallback);
          saveToStorage('managedTopPlayers', fallback);
        }

        // 16. Wall of Frame Items
        try {
          const { data: dbWof, error: wofErr } = await supabase.from('wall_of_frame_items').select('*');
          if (!wofErr && dbWof && dbWof.length > 0) {
            setWallOfFrameItems(dbWof);
            saveToStorage('wallOfFrameItems', dbWof);
          } else {
            const { error: seedWofErr } = await supabase.from('wall_of_frame_items').upsert(INITIAL_WALL_OF_FRAME_ITEMS);
            if (!seedWofErr) {
              setWallOfFrameItems(INITIAL_WALL_OF_FRAME_ITEMS);
              saveToStorage('wallOfFrameItems', INITIAL_WALL_OF_FRAME_ITEMS);
            } else {
              const fallback = getLocalStorageItem('wallOfFrameItems', INITIAL_WALL_OF_FRAME_ITEMS);
              setWallOfFrameItems(fallback);
              saveToStorage('wallOfFrameItems', fallback);
            }
          }
        } catch (e) {
          const fallback = getLocalStorageItem('wallOfFrameItems', INITIAL_WALL_OF_FRAME_ITEMS);
          setWallOfFrameItems(fallback);
          saveToStorage('wallOfFrameItems', fallback);
        }

        // 17. Match Performances
        try {
          const { data: dbPerformances, error: perfErr } = await supabase.from('match_performances').select('*');
          if (!perfErr && dbPerformances && dbPerformances.length > 0) {
            setMatchPerformances(dbPerformances);
            saveToStorage('match_performances', dbPerformances);
          } else {
            const fallback = getLocalStorageItem('match_performances', []);
            setMatchPerformances(fallback);
            saveToStorage('match_performances', fallback);
          }
        } catch (e) {
          const fallback = getLocalStorageItem('match_performances', []);
          setMatchPerformances(fallback);
          saveToStorage('match_performances', fallback);
        }

      } catch (err) {
        console.error('Failed to initialize/fetch data from Supabase, falling back to local storage', err);
        
        // Fallback to local storage or local seeds
        const getStoredOrSeed = <T,>(key: string, seed: T): T => {
          const stored = localStorage.getItem(`crickethub_${key}`);
          if (stored) {
            try {
              return JSON.parse(stored);
            } catch (e) {
              console.error(`Error loading key: ${key}`, e);
            }
          }
          localStorage.setItem(`crickethub_${key}`, JSON.stringify(seed));
          return seed;
        };

        setProfiles(getStoredOrSeed('profiles', INITIAL_PROFILES));
        setTournaments(getStoredOrSeed('tournaments', INITIAL_TOURNAMENTS));
        setTeams(getStoredOrSeed('teams', INITIAL_TEAMS));
        setTeamMembers(getStoredOrSeed('teamMembers', INITIAL_TEAM_MEMBERS));
        setRegistrations(getStoredOrSeed('registrations', INITIAL_REGISTRATIONS));
        setFixtures(getStoredOrSeed('fixtures', INITIAL_FIXTURES));
        setMatches(getStoredOrSeed('matches', INITIAL_MATCHES));
        setPlayerStats(getStoredOrSeed('playerStats', INITIAL_PLAYER_STATS));
        setUserBadges(getStoredOrSeed('userBadges', INITIAL_USER_BADGES));
        setCertificates(getStoredOrSeed('certificates', INITIAL_CERTIFICATES));
        setPayments(getStoredOrSeed('payments', []));
        setNotifications(getStoredOrSeed('notifications', [
          { id: generateUUID(), user_id: 'd1000000-0000-0000-0000-000000000001', title: 'Welcome Cricketer!', message: 'Explore tournaments, upgrade your membership, or check upcoming match fixtures.', is_read: false, created_at: new Date().toISOString() }
        ]));
        setQrCodes(getStoredOrSeed('qrCodes', INITIAL_QR));
        setUserMemberships(getStoredOrSeed('userMemberships', [
          { id: '41000000-0000-0000-0000-000000000001', user_id: 'd1000000-0000-0000-0000-000000000001', membership_id: 'gold', status: 'active', created_at: new Date().toISOString() }
        ]));
        setManagedTopPlayers(getStoredOrSeed('managedTopPlayers', INITIAL_MANAGED_TOP_PLAYERS));
        setWallOfFrameItems(getStoredOrSeed('wallOfFrameItems', INITIAL_WALL_OF_FRAME_ITEMS));
        setMatchPerformances(getStoredOrSeed('match_performances', []));
      }
    };

    initializeDatabase();
  }, []);



  const registerTeam = async (
    tournamentId: string, 
    teamName: string, 
    captainName: string, 
    captainEmail: string, 
    members: Array<string | { name: string; email?: string; phone?: string; role?: string }>,
    entryFeePaid: number
  ) => {
    // 1. Find or create Captain Profile
    let captain = profiles.find(p => p.email.toLowerCase() === captainEmail.toLowerCase());
    
    if (!captain) {
      try {
        const { data: dbProf } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', captainEmail)
          .maybeSingle();
        if (dbProf) {
          captain = dbProf;
          setProfiles(prev => [...prev, dbProf]);
        }
      } catch (err) {
        console.error('Error fetching captain profile from DB', err);
      }
    }

    if (!captain) {
      const generatedCaptainId = generateUUID();
      const newCap: Profile = {
        id: generatedCaptainId,
        name: captainName,
        email: captainEmail.toLowerCase(),
        role: 'captain',
        created_at: new Date().toISOString()
      };
      const newStats: PlayerStats = {
        id: generateUUID(),
        player_id: generatedCaptainId,
        matches_played: 0,
        runs: 0,
        wickets: 0,
        highest_score: 0,
        best_bowling_figures: '0/0',
        batting_average: 0,
        bowling_economy: 0,
        win_percentage: 0
      };

      const updatedProfiles = [...profiles, newCap];
      setProfiles(updatedProfiles);
      saveToStorage('profiles', updatedProfiles);
      
      const updatedStats = [...playerStats, newStats];
      setPlayerStats(updatedStats);
      saveToStorage('playerStats', updatedStats);
      
      captain = newCap;

      // Sync Captain to Supabase
      try {
        await supabase.from('profiles').insert(newCap);
        await supabase.from('player_stats').insert(newStats);
      } catch (err) {
        console.error('Failed to sync new captain profile to Supabase', err);
      }
    }

    // 2. Create Team
    const newTeamId = generateUUID();
    const newTeam: Team = {
      id: newTeamId,
      name: teamName,
      captain_id: captain.id,
      status: 'approved'
    };
    
    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    saveToStorage('teams', updatedTeams);

    try {
      await supabase.from('teams').insert(newTeam);
    } catch (err) {
      console.error('Failed to sync new team to Supabase', err);
    }

    // 3. Create Team Members
    const newMembers: TeamMember[] = [
      { id: generateUUID(), team_id: newTeam.id, player_name: captainName, role: 'captain', email: captainEmail },
      ...members.map((m): TeamMember => {
        const isString = typeof m === 'string';
        const name = isString ? m : m.name;
        const email = isString ? undefined : m.email || undefined;
        const phone = isString ? undefined : m.phone || undefined;
        const role = isString ? 'player' : m.role || 'player';
        return {
          id: generateUUID(),
          team_id: newTeam.id,
          player_name: name,
          email,
          phone,
          role: role as TeamMember['role']
        };
      })
    ];
    const updatedMembers = [...teamMembers, ...newMembers];
    setTeamMembers(updatedMembers);
    saveToStorage('teamMembers', updatedMembers);

    try {
      await supabase.from('team_members').insert(newMembers);
    } catch (err) {
      console.error('Failed to sync team members to Supabase', err);
    }

    // 4. Create Payment Log
    const newPayment: Payment = {
      id: generateUUID(),
      user_id: captain.id,
      amount: entryFeePaid,
      currency: 'INR',
      status: 'completed',
      razorpay_payment_id: generateMockPaymentId(),
      created_at: new Date().toISOString()
    };
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    saveToStorage('payments', updatedPayments);

    try {
      await supabase.from('payments').insert(newPayment);
    } catch (err) {
      console.error('Failed to sync payment to Supabase', err);
    }

    // 5. Create Registration
    const qrString = `CH-QR-${tournamentId.substring(0, 4)}-${newTeam.id.substring(0, 4)}`;
    const newRegistration: Registration = {
      id: generateUUID(),
      tournament_id: tournamentId,
      team_id: newTeam.id,
      status: 'confirmed',
      payment_id: newPayment.id,
      qr_code_url: qrString,
      created_at: new Date().toISOString()
    };
    const updatedRegistrations = [...registrations, newRegistration];
    setRegistrations(updatedRegistrations);
    saveToStorage('registrations', updatedRegistrations);

    try {
      await supabase.from('registrations').insert(newRegistration);
    } catch (err) {
      console.error('Failed to sync registration to Supabase', err);
    }

    // 6. Create QR Code mapping
    const newQR: QRCodeData = {
      id: generateUUID(),
      registration_id: newRegistration.id,
      code_string: qrString,
      created_at: new Date().toISOString()
    };
    const updatedQR = [...qrCodes, newQR];
    setQrCodes(updatedQR);
    saveToStorage('qrCodes', updatedQR);

    try {
      await supabase.from('qr_codes').insert(newQR);
    } catch (err) {
      console.error('Failed to sync QR code to Supabase', err);
    }

    // 7. Add Notification
    await addNotification(captain.id, 'Registration Success!', `Your team "${teamName}" was registered for the tournament successfully.`);

    return { success: true, registration: newRegistration, qrCode: qrString };
  };

  const addTournament = async (t: Omit<Tournament, 'id'>) => {
    const newT: Tournament = {
      ...t,
      id: generateUUID()
    };
    const updated = [...tournaments, newT];
    setTournaments(updated);
    saveToStorage('tournaments', updated);

    try {
      await supabase.from('tournaments').insert(newT);
    } catch (err) {
      console.error('Failed to sync tournament addition to Supabase', err);
    }

    return newT;
  };

  const editTournament = async (id: string, tournamentDetails: Partial<Tournament>) => {
    const updated = tournaments.map(t => t.id === id ? { ...t, ...tournamentDetails } : t);
    setTournaments(updated);
    saveToStorage('tournaments', updated);

    try {
      await supabase.from('tournaments').update(tournamentDetails).eq('id', id);
    } catch (err) {
      console.error('Failed to sync tournament edit to Supabase', err);
    }

    return true;
  };

  const deleteTournament = async (id: string) => {
    const updated = tournaments.filter(t => t.id !== id);
    setTournaments(updated);
    saveToStorage('tournaments', updated);

    try {
      await supabase.from('tournaments').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to sync tournament deletion to Supabase', err);
    }

    return true;
  };

  const updateTournamentStatus = async (id: string, status: Tournament['status']) => {
    const updated = tournaments.map(t => t.id === id ? { ...t, status } : t);
    setTournaments(updated);
    saveToStorage('tournaments', updated);

    try {
      await supabase.from('tournaments').update({ status }).eq('id', id);
    } catch (err) {
      console.error('Failed to sync tournament status to Supabase', err);
    }

    return true;
  };

  const approveTeam = async (teamId: string, approve: boolean) => {
    const updated = teams.map(t => t.id === teamId ? { ...t, status: approve ? 'approved' as const : 'rejected' as const } : t);
    setTeams(updated);
    saveToStorage('teams', updated);

    try {
      await supabase.from('teams').update({ status: approve ? 'approved' : 'rejected' }).eq('id', teamId);
    } catch (err) {
      console.error('Failed to sync team approval to Supabase', err);
    }

    return true;
  };

  const generateFixtures = async (tournamentId: string, format: 'knockout' | 'round_robin') => {
    const tourneyRegs = registrations.filter(r => r.tournament_id === tournamentId && r.status === 'confirmed');
    const tourneyTeams = tourneyRegs.map(r => r.team_id);
    
    if (tourneyTeams.length < 2) return [];

    const newFixtures: Fixture[] = [];
    const t = tournaments.find(x => x.id === tournamentId);
    const baseDate = t ? new Date(t.start_date) : new Date();

    if (format === 'round_robin') {
      let round = 1;
      for (let i = 0; i < tourneyTeams.length; i++) {
        for (let j = i + 1; j < tourneyTeams.length; j++) {
          const matchDate = new Date(baseDate);
          matchDate.setDate(matchDate.getDate() + round);
          
          newFixtures.push({
            id: generateUUID(),
            tournament_id: tournamentId,
            round,
            team1_id: tourneyTeams[i],
            team2_id: tourneyTeams[j],
            match_date: matchDate.toISOString(),
            status: 'scheduled'
          });
          round++;
        }
      }
    } else {
      const shuffled = shuffleTeams(tourneyTeams);
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        const matchDate = new Date(baseDate);
        matchDate.setDate(matchDate.getDate() + 1);

        newFixtures.push({
          id: generateUUID(),
          tournament_id: tournamentId,
          round: 1,
          team1_id: shuffled[i],
          team2_id: shuffled[i + 1],
          match_date: matchDate.toISOString(),
          status: 'scheduled'
        });
      }
    }

    const updatedFixtures = [...fixtures.filter(f => f.tournament_id !== tournamentId), ...newFixtures];
    setFixtures(updatedFixtures);
    saveToStorage('fixtures', updatedFixtures);

    // Create matches for these fixtures
    const newMatches = newFixtures.map(f => ({
      id: generateUUID(),
      fixture_id: f.id,
      tournament_id: tournamentId,
      status: 'scheduled' as const,
      team1_id: f.team1_id,
      team2_id: f.team2_id,
      team1_runs: 0,
      team1_wickets: 0,
      team1_overs: 0.0,
      team2_runs: 0,
      team2_wickets: 0,
      team2_overs: 0.0,
      balls_bowled: 0,
      partnership_runs: 0
    }));
    
    const updatedMatches = [...matches.filter(m => m.tournament_id !== tournamentId), ...newMatches];
    setMatches(updatedMatches);
    saveToStorage('matches', updatedMatches);

    try {
      await supabase.from('fixtures').insert(newFixtures);
      await supabase.from('matches').insert(newMatches);
    } catch (err) {
      console.error('Failed to sync fixtures and matches to Supabase', err);
    }

    return newFixtures;
  };

  const updateLiveMatch = async (matchId: string, matchState: Partial<MatchScoreState>) => {
    const updated = matches.map(m => {
      if (m.id === matchId) {
        const full = { ...m, ...matchState };
        if (matchState.status === 'completed' && full.winner_id) {
          const team = teams.find(t => t.id === full.winner_id);
          if (team) {
            addNotification(team.captain_id, '🏆 Champion Alert!', `Your team won the match against ${teams.find(t => t.id === (full.winner_id === full.team1_id ? full.team2_id : full.team1_id))?.name}!`);
          }
        }
        return full;
      }
      return m;
    });
    setMatches(updated);
    saveToStorage('matches', updated);

    try {
      await supabase.from('matches').update(matchState).eq('id', matchId);
    } catch (err) {
      console.error('Failed to sync live match update to Supabase', err);
    }

    return updated.find(m => m.id === matchId)!;
  };

  const processLiveBall = async (
    matchId: string, 
    runs: number, 
    isWicket: boolean, 
    isExtra: boolean, 
    extraType?: 'wide' | 'no-ball' | 'bye'
  ) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) throw new Error('Match not found');

    const updatedState = { ...match };
    const isFirstInnings = updatedState.team2_runs === 0 && updatedState.team2_wickets === 0 && updatedState.team2_overs === 0.0 && updatedState.status === 'ongoing';
    const maxOvers = 10;

    if (isFirstInnings) {
      if (isWicket) {
        updatedState.team1_wickets += 1;
        updatedState.partnership_runs = 0;
      } else {
        updatedState.team1_runs += runs;
        updatedState.partnership_runs += runs;
      }

      if (!isExtra || extraType === 'bye') {
        updatedState.balls_bowled += 1;
      } else if (isExtra && (extraType === 'wide' || extraType === 'no-ball')) {
        updatedState.team1_runs += 1;
      }

      const overs = Math.floor(updatedState.balls_bowled / 6);
      const balls = updatedState.balls_bowled % 6;
      updatedState.team1_overs = parseFloat(`${overs}.${balls}`);

      if (updatedState.current_batsman1) {
        updatedState.current_batsman1_runs = (updatedState.current_batsman1_runs || 0) + (isWicket ? 0 : runs);
      }

      if (updatedState.team1_wickets >= 10 || updatedState.team1_overs >= maxOvers) {
        updatedState.balls_bowled = 0;
        updatedState.partnership_runs = 0;
        updatedState.target_runs = updatedState.team1_runs + 1;
        
        updatedState.current_batsman1 = 'KL Rahul';
        updatedState.current_batsman1_runs = 0;
        updatedState.current_batsman2 = 'Rohit K.';
        updatedState.current_batsman2_runs = 0;
        updatedState.current_bowler = 'Hardik P.';
        updatedState.current_bowler_wickets = 0;
        updatedState.current_bowler_runs = 0;
      }
    } else {
      if (isWicket) {
        updatedState.team2_wickets += 1;
        updatedState.partnership_runs = 0;
      } else {
        updatedState.team2_runs += runs;
        updatedState.partnership_runs += runs;
      }

      if (!isExtra || extraType === 'bye') {
        updatedState.balls_bowled += 1;
      } else if (isExtra && (extraType === 'wide' || extraType === 'no-ball')) {
        updatedState.team2_runs += 1;
      }

      const overs = Math.floor(updatedState.balls_bowled / 6);
      const balls = updatedState.balls_bowled % 6;
      updatedState.team2_overs = parseFloat(`${overs}.${balls}`);

      if (updatedState.current_batsman1) {
        updatedState.current_batsman1_runs = (updatedState.current_batsman1_runs || 0) + (isWicket ? 0 : runs);
      }

      const target = updatedState.target_runs || (updatedState.team1_runs + 1);
      if (updatedState.team2_runs >= target) {
        updatedState.status = 'completed';
        updatedState.winner_id = updatedState.team2_id;
      } else if (updatedState.team2_wickets >= 10 || updatedState.team2_overs >= maxOvers) {
        updatedState.status = 'completed';
        updatedState.winner_id = updatedState.team1_id;
      }
    }

    if (updatedState.current_batsman1_runs && updatedState.current_batsman1_runs >= 100) {
      const player = profiles.find(p => p.name === updatedState.current_batsman1);
      if (player) {
        await awardBadge(player.id, 'century_king');
      }
    }

    const newMatches = matches.map(m => m.id === matchId ? updatedState : m);
    setMatches(newMatches);
    saveToStorage('matches', newMatches);

    if (updatedState.status === 'completed') {
      const updatedFixtures = fixtures.map(f => f.id === updatedState.fixture_id ? { ...f, status: 'completed' as const } : f);
      setFixtures(updatedFixtures);
      saveToStorage('fixtures', updatedFixtures);

      const t1 = teams.find(t => t.id === updatedState.team1_id);
      const t2 = teams.find(t => t.id === updatedState.team2_id);
      if (t1 && t2) {
        const cap1 = profiles.find(p => p.id === t1.captain_id);
        if (cap1) {
          const stats = playerStats.find(s => s.player_id === cap1.id);
          if (stats) {
            stats.matches_played += 1;
            if (updatedState.winner_id === t1.id) {
              stats.runs += updatedState.current_batsman1_runs || 30;
              stats.win_percentage = parseFloat(((stats.win_percentage * (stats.matches_played - 1) + 100) / stats.matches_played).toFixed(1));
            } else {
              stats.win_percentage = parseFloat(((stats.win_percentage * (stats.matches_played - 1)) / stats.matches_played).toFixed(1));
            }
            const newStats = playerStats.map(s => s.player_id === cap1.id ? stats : s);
            setPlayerStats(newStats);
            saveToStorage('playerStats', newStats);

            try {
              await supabase.from('player_stats').update({
                matches_played: stats.matches_played,
                runs: stats.runs,
                win_percentage: stats.win_percentage
              }).eq('player_id', cap1.id);
            } catch (err) {
              console.error('Failed to sync player stats updates to Supabase', err);
            }
          }
        }
      }
    }

    try {
      await supabase.from('matches').update(updatedState).eq('id', matchId);
      if (updatedState.status === 'completed' && updatedState.fixture_id) {
        await supabase.from('fixtures').update({ status: 'completed' }).eq('id', updatedState.fixture_id);
      }
    } catch (err) {
      console.error('Failed to sync live scoring ball processing to Supabase', err);
    }

    return updatedState;
  };

  const upgradeMembership = async (userId: string, tier: string) => {
    const newMembership: UserMembership = {
      id: generateUUID(),
      user_id: userId,
      membership_id: tier,
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at: getOneYearExpiry()
    };
    
    const updated = [
      ...userMemberships.filter(um => um.user_id !== userId),
      newMembership
    ];
    setUserMemberships(updated);
    saveToStorage('userMemberships', updated);

    try {
      // Clean previous user memberships to prevent unique/fk conflict if user upgrades/downgrades multiple times
      await supabase.from('user_memberships').delete().eq('user_id', userId);
      await supabase.from('user_memberships').insert(newMembership);
    } catch (err) {
      console.error('Failed to sync upgraded user membership to Supabase', err);
    }

    if (tier === 'platinum') {
      await awardBadge(userId, 'consistent_performer');
    }

    await addNotification(userId, 'Plan Upgraded!', `Welcome to the ${tier.toUpperCase()} Membership. Your privileges are active immediately.`);

    return newMembership;
  };

  const awardBadge = async (userId: string, badgeId: string) => {
    const exists = userBadges.some(ub => ub.user_id === userId && ub.badge_id === badgeId);
    if (exists) return null;

    const newUB: UserBadge = {
      id: generateUUID(),
      user_id: userId,
      badge_id: badgeId,
      awarded_at: new Date().toISOString()
    };
    const updated = [...userBadges, newUB];
    setUserBadges(updated);
    saveToStorage('userBadges', updated);

    try {
      await supabase.from('user_badges').insert(newUB);
    } catch (err) {
      console.error('Failed to sync user badge to Supabase', err);
    }

    const b = badges.find(x => x.id === badgeId);
    if (b) {
      await addNotification(userId, '🏅 Badge Unlocked!', `You have earned the "${b.name}" badge: ${b.requirement_description}`);
    }

    return newUB;
  };

  const generateCertificate = async (userId: string, tournamentId: string, type: Certificate['type']) => {
    const newCert: Certificate = {
      id: generateUUID(),
      user_id: userId,
      tournament_id: tournamentId,
      type,
      pdf_url: `https://crickethub.com/certs/${userId}_${tournamentId}.pdf`,
      created_at: new Date().toISOString()
    };
    const updated = [...certificates, newCert];
    setCertificates(updated);
    saveToStorage('certificates', updated);

    try {
      await supabase.from('certificates').insert(newCert);
    } catch (err) {
      console.error('Failed to sync certificate generation to Supabase', err);
    }

    await addNotification(userId, '🎓 Certificate Issued!', `A ${type.toUpperCase()} Certificate has been added to your career achievements.`);

    return newCert;
  };

  const scanQRCode = async (codeString: string) => {
    const qr = qrCodes.find(q => q.code_string === codeString);
    if (!qr) return { success: false };

    const reg = registrations.find(r => r.qr_code_url === codeString);
    if (!reg) return { success: false };

    const updatedQR = qrCodes.map(q => q.code_string === codeString ? { ...q, scanned_at: new Date().toISOString() } : q);
    setQrCodes(updatedQR);
    saveToStorage('qrCodes', updatedQR);

    try {
      await supabase.from('qr_codes').update({ scanned_at: new Date().toISOString() }).eq('code_string', codeString);
    } catch (err) {
      console.error('Failed to sync scanned QR code check-in to Supabase', err);
    }

    const team = teams.find(t => t.id === reg.team_id);
    const tourney = tournaments.find(t => t.id === reg.tournament_id);

    if (team) {
      await addNotification(team.captain_id, 'QR Scanned', `Your team check-in for "${tourney?.name}" has been scanned and verified successfully.`);
    }

    return {
      success: true,
      registration: reg,
      teamName: team?.name || 'Unknown Team',
      tournamentName: tourney?.name || 'Unknown Tournament'
    };
  };

  const addNotification = async (userId: string, title: string, message: string) => {
    const newN: Notification = {
      id: generateUUID(),
      user_id: userId,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setNotifications(prev => {
      const u = [newN, ...prev];
      saveToStorage('notifications', u);
      return u;
    });

    try {
      await supabase.from('notifications').insert(newN);
    } catch (err) {
      console.error('Failed to sync notification to Supabase', err);
    }

    return newN;
  };

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => {
      const u = prev.map(n => n.id === id ? { ...n, is_read: true } : n);
      saveToStorage('notifications', u);
      return u;
    });

    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (err) {
      console.error('Failed to sync marked notification read to Supabase', err);
    }
  };

  const addManagedTopPlayer = async (player: Omit<ManagedTopPlayer, 'id' | 'created_at'>) => {
    const newP: ManagedTopPlayer = {
      ...player,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    const updated = [...managedTopPlayers, newP];
    setManagedTopPlayers(updated);
    saveToStorage('managedTopPlayers', updated);

    try {
      await supabase.from('managed_top_players').insert(newP);
    } catch (err) {
      console.error('Failed to sync managed top player to Supabase', err);
    }

    return newP;
  };

  const editManagedTopPlayer = async (id: string, playerDetails: Partial<ManagedTopPlayer>) => {
    const updated = managedTopPlayers.map(p => p.id === id ? { ...p, ...playerDetails } : p);
    setManagedTopPlayers(updated);
    saveToStorage('managedTopPlayers', updated);

    try {
      await supabase.from('managed_top_players').update(playerDetails).eq('id', id);
    } catch (err) {
      console.error('Failed to sync managed top player edit to Supabase', err);
    }

    return true;
  };

  const deleteManagedTopPlayer = async (id: string) => {
    const updated = managedTopPlayers.filter(p => p.id !== id);
    setManagedTopPlayers(updated);
    saveToStorage('managedTopPlayers', updated);

    try {
      await supabase.from('managed_top_players').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to sync managed top player deletion to Supabase', err);
    }

    return true;
  };

  const addWallOfFrameItem = async (item: Omit<WallOfFrameItem, 'id' | 'created_at'>) => {
    const newI: WallOfFrameItem = {
      ...item,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };
    const updated = [...wallOfFrameItems, newI];
    setWallOfFrameItems(updated);
    saveToStorage('wallOfFrameItems', updated);

    try {
      await supabase.from('wall_of_frame_items').insert(newI);
    } catch (err) {
      console.error('Failed to sync wall of frame item to Supabase', err);
    }

    return newI;
  };

  const editWallOfFrameItem = async (id: string, itemDetails: Partial<WallOfFrameItem>) => {
    const updated = wallOfFrameItems.map(i => i.id === id ? { ...i, ...itemDetails } : i);
    setWallOfFrameItems(updated);
    saveToStorage('wallOfFrameItems', updated);

    try {
      await supabase.from('wall_of_frame_items').update(itemDetails).eq('id', id);
    } catch (err) {
      console.error('Failed to sync wall of frame item edit to Supabase', err);
    }

    return true;
  };

  const deleteWallOfFrameItem = async (id: string) => {
    const updated = wallOfFrameItems.filter(i => i.id !== id);
    setWallOfFrameItems(updated);
    saveToStorage('wallOfFrameItems', updated);

    try {
      await supabase.from('wall_of_frame_items').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to sync wall of frame item deletion to Supabase', err);
    }

    return true;
  };

  const addMatchPerformance = async (performanceData: Omit<MatchPerformance, 'id'>) => {
    const newPerformance: MatchPerformance = {
      ...performanceData,
      id: generateUUID()
    };

    // 1. Save performance record
    const storedPerformances = JSON.parse(localStorage.getItem('crickethub_match_performances') || '[]');
    const updatedPerformances = [...storedPerformances, newPerformance];
    localStorage.setItem('crickethub_match_performances', JSON.stringify(updatedPerformances));
    setMatchPerformances(updatedPerformances);

    // 2. Recalculate stats for this player
    const playerPerf = updatedPerformances.filter((p: MatchPerformance) => p.player_id === newPerformance.player_id);
    
    const matchesPlayed = playerPerf.length;
    const totalRuns = playerPerf.reduce((sum: number, p: MatchPerformance) => sum + p.runs_scored, 0);
    const totalWickets = playerPerf.reduce((sum: number, p: MatchPerformance) => sum + p.wickets_taken, 0);
    
    const highestScore = Math.max(...playerPerf.map((p: MatchPerformance) => p.runs_scored), 0);
    
    const timesOut = playerPerf.filter((p: MatchPerformance) => p.is_out).length;
    const battingAvg = timesOut > 0 ? parseFloat((totalRuns / timesOut).toFixed(2)) : totalRuns;
    
    const totalOvers = playerPerf.reduce((sum: number, p: MatchPerformance) => sum + p.overs_bowled, 0);
    const totalConceded = playerPerf.reduce((sum: number, p: MatchPerformance) => sum + p.runs_conceded, 0);
    const bowlingEcon = totalOvers > 0 ? parseFloat((totalConceded / totalOvers).toFixed(2)) : 0;
    
    const matchesWon = playerPerf.filter((p: MatchPerformance) => p.match_result === 'won').length;
    const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
    
    let bestBowlingStr = '0/0';
    if (playerPerf.length > 0) {
      let bestPerf = playerPerf[0];
      for (const p of playerPerf) {
        if (p.wickets_taken > bestPerf.wickets_taken) {
          bestPerf = p;
        } else if (p.wickets_taken === bestPerf.wickets_taken && p.runs_conceded < bestPerf.runs_conceded) {
          bestPerf = p;
        }
      }
      bestBowlingStr = `${bestPerf.wickets_taken}/${bestPerf.runs_conceded}`;
    }

    // Update playerStats state & localStorage
    const storedStats = JSON.parse(localStorage.getItem('crickethub_playerStats') || '[]');
    let playerStatEntry = storedStats.find((s: any) => s.player_id === newPerformance.player_id);
    
    if (playerStatEntry) {
      playerStatEntry.matches_played = matchesPlayed;
      playerStatEntry.runs = totalRuns;
      playerStatEntry.wickets = totalWickets;
      playerStatEntry.highest_score = highestScore;
      playerStatEntry.best_bowling_figures = bestBowlingStr;
      playerStatEntry.batting_average = battingAvg;
      playerStatEntry.bowling_economy = bowlingEcon;
      playerStatEntry.win_percentage = winRate;
    } else {
      playerStatEntry = {
        id: generateUUID(),
        player_id: newPerformance.player_id,
        matches_played: matchesPlayed,
        runs: totalRuns,
        wickets: totalWickets,
        highest_score: highestScore,
        best_bowling_figures: bestBowlingStr,
        batting_average: battingAvg,
        bowling_economy: bowlingEcon,
        win_percentage: winRate
      };
      storedStats.push(playerStatEntry);
    }
    
    localStorage.setItem('crickethub_playerStats', JSON.stringify(storedStats));
    setPlayerStats(storedStats);

    // Sync to Supabase
    try {
      await supabase.from('match_performances').insert(newPerformance);
      await supabase.from('player_stats').upsert(playerStatEntry);
    } catch (err) {
      console.error('Failed to sync match performance to Supabase', err);
    }
    
    // Also notify
    await addNotification(
      newPerformance.player_id,
      'Match Score Entered!',
      `Admin added your stats for the match in "${newPerformance.tournament_name}". Your Career Statistics have been updated.`
    );
  };

  const deleteUser = async (userId: string) => {
    // 1. Find user's teams
    const userTeamIds = teams.filter(t => t.captain_id === userId).map(t => t.id);

    // 2. Remove profile
    const newProfiles = profiles.filter(p => p.id !== userId);
    setProfiles(newProfiles);
    localStorage.setItem('crickethub_profiles', JSON.stringify(newProfiles));

    // 3. Remove player stats
    const newStats = playerStats.filter(s => s.player_id !== userId);
    setPlayerStats(newStats);
    localStorage.setItem('crickethub_playerStats', JSON.stringify(newStats));

    // 4. Remove teams owned by this user
    const newTeams = teams.filter(t => t.captain_id !== userId);
    setTeams(newTeams);
    localStorage.setItem('crickethub_teams', JSON.stringify(newTeams));

    // 5. Remove team members belonging to those teams
    const newMembers = teamMembers.filter(m => !userTeamIds.includes(m.team_id));
    setTeamMembers(newMembers);
    localStorage.setItem('crickethub_teamMembers', JSON.stringify(newMembers));

    // 6. Remove registrations for those teams
    const newRegs = registrations.filter(r => !userTeamIds.includes(r.team_id));
    setRegistrations(newRegs);
    localStorage.setItem('crickethub_registrations', JSON.stringify(newRegs));

    // 7. Remove fixtures involving those teams
    const newFixtures = fixtures.filter(
      f => !userTeamIds.includes(f.team1_id) && !userTeamIds.includes(f.team2_id)
    );
    setFixtures(newFixtures);
    localStorage.setItem('crickethub_fixtures', JSON.stringify(newFixtures));

    // 8. Remove match scores involving those teams
    const newMatches = matches.filter(
      m => !userTeamIds.includes(m.team1_id) && !userTeamIds.includes(m.team2_id)
    );
    setMatches(newMatches);
    localStorage.setItem('crickethub_matches', JSON.stringify(newMatches));

    // 9. Remove match performances
    const newPerformances = matchPerformances.filter(p => p.player_id !== userId);
    setMatchPerformances(newPerformances);
    localStorage.setItem('crickethub_match_performances', JSON.stringify(newPerformances));

    // 10. Remove user badges
    const newUserBadges = userBadges.filter(b => b.user_id !== userId);
    setUserBadges(newUserBadges);
    localStorage.setItem('crickethub_userBadges', JSON.stringify(newUserBadges));

    // 11. Remove certificates
    const newCerts = certificates.filter(c => c.user_id !== userId);
    setCertificates(newCerts);
    localStorage.setItem('crickethub_certificates', JSON.stringify(newCerts));

    // 12. Remove notifications
    const newNotifs = notifications.filter(n => n.user_id !== userId);
    setNotifications(newNotifs);
    localStorage.setItem('crickethub_notifications', JSON.stringify(newNotifs));

    // 13. Remove user memberships
    const newMemberships = userMemberships.filter(m => m.user_id !== userId);
    setUserMemberships(newMemberships);
    localStorage.setItem('crickethub_userMemberships', JSON.stringify(newMemberships));

    // 14. Remove from passwords store
    const storedPasswords = JSON.parse(localStorage.getItem('crickethub_passwords') || '{}');
    const userProfile = profiles.find(p => p.id === userId);
    if (userProfile?.email) {
      delete storedPasswords[userProfile.email];
      localStorage.setItem('crickethub_passwords', JSON.stringify(storedPasswords));
    }

    // 15. Remove QR codes for deleted registrations
    const deletedRegIds = registrations.filter(r => userTeamIds.includes(r.team_id)).map(r => r.id);
    const newQR = qrCodes.filter(q => !deletedRegIds.includes(q.registration_id));
    setQrCodes(newQR);
    localStorage.setItem('crickethub_qrCodes', JSON.stringify(newQR));

    // 16. Try to delete from Supabase too (non-fatal)
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (_) {
      // Supabase deletion is non-fatal
    }
  };

  const resetAllData = async () => {
    localStorage.removeItem('crickethub_profiles');
    localStorage.removeItem('crickethub_tournaments');
    localStorage.removeItem('crickethub_teams');
    localStorage.removeItem('crickethub_teamMembers');
    localStorage.removeItem('crickethub_registrations');
    localStorage.removeItem('crickethub_fixtures');
    localStorage.removeItem('crickethub_matches');
    localStorage.removeItem('crickethub_playerStats');
    localStorage.removeItem('crickethub_userBadges');
    localStorage.removeItem('crickethub_certificates');
    localStorage.removeItem('crickethub_payments');
    localStorage.removeItem('crickethub_notifications');
    localStorage.removeItem('crickethub_qrCodes');
    localStorage.removeItem('crickethub_userMemberships');
    localStorage.removeItem('crickethub_managedTopPlayers');
    localStorage.removeItem('crickethub_wallOfFrameItems');
    localStorage.removeItem('crickethub_match_performances');
 
     try {
       await supabase.from('qr_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('match_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('player_stats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('user_badges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('certificates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('user_memberships').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
       await supabase.from('tournaments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        try {
          await supabase.from('managed_top_players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('wall_of_frame_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('match_performances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch(e) {}
 
       await supabase.from('profiles').insert(INITIAL_PROFILES);
       await supabase.from('tournaments').insert(INITIAL_TOURNAMENTS);
       await supabase.from('teams').insert(INITIAL_TEAMS);
       await supabase.from('team_members').insert(INITIAL_TEAM_MEMBERS);
       await supabase.from('registrations').insert(INITIAL_REGISTRATIONS);
       await supabase.from('fixtures').insert(INITIAL_FIXTURES);
       await supabase.from('matches').insert(INITIAL_MATCHES);
       await supabase.from('player_stats').insert(INITIAL_PLAYER_STATS);
       await supabase.from('user_badges').insert(INITIAL_USER_BADGES);
       await supabase.from('certificates').insert(INITIAL_CERTIFICATES);
       await supabase.from('qr_codes').insert(INITIAL_QR);
       try {
         await supabase.from('managed_top_players').insert(INITIAL_MANAGED_TOP_PLAYERS);
         await supabase.from('wall_of_frame_items').insert(INITIAL_WALL_OF_FRAME_ITEMS);
       } catch(e) {}
 
       const initialNotif: Notification[] = [
         { id: generateUUID(), user_id: 'd1000000-0000-0000-0000-000000000001', title: 'Welcome Cricketer!', message: 'Explore tournaments, upgrade your membership, or check upcoming match fixtures.', is_read: false, created_at: new Date().toISOString() }
       ];
       await supabase.from('notifications').insert(initialNotif);
 
       const initialUM: UserMembership[] = [
         { id: '41000000-0000-0000-0000-000000000001', user_id: 'd1000000-0000-0000-0000-000000000001', membership_id: 'gold', status: 'active', created_at: new Date().toISOString() }
       ];
       await supabase.from('user_memberships').insert(initialUM);
     } catch (err) {
       console.error('Failed to reset live database in Supabase', err);
     }
 
     setProfiles(INITIAL_PROFILES);
     setTournaments(INITIAL_TOURNAMENTS);
     setTeams(INITIAL_TEAMS);
     setTeamMembers(INITIAL_TEAM_MEMBERS);
     setRegistrations(INITIAL_REGISTRATIONS);
     setFixtures(INITIAL_FIXTURES);
     setMatches(INITIAL_MATCHES);
     setPlayerStats(INITIAL_PLAYER_STATS);
     setUserBadges(INITIAL_USER_BADGES);
     setCertificates(INITIAL_CERTIFICATES);
     setPayments([]);
     setNotifications([
       { id: generateUUID(), user_id: 'd1000000-0000-0000-0000-000000000001', title: 'Welcome Cricketer!', message: 'Explore tournaments, upgrade your membership, or check upcoming match fixtures.', is_read: false, created_at: new Date().toISOString() }
     ]);
     setQrCodes(INITIAL_QR);
     setUserMemberships([
       { id: '41000000-0000-0000-0000-000000000001', user_id: 'd1000000-0000-0000-0000-000000000001', membership_id: 'gold', status: 'active', created_at: new Date().toISOString() }
     ]);
     setManagedTopPlayers(INITIAL_MANAGED_TOP_PLAYERS);
     setWallOfFrameItems(INITIAL_WALL_OF_FRAME_ITEMS);
     setMatchPerformances([]);
   };
 
   return (
     <DatabaseContext.Provider value={{
       profiles,
       tournaments,
       teams,
       teamMembers,
       registrations,
       fixtures,
       matches,
       playerStats,
       badges,
       userBadges,
       certificates,
       payments,
       notifications,
       qrCodes,
       memberships,
       userMemberships,
       managedTopPlayers,
       wallOfFrameItems,
       matchPerformances,
       registerTeam,
       addTournament,
       editTournament,
       deleteTournament,
       updateTournamentStatus,
       approveTeam,
       generateFixtures,
       updateLiveMatch,
       processLiveBall,
       upgradeMembership,
       awardBadge,
       generateCertificate,
       scanQRCode,
       addNotification,
       markNotificationRead,
       addManagedTopPlayer,
       editManagedTopPlayer,
       deleteManagedTopPlayer,
       addWallOfFrameItem,
       editWallOfFrameItem,
       deleteWallOfFrameItem,
       addMatchPerformance,
       deleteUser,
       resetAllData
     }}>
       {children}
     </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
  return context;
};
