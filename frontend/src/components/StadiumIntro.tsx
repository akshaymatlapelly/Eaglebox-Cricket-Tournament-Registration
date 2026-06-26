'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

interface StadiumIntroProps {
  onComplete: () => void;
}

export const StadiumIntro: React.FC<StadiumIntroProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true); // default to true to allow autoplay in all browsers
  const [loading, setLoading] = useState(true);
  const isCompletingRef = useRef(false);

  const handleComplete = () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    // Smooth fade out using GSAP
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => {
          onComplete();
        }
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setMuted(newMuted);
    }
  };

  const handlePlayState = () => {
    setLoading(false);
  };

  useEffect(() => {
    // Force mute and play on mount
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.log("Autoplay prevented:", err);
      });
    }

    // Safety fallback: if video doesn't fire events within 2.5 seconds, force hide the loader
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      id="intro-container"
      className="fixed inset-0 z-[99999] select-none overflow-hidden bg-[#080a10] flex items-center justify-center"
    >
      <style>{`
        @keyframes spinner-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .loading-pulse {
          animation: spinner-glow 2s infinite ease-in-out;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .glass-panel:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.25);
        }
      `}</style>

      {/* Video Element */}
      <video
        ref={videoRef}
        src="/intro_h264.mp4"
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted={muted}
        onCanPlay={handlePlayState}
        onPlay={handlePlayState}
        onPlaying={handlePlayState}
        onLoadedData={handlePlayState}
        onTimeUpdate={() => {
          if (loading && videoRef.current && videoRef.current.currentTime > 0.1) {
            setLoading(false);
          }
        }}
        onEnded={handleComplete}
      />

      {/* Premium Loader Backdrop */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center bg-[#080a10] z-20 transition-all duration-700 ease-in-out ${
          loading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Elegant glowing spinner */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10 border-t-emerald-400 animate-spin" />
            <div className="w-16 h-16 rounded-full bg-emerald-500/5 loading-pulse flex items-center justify-center">
              <span className="text-emerald-400 font-black text-xl">CH</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-white font-display font-black tracking-widest text-lg uppercase">
              CRICKETHUB PRO
            </h2>
            <p className="text-slate-500 text-[10px] tracking-wider uppercase mt-2">
              Preloading Cinematic Presentation...
            </p>
          </div>
        </div>
      </div>

      {/* Letterbox bars for cinematic aspect ratio */}
      <div className="absolute inset-x-0 top-0 h-[6vh] bg-black/40 z-10 pointer-events-none border-b border-white/5" />
      <div className="absolute inset-x-0 bottom-0 h-[6vh] bg-black/40 z-10 pointer-events-none border-t border-white/5" />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Controls Overlay */}
      <div className="absolute bottom-[8vh] left-1/2 -translate-x-1/2 z-50 flex gap-4 pointer-events-auto">
        {!loading && (
          <button
            onClick={handleMuteToggle}
            className="glass-panel text-white transition-all duration-300 font-sans tracking-wide uppercase"
            style={{
              padding: '10px 24px',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.65rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {muted ? (
              <>
                <VolumeX size={14} className="text-rose-400" />
                <span>Unmute</span>
              </>
            ) : (
              <>
                <Volume2 size={14} className="text-emerald-400" />
                <span>Mute</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={handleSkip}
          className="bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition-all duration-300 font-sans tracking-wide uppercase border border-emerald-400/20"
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.65rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Skip Intro <SkipForward size={14} />
        </button>
      </div>
    </div>
  );
};

export default StadiumIntro;
