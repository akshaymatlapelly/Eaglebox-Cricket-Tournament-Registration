'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase, Tournament } from '@/contexts/DatabaseContext';
import { useNotification } from '@/contexts/NotificationContext';
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users,
  ShieldCheck
} from 'lucide-react';

function TournamentsManagerContent() {
  const router = useRouter();
  const { tournaments, addTournament, editTournament, deleteTournament } = useDatabase();
  const { showToast } = useNotification();

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTourney, setEditingTourney] = useState<Tournament | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [teamLimit, setTeamLimit] = useState('');
  const [rules, setRules] = useState('');
  const [playersPerTeam, setPlayersPerTeam] = useState('11');

  const openAddModal = () => {
    setEditingTourney(null);
    setName('');
    setDescription('');
    setBannerUrl('https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800');
    setVenue('');
    setStartDate('');
    setEndDate('');
    setPrizePool('100000');
    setEntryFee('1000');
    setTeamLimit('8');
    setRules('Standard T20 rules. Max 15 players per team roster.');
    setPlayersPerTeam('11');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tournament) => {
    setEditingTourney(t);
    setName(t.name);
    setDescription(t.description);
    setBannerUrl(t.banner_url);
    setVenue(t.venue);
    setStartDate(t.start_date);
    setEndDate(t.end_date);
    setPrizePool(t.prize_pool.toString());
    setEntryFee(t.entry_fee.toString());
    setTeamLimit(t.team_limit.toString());
    setRules(t.rules);
    setPlayersPerTeam((t.players_per_team || 11).toString());
    setIsModalOpen(true);
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !venue || !startDate || !endDate || !prizePool || !entryFee || !teamLimit || !playersPerTeam) {
      showToast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    const payload = {
      name,
      description,
      banner_url: bannerUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800',
      venue,
      start_date: startDate,
      end_date: endDate,
      prize_pool: parseFloat(prizePool),
      entry_fee: parseFloat(entryFee),
      team_limit: parseInt(teamLimit),
      rules,
      status: (editingTourney ? editingTourney.status : 'upcoming') as Tournament['status'],
      players_per_team: parseInt(playersPerTeam) || 11
    };

    try {
      if (editingTourney) {
        // Edit mode
        await editTournament(editingTourney.id, payload);
        showToast('Success', `Tournament "${name}" edited successfully.`, 'success');
      } else {
        // Add mode
        await addTournament(payload);
        showToast('Success', `Tournament "${name}" added successfully.`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast('Database Error', err.message || 'Failed to save tournament to database.', 'error');
    }
  };

  const handleDelete = async (id: string, tournamentName: string) => {
    if (confirm(`Are you sure you want to delete "${tournamentName}"?`)) {
      try {
        await deleteTournament(id);
        showToast('Deleted', `Tournament "${tournamentName}" was removed.`, 'success');
      } catch (err: any) {
        console.error(err);
        showToast('Database Error', err.message || 'Failed to delete tournament.', 'error');
      }
    }
  };



  return (
    <div className="space-y-10">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-slate-900 pb-6">
          <div>
            <h1 className="font-display font-black text-3xl text-white">TOURNAMENTS MANAGEMENT</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Create leagues, update structures, or remove active entries
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 bg-[#10b981] hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              Add Tournament
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Tournaments Data Grid */}
        {tournaments.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-16">No tournaments found. Create one above to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map((t) => (
              <div key={t.id} className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden hover:border-slate-800 transition duration-300 flex flex-col justify-between max-w-sm w-full">
                <div>
                  <div className="h-40 relative overflow-hidden">
                    <img 
                      src={t.banner_url} 
                      alt={t.name} 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 right-3 bg-black/80 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                      {t.status}
                    </span>
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="font-display font-bold text-base text-slate-200">{t.name}</h3>
                    
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#10b981]" />
                        <span className="truncate">{t.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#10b981]" />
                        <span>{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-900/40 p-2.5 border border-slate-900 rounded-xl mt-3 text-[10px]">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Prize Pool</p>
                          <p className="font-bold text-white mt-0.5">₹{t.prize_pool.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Entry Fee</p>
                          <p className="font-bold text-[#10b981] mt-0.5">₹{t.entry_fee.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Structure</p>
                          <p className="font-bold text-white mt-0.5">{t.team_limit}T / {t.players_per_team || 11}P</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer controls */}
                <div className="p-6 bg-slate-900/20 border-t border-slate-900 flex gap-3">
                  <button
                    onClick={() => openEditModal(t)}
                    className="flex-1 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5 text-sky-400" />
                    Edit Details
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="py-2 px-3.5 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950 text-xs font-bold text-rose-400 hover:text-rose-200 rounded-xl transition"
                    title="Delete Tournament"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0c0f17] border border-slate-850 max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-display font-black text-lg text-slate-200 uppercase tracking-wider">
                {editingTourney ? 'Edit Tournament' : 'Add Tournament Details'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveTournament} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tournament Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer Smash T20"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Venue Location *</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Stadium name, City"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Prize Pool (INR) *</label>
                  <input
                    type="number"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Entry Fee (INR) *</label>
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    placeholder="1500"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Team limit *</label>
                  <input
                    type="number"
                    value={teamLimit}
                    onChange={(e) => setTeamLimit(e.target.value)}
                    placeholder="16"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Players Per Team *</label>
                  <input
                    type="number"
                    value={playersPerTeam}
                    onChange={(e) => setPlayersPerTeam(e.target.value)}
                    placeholder="e.g. 11"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition"
                    required
                  />
                </div>

              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief details summary..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition h-20 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tournament Rules</label>
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Specify regulations guidelines..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#10b981] rounded-xl text-xs text-slate-100 focus:outline-none transition h-20 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-[#10b981] hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition"
                >
                  {editingTourney ? 'Save Updates' : 'Add Tournament'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default function TournamentsManager() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#080a10] text-slate-400">
        Loading Tournaments Editor...
      </div>
    }>
      <TournamentsManagerContent />
    </Suspense>
  );
}
