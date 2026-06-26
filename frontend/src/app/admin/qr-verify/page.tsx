'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDatabase, Team, Tournament, Registration, TeamMember } from '@/contexts/DatabaseContext';
import { useNotification } from '@/contexts/NotificationContext';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  ShieldCheck, 
  Camera, 
  Upload, 
  Users, 
  Check, 
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function QRVerify() {
  const { registrations, teams, tournaments, qrCodes, scanQRCode, teamMembers } = useDatabase();
  const { showToast } = useNotification();
  
  const [scanCodeField, setScanCodeField] = useState('');
  const [lastCheckIn, setLastCheckIn] = useState<{
    success: boolean;
    teamName?: string;
    tournamentName?: string;
    message?: string;
    qrCode?: string;
    team?: Team;
    tournament?: Tournament;
    registration?: Registration;
    members?: TeamMember[];
    scannedAt?: string;
  } | null>(null);

  // HTML5 Camera Scanner States & Refs
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const scannerRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const handleGateCheckIn = async (code: string) => {
    if (!code.trim()) return;
    const res = await scanQRCode(code.trim());
    
    // Find matching details for display card
    const qr = qrCodes.find(q => q.code_string === code.trim()) || { scanned_at: new Date().toISOString() };
    const reg = res.registration || registrations.find(r => r.qr_code_url === code.trim());
    const teamObj = teams.find(t => t.id === reg?.team_id);
    const tourneyObj = tournaments.find(t => t.id === reg?.tournament_id);
    const membersList = teamMembers.filter(m => m.team_id === reg?.team_id);

    if (res.success) {
      setLastCheckIn({
        success: true,
        teamName: res.teamName || teamObj?.name,
        tournamentName: res.tournamentName || tourneyObj?.name,
        qrCode: code.trim(),
        team: teamObj,
        tournament: tourneyObj,
        registration: reg,
        members: membersList,
        scannedAt: qr.scanned_at || new Date().toISOString()
      });
      showToast('Gate Check-in Approved', `Squad "${res.teamName || teamObj?.name}" verified for entry!`, 'success');
      setScanCodeField('');
    } else {
      setLastCheckIn({
        success: false,
        message: 'Ticket token not found or already processed.',
        qrCode: code.trim()
      });
      showToast('Check-in Refused', 'Gate pass token not found or invalid.', 'error');
    }
  };

  // Start Camera QR Scanner
  const startCamera = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const devices = await Html5Qrcode.getCameras();
      setCameraDevices(devices);
      
      let cameraId = '';
      if (devices && devices.length > 0) {
        // Prefer back camera
        const backCam = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        );
        cameraId = backCam ? backCam.id : devices[0].id;
        setSelectedCameraId(cameraId);
      } else {
        showToast('No Camera Found', 'Could not locate any camera devices.', 'error');
        return;
      }

      setIsScanning(true);
      const scanner = new Html5Qrcode('lens-scanner-viewport');
      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 20,
          qrbox: (width: number, height: number) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
        },
        (decodedText: string) => {
          handleGateCheckIn(decodedText);
          // Stop camera after successful scan
          if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              setIsScanning(false);
              scannerRef.current = null;
            }).catch((err: unknown) => console.error('Error stopping camera', err));
          }
        },
        () => {
          // Verbose log suppressed
        }
      );
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast('Camera Error', errMsg || 'Failed to start camera scanner.', 'error');
      setIsScanning(false);
    }
  };

  // Stop Camera QR Scanner
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err: unknown) {
        console.error('Failed to stop camera scanner', err);
      }
    }
  };

  // Switch Camera Device
  const switchCamera = async (cameraId: string) => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        setSelectedCameraId(cameraId);
        
        await scannerRef.current.start(
          cameraId,
          {
            fps: 20,
            qrbox: (width: number, height: number) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText: string) => {
            handleGateCheckIn(decodedText);
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().then(() => {
                setIsScanning(false);
                scannerRef.current = null;
              }).catch((err: unknown) => console.error(err));
            }
          },
          () => {}
        );
      } catch (err: unknown) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Camera Switch Error', errMsg || 'Failed to switch camera.', 'error');
      }
    }
  };

  // Scan from uploaded file
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempId = 'temp-lens-picker-viewport';
      let tempEl = document.getElementById(tempId);
      if (!tempEl) {
        tempEl = document.createElement('div');
        tempEl.id = tempId;
        tempEl.style.display = 'none';
        document.body.appendChild(tempEl);
      }
      
      const tempScanner = new Html5Qrcode(tempId);
      const decodedText = await tempScanner.scanFile(file, true);
      handleGateCheckIn(decodedText);
      
      tempScanner.clear();
      tempEl.remove();
    } catch (err: unknown) {
      console.error(err);
      showToast('Scan Failed', 'No valid QR code found in selected image.', 'error');
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        if (scanner.isScanning) {
          scanner.stop().catch((err: unknown) => console.error('Cleanup stop error', err));
        }
      }
    };
  }, []);

  const pendingPasses = qrCodes.filter(q => !q.scanned_at);
  const checkedInPasses = qrCodes.filter(q => !!q.scanned_at);

  return (
    <div className="space-y-10 font-sans">
      {/* Styles for Google Lens scanning effect */}
      <style>{`
        @keyframes scan-laser {
          0% { transform: translateY(0); }
          50% { transform: translateY(calc(240px - 2px)); }
          100% { transform: translateY(0); }
        }
        .animate-scan-laser {
          animation: scan-laser 2.5s infinite linear;
        }
        /* Custom video scaling for html5-qrcode output */
        #lens-scanner-viewport video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem;
        }
      `}</style>

      {/* Title */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="font-display font-black text-3xl text-white flex items-center gap-2">
          QR VERIFICATION GATEWAY
          <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-black rounded-full uppercase tracking-wider">
            Gate Terminal
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
          Simulate check-ins, verify player rosters, and authorize entries at venue gates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Terminal Left side */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Google Lens Camera Scanner Card */}
          <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-sm sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                Google Camera Lens Scanner
              </h3>
              
              {isScanning && cameraDevices.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => switchCamera(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {cameraDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.label || `Camera ${cameraDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Viewport Frame */}
            <div className="relative w-full h-[260px] bg-[#020306] border border-slate-900 rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-inner">
              
              {/* Camera Scanner viewport output */}
              <div 
                id="lens-scanner-viewport" 
                className={`w-full h-full rounded-2xl ${isScanning ? 'block' : 'hidden'}`}
              />

              {/* Viewport Overlay Mock/Effects */}
              {!isScanning && (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-850 flex items-center justify-center text-slate-500 relative">
                    <Camera className="w-8 h-8" />
                    <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-wide">Camera Scanner Offline</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      Grant camera permissions and point Google Lens at player ticket passes or QR codes to scan.
                    </p>
                  </div>
                </div>
              )}

              {/* Google Lens Frame corners */}
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                {/* Central bracket target */}
                <div className="relative w-[180px] h-[180px]">
                  {/* Rounded Corner brackets */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-500 rounded-br-xl" />
                </div>
              </div>

              {/* Scanning Laser Line */}
              {isScanning && (
                <div className="absolute inset-x-0 top-0 h-[240px] pointer-events-none z-10 flex items-center justify-center">
                  <div className="w-[180px] h-full relative">
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_8px_#f59e0b] animate-scan-laser" />
                  </div>
                </div>
              )}
            </div>

            {/* Scanner Controls */}
            <div className="flex flex-wrap gap-3 pt-2">
              {!isScanning ? (
                <button
                  onClick={startCamera}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 hover:scale-[1.02]"
                >
                  <Camera className="w-4 h-4" />
                  Launch Lens Scanner
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 text-xs font-bold rounded-xl transition duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  Shutdown Camera
                </button>
              )}

              <button
                onClick={() => document.getElementById('lens-file-picker')?.click()}
                className="px-5 py-3 bg-slate-950 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/60 text-slate-300 text-xs font-bold rounded-xl transition duration-200 flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                Scan Pass Image File
              </button>
              <input
                type="file"
                id="lens-file-picker"
                className="hidden"
                accept="image/*"
                onChange={handleFileScan}
              />
            </div>
          </div>

          {/* Results display */}
          {lastCheckIn && (
            <div className={`p-8 rounded-3xl border transition-all duration-300 ${
              lastCheckIn.success 
                ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-250 shadow-lg shadow-emerald-500/5 animate-fade-in' 
                : 'bg-rose-950/15 border-rose-500/30 text-rose-350 shadow-lg shadow-rose-500/5 animate-fade-in'
            }`}>
              {lastCheckIn.success ? (
                <div className="space-y-6">
                  {/* Verification Status Banner */}
                  <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-black text-sm uppercase tracking-wide text-white">Squad Check-In Approved</h4>
                        <p className="text-[10px] text-slate-450 mt-0.5">MATCHED & VALIDATED IN REGISTRY</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black rounded-full uppercase tracking-wider">
                      Authorized Entry
                    </span>
                  </div>

                  {/* Scanned Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-black block">Squad / Team Name</span>
                      <strong className="text-slate-100 text-sm uppercase tracking-wide">{lastCheckIn.teamName}</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-black block">League / Tournament</span>
                      <strong className="text-slate-100 text-sm uppercase tracking-wide">{lastCheckIn.tournamentName}</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-black block">Verification Pass Code</span>
                      <code className="text-amber-500 font-mono text-xs font-bold block">{lastCheckIn.qrCode}</code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase font-black block">Scan Check-in Timestamp</span>
                      <span className="text-slate-400 block font-mono">{new Date(lastCheckIn.scannedAt || '').toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Roster Information */}
                  {lastCheckIn.members && lastCheckIn.members.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-emerald-500/10">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          Registered Squad Roster ({lastCheckIn.members.length})
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1.5 scrollbar-thin">
                        {lastCheckIn.members.map((member: TeamMember) => (
                          <div 
                            key={member.id} 
                            className="p-3 bg-[#0a0e17]/85 border border-slate-900 rounded-xl flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="text-[11px] font-black text-slate-200 block truncate">{member.player_name}</span>
                              <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                                {member.email || 'No email'} • {member.phone || 'No phone'}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 text-[8px] font-bold rounded-md uppercase shrink-0">
                              {member.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <XCircle className="w-10 h-10 text-rose-500 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-display font-black text-sm uppercase tracking-wide text-rose-400">Check-In Rejected</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      {lastCheckIn.message}
                    </p>
                    {lastCheckIn.qrCode && (
                      <div className="mt-2 text-[10px] text-slate-500 font-mono">
                        Attempted Token: <span className="text-rose-450 font-bold">{lastCheckIn.qrCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Input console */}
          <div className="p-8 bg-slate-950 border border-slate-900 rounded-3xl space-y-6">
            <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-500" />
              Manual Input console
            </h3>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleGateCheckIn(scanCodeField);
              }}
              className="flex gap-3"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scanCodeField}
                  onChange={(e) => setScanCodeField(e.target.value)}
                  placeholder="Scan ticket QR or enter Verification Code (e.g. CH-QR-T3-T1)..."
                  className="w-full pl-11 pr-4 py-3 bg-[#0c0f17] border border-slate-900 focus:border-amber-500 rounded-xl text-xs text-slate-100 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition duration-200 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                Verify Entry
              </button>
            </form>

            {/* Pending codes to select */}
            <div className="pt-4 border-t border-slate-900">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                Unchecked Active Passes (Click to simulate scan)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {pendingPasses.length === 0 ? (
                  <p className="text-xs text-slate-600 col-span-full italic">No pending tickets in registry.</p>
                ) : (
                  pendingPasses.map((pass) => {
                    const regObj = registrations.find(r => r.id === pass.registration_id);
                    const t = teams.find(x => x.id === regObj?.team_id);
                    const tourney = tournaments.find(x => x.id === regObj?.tournament_id);
                    return (
                      <button
                        key={pass.id}
                        onClick={() => handleGateCheckIn(pass.code_string)}
                        className="p-3 bg-[#0c0f17] border border-slate-900 hover:border-slate-800 hover:scale-[1.02] rounded-xl text-left transition duration-200 cursor-pointer"
                      >
                        <span className="font-mono text-[10px] font-black text-amber-500">{pass.code_string}</span>
                        <span className="text-[9px] text-slate-450 block truncate mt-1">{t?.name || 'Roster'}</span>
                        <span className="text-[8px] text-slate-600 block truncate mt-0.5">{tourney?.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Checked-in Log Right side */}
        <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl space-y-4 self-start">
          <h3 className="font-display font-black text-xs text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2.5">
            Log Check-ins ({checkedInPasses.length})
          </h3>
          <div className="max-h-96 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
            {checkedInPasses.length === 0 ? (
              <p className="text-[10px] text-slate-650 text-center py-8 italic">No checked-in passes recorded yet.</p>
            ) : (
              [...checkedInPasses].reverse().map((pass) => {
                const regObj = registrations.find(r => r.id === pass.registration_id);
                const t = teams.find(x => x.id === regObj?.team_id);
                const tourney = tournaments.find(x => x.id === regObj?.tournament_id);
                return (
                  <div key={pass.id} className="p-3 bg-slate-900/40 border border-slate-900/60 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono font-bold text-emerald-450">{pass.code_string}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase">Scanned ✓</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-200 truncate">{t?.name || 'Roster Team'}</p>
                    <p className="text-[9px] text-slate-500 truncate">{tourney?.name}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
