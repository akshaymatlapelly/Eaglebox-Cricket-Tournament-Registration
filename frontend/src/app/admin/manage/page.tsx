'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDatabase, ManagedTopPlayer, WallOfFrameItem } from '@/contexts/DatabaseContext';
import { useNotification } from '@/contexts/NotificationContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Star, 
  Trophy, 
  User, 
  Image, 
  Layers,
  ArrowLeft
} from 'lucide-react';

export default function ManagePage() {
  const router = useRouter();
  const { 
    managedTopPlayers, 
    wallOfFrameItems, 
    addManagedTopPlayer, 
    editManagedTopPlayer, 
    deleteManagedTopPlayer, 
    addWallOfFrameItem, 
    editWallOfFrameItem, 
    deleteWallOfFrameItem 
  } = useDatabase();
  
  const { showToast } = useNotification();

  // Active Tab: 'players' | 'frame'
  const [activeTab, setActiveTab] = useState<'players' | 'frame'>('players');

  // Modal states
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<ManagedTopPlayer | null>(null);
  
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const [editingFrameItem, setEditingFrameItem] = useState<WallOfFrameItem | null>(null);

  // Player Form state
  const [playerName, setPlayerName] = useState('');
  const [playerAvatarUrl, setPlayerAvatarUrl] = useState('');
  const [playerTeamName, setPlayerTeamName] = useState('');
  const [playerRuns, setPlayerRuns] = useState('0');
  const [playerWickets, setPlayerWickets] = useState('0');

  // Frame Item Form state
  const [frameTitle, setFrameTitle] = useState('');
  const [frameAchievementType, setFrameAchievementType] = useState('Tournament Champion');
  const [frameYear, setFrameYear] = useState('');
  const [frameSubjectName, setFrameSubjectName] = useState('');
  const [frameDescription, setFrameDescription] = useState('');
  const [frameKeyStats, setFrameKeyStats] = useState('');
  const [frameVenue, setFrameVenue] = useState('');
  const [frameHighlightBadge, setFrameHighlightBadge] = useState('');
  const [frameImageUrl, setFrameImageUrl] = useState('');

  // ------------------ PLAYER HANDLERS ------------------
  const openAddPlayerModal = () => {
    setEditingPlayer(null);
    setPlayerName('');
    setPlayerAvatarUrl('');
    setPlayerTeamName('');
    setPlayerRuns('0');
    setPlayerWickets('0');
    setIsPlayerModalOpen(true);
  };

  const openEditPlayerModal = (player: ManagedTopPlayer) => {
    setEditingPlayer(player);
    setPlayerName(player.name);
    setPlayerAvatarUrl(player.avatar_url || '');
    setPlayerTeamName(player.team_name || '');
    setPlayerRuns(player.runs.toString());
    setPlayerWickets(player.wickets.toString());
    setIsPlayerModalOpen(true);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      showToast('Validation Error', 'Player name is required.', 'error');
      return;
    }

    const payload = {
      name: playerName.trim(),
      avatar_url: playerAvatarUrl.trim() || undefined,
      team_name: playerTeamName.trim() || undefined,
      runs: parseInt(playerRuns) || 0,
      wickets: parseInt(playerWickets) || 0
    };

    if (editingPlayer) {
      await editManagedTopPlayer(editingPlayer.id, payload);
      showToast('Success', `Player "${playerName}" updated successfully.`, 'success');
    } else {
      await addManagedTopPlayer(payload);
      showToast('Success', `Player "${playerName}" added successfully.`, 'success');
    }

    setIsPlayerModalOpen(false);
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete player "${name}"?`)) {
      await deleteManagedTopPlayer(id);
      showToast('Deleted', `Player "${name}" removed.`, 'success');
    }
  };

  // ------------------ WALL OF FRAME HANDLERS ------------------
  const openAddFrameModal = () => {
    setEditingFrameItem(null);
    setFrameTitle('');
    setFrameAchievementType('Tournament Champion');
    setFrameYear(new Date().getFullYear().toString());
    setFrameSubjectName('');
    setFrameDescription('');
    setFrameKeyStats('');
    setFrameVenue('');
    setFrameHighlightBadge('');
    setFrameImageUrl('');
    setIsFrameModalOpen(true);
  };

  const openEditFrameModal = (item: WallOfFrameItem) => {
    setEditingFrameItem(item);
    setFrameTitle(item.title);
    setFrameAchievementType(item.achievement_type || 'Tournament Champion');
    setFrameYear(item.year || '');
    setFrameSubjectName(item.subject_name || '');
    setFrameDescription(item.description);
    setFrameKeyStats(item.key_stats || '');
    setFrameVenue(item.venue || '');
    setFrameHighlightBadge(item.highlight_badge || '');
    setFrameImageUrl(item.image_url || '');
    setIsFrameModalOpen(true);
  };

  const handleSaveFrameItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frameTitle.trim() || !frameYear.trim() || !frameSubjectName.trim() || !frameDescription.trim()) {
      showToast('Validation Error', 'Title, Year, Team/Player Name, and Description are required.', 'error');
      return;
    }

    if (!editingFrameItem && wallOfFrameItems.length >= 1) {
      showToast('Limit Reached', 'You can only add a maximum of 1 achievement to the Wall of Fame. Please edit or delete the existing one.', 'error');
      return;
    }

    const payload = {
      title: frameTitle.trim(),
      achievement_type: frameAchievementType,
      year: frameYear.trim(),
      subject_name: frameSubjectName.trim(),
      description: frameDescription.trim(),
      key_stats: frameKeyStats.trim() || undefined,
      venue: frameVenue.trim() || undefined,
      highlight_badge: frameHighlightBadge || undefined,
      image_url: frameImageUrl.trim() || undefined
    };

    if (editingFrameItem) {
      await editWallOfFrameItem(editingFrameItem.id, payload);
      showToast('Success', `Achievement "${frameTitle}" updated successfully.`, 'success');
    } else {
      await addWallOfFrameItem(payload);
      showToast('Success', `Achievement "${frameTitle}" added successfully.`, 'success');
    }

    setIsFrameModalOpen(false);
  };

  const handleDeleteFrameItem = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}" from Wall of Fame?`)) {
      await deleteWallOfFrameItem(id);
      showToast('Deleted', `"${title}" was removed.`, 'success');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="font-display font-black text-3xl text-white tracking-wide">CONTENT MANAGEMENT</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Add, edit, or delete Top Players and Wall of Fame records
          </p>
        </div>

        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
      </div>

      {/* Tabs Controller */}
      <div className="flex border-b border-slate-900 gap-6">
        <button
          onClick={() => setActiveTab('players')}
          className={`pb-4 text-xs uppercase tracking-widest font-black transition relative cursor-pointer ${
            activeTab === 'players' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Top Performers ({managedTopPlayers?.length || 0})
          </span>
          {activeTab === 'players' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('frame')}
          className={`pb-4 text-xs uppercase tracking-widest font-black transition relative cursor-pointer ${
            activeTab === 'frame' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Wall of Fame ({wallOfFrameItems?.length || 0})
          </span>
          {activeTab === 'frame' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          )}
        </button>
      </div>

      {/* TAB content: Players */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-[#0a0d16]/30 p-4 rounded-2xl border border-slate-900">
            <span className="text-xs font-semibold text-slate-400">
              Set the stars that appear in the homepage Top Performers box.
            </span>
            <button
              onClick={openAddPlayerModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
          </div>

          {/* Players Table */}
          {(!managedTopPlayers || managedTopPlayers.length === 0) ? (
            <div className="text-center p-16 bg-slate-950/30 rounded-3xl border border-slate-900 border-dashed">
              <p className="text-xs text-slate-500 italic">No top players created yet. Click Add Player above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-900 bg-slate-950/30 rounded-3xl">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-900 bg-[#0a0d16]/50">
                    <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Player</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Team</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">Runs</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">Wickets</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {managedTopPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-900/10 transition">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 overflow-hidden shrink-0">
                          {player.avatar_url ? (
                            <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            player.name.substring(0, 1)
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{player.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {player.id.substring(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-300 font-semibold">{player.team_name || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-slate-300 font-mono">{player.runs}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-slate-300 font-mono">{player.wickets}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditPlayerModal(player)}
                            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer border border-slate-800"
                            title="Edit Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            className="p-2 bg-rose-950/20 hover:bg-rose-950 text-rose-400 hover:text-rose-200 rounded-xl transition cursor-pointer border border-rose-900/10"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB content: Wall of Fame */}
      {activeTab === 'frame' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-[#0a0d16]/30 p-4 rounded-2xl border border-slate-900">
            <span className="text-xs font-semibold text-slate-400">
              Manage tournament champions, star players, records, and historic achievements on the Wall of Fame.
            </span>
            <button
              onClick={openAddFrameModal}
              disabled={wallOfFrameItems.length >= 1}
              className={`px-4 py-2 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg ${
                wallOfFrameItems.length >= 1
                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed shadow-none'
                  : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/10 cursor-pointer'
              }`}
            >
              <Plus className="w-4 h-4" />
              {wallOfFrameItems.length >= 1 ? 'Limit Reached (Max 1)' : 'Add Achievement'}
            </button>
          </div>

          {/* Wall of Fame Items List */}
          {(!wallOfFrameItems || wallOfFrameItems.length === 0) ? (
            <div className="text-center p-16 bg-slate-950/30 rounded-3xl border border-slate-900 border-dashed">
              <p className="text-xs text-slate-500 italic">No achievements on the Wall of Fame yet. Click Add Achievement above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallOfFrameItems.map((item) => (
                <div key={item.id} className="p-6 bg-slate-950 border border-slate-900 rounded-3xl flex justify-between gap-4 hover:border-slate-800 transition">
                  <div className="flex gap-4 min-w-0 flex-1 flex-col sm:flex-row">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.highlight_badge && (
                          <span className="text-[8px] uppercase tracking-widest font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                            {item.highlight_badge}
                          </span>
                        )}
                        <span className="text-[9px] text-[#10b981] font-mono bg-[#10b981]/5 px-2 py-0.5 rounded border border-[#10b981]/10">
                          {item.achievement_type}
                        </span>
                        {item.year && (
                          <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">{item.year}</span>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">by {item.subject_name}</p>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{item.description}</p>

                      {item.key_stats && (
                        <div className="bg-slate-900/60 p-2 rounded-xl text-[9px] font-mono text-emerald-400/90 border border-slate-850 flex gap-2">
                          <span className="text-slate-500 uppercase tracking-widest font-bold">Stats:</span>
                          {item.key_stats}
                        </div>
                      )}

                      {item.venue && (
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">📍 {item.venue}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 justify-start">
                    <button
                      onClick={() => openEditFrameModal(item)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer border border-slate-800"
                      title="Edit Achievement"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFrameItem(item.id, item.title)}
                      className="p-2 bg-rose-950/20 hover:bg-rose-950 text-rose-400 hover:text-rose-200 rounded-xl transition cursor-pointer border border-rose-900/10"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------ PLAYER ADD/EDIT MODAL ------------------ */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0a0d16] border border-slate-900 w-full max-w-md rounded-3xl p-6 relative">
            <button
              onClick={() => setIsPlayerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-display font-black text-xl text-white mb-6 border-b border-slate-900 pb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {editingPlayer ? 'EDIT PLAYER' : 'ADD NEW PLAYER'}
            </h2>

            <form onSubmit={handleSavePlayer} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Player Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Virat Sharma"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Avatar URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or blank"
                  value={playerAvatarUrl}
                  onChange={(e) => setPlayerAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Club / Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai Titans"
                  value={playerTeamName}
                  onChange={(e) => setPlayerTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Total Runs</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={playerRuns}
                    onChange={(e) => setPlayerRuns(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Total Wickets</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={playerWickets}
                    onChange={(e) => setPlayerWickets(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlayerModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#10b981] hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  {editingPlayer ? 'Save Changes' : 'Create Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------ WALL OF FAME ADD/EDIT MODAL ------------------ */}
      {isFrameModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0a0d16] border border-slate-900 w-full max-w-md rounded-3xl p-6 relative">
            <button
              onClick={() => setIsFrameModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-display font-black text-xl text-white mb-6 border-b border-slate-900 pb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              {editingFrameItem ? 'EDIT ACHIEVEMENT' : 'ADD ACHIEVEMENT'}
            </h2>

            <form onSubmit={handleSaveFrameItem} className="space-y-4 text-left max-h-[75vh] overflow-y-auto pr-1 scrollbar-thin">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Achievement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Champions of Chinnaswamy 2025"
                  value={frameTitle}
                  onChange={(e) => setFrameTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Achievement Type *</label>
                  <select
                    value={frameAchievementType}
                    onChange={(e) => setFrameAchievementType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 transition text-xs"
                  >
                    <option value="Tournament Champion">Tournament Champion</option>
                    <option value="Player of the Tournament">Player of the Tournament</option>
                    <option value="Highest Run Scorer">Highest Run Scorer</option>
                    <option value="Highest Wicket Taker">Highest Wicket Taker</option>
                    <option value="Best Team Performance">Best Team Performance</option>
                    <option value="Record Achievement">Record Achievement</option>
                    <option value="Special Recognition">Special Recognition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Year *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025"
                    value={frameYear}
                    onChange={(e) => setFrameYear(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Team / Player Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad Strikers"
                    value={frameSubjectName}
                    onChange={(e) => setFrameSubjectName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Highlight Badge</label>
                  <select
                    value={frameHighlightBadge}
                    onChange={(e) => setFrameHighlightBadge(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 transition text-xs"
                  >
                    <option value="">None</option>
                    <option value="Champions">Champions</option>
                    <option value="MVP">MVP</option>
                    <option value="Record Breaker">Record Breaker</option>
                    <option value="Unbeaten">Unbeaten</option>
                    <option value="Legends">Legends</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Hyderabad Strikers won the EagleBox Premier League 2025 after an unbeaten season."
                  value={frameDescription}
                  onChange={(e) => setFrameDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Key Statistics</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 Wins • 0 Losses • 620 Runs"
                    value={frameKeyStats}
                    onChange={(e) => setFrameKeyStats(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Chinnaswamy Stadium"
                    value={frameVenue}
                    onChange={(e) => setFrameVenue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFrameModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#10b981] hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  {editingFrameItem ? 'Save Changes' : 'Create Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
