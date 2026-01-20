
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, SkipBack } from 'lucide-react';
import { MigrationPoint } from '../types';
import { COLORS } from '../constants';

interface HistoryTimelineProps {
  timeline: MigrationPoint[];
  activeYear: number;
  onYearChange: (year: number) => void;
}

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ timeline, activeYear, onYearChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<number | null>(null);

  // Memoize sorted points and years to ensure stability and safety for hooks
  const { sortedPoints, years, currentIndex, minYear, maxYear } = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return { sortedPoints: [], years: [], currentIndex: -1, minYear: 0, maxYear: 0 };
    }
    const sorted = [...timeline].sort((a, b) => a.year - b.year);
    const y = sorted.map(p => p.year);
    return {
      sortedPoints: sorted,
      years: y,
      currentIndex: y.indexOf(activeYear),
      minYear: y[0],
      maxYear: y[y.length - 1]
    };
  }, [timeline, activeYear]);

  // Define playback handlers before useEffect
  const handleNext = () => {
    if (currentIndex < years.length - 1) {
      onYearChange(years[currentIndex + 1]);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onYearChange(years[currentIndex - 1]);
    }
  };

  const handleReset = () => {
    if (years.length > 0) {
      onYearChange(years[0]);
    }
    setIsPlaying(false);
  };

  // Hooks must be called unconditionally at the top level
  useEffect(() => {
    if (isPlaying && timeline.length > 0) {
      playIntervalRef.current = window.setInterval(() => {
        // Trigger next step
        if (currentIndex < years.length - 1) {
          onYearChange(years[currentIndex + 1]);
        } else {
          setIsPlaying(false);
        }
      }, 2500);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, currentIndex, years, timeline.length, onYearChange]);

  // Conditional return AFTER all hooks
  if (timeline.length === 0) return null;

  return (
    <div className="flex flex-col space-y-4 px-6 py-4">
      {/* Playback Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
            title="Reset to start"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 text-white transition-colors border border-white/10"
            title="Previous Stage"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7448C8] hover:bg-[#633ca8] text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-[#7448C8]/20"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE TOUR</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY JOURNEY</span>
              </>
            )}
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= years.length - 1}
            className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 text-white transition-colors border border-white/10"
            title="Next Stage"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-right">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Historical Progress</div>
          <div className="text-white font-mono font-bold text-sm">
            Stage {currentIndex + 1} of {years.length}
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[10px] font-mono text-gray-500">
        <span>{minYear < 0 ? `${Math.abs(minYear)} BCE` : minYear}</span>
        <span className="text-white font-bold bg-[#7448C8]/20 px-2 py-0.5 rounded">
          {activeYear < 0 ? `${Math.abs(activeYear)} BCE` : activeYear} CE
        </span>
        <span>{maxYear < 0 ? `${Math.abs(maxYear)} BCE` : maxYear} CE</span>
      </div>
      
      <div className="relative h-10 flex items-center">
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={activeYear}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            // Snap to nearest point year
            const nearest = years.reduce((prev, curr) => 
              Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
            );
            onYearChange(nearest);
            setIsPlaying(false);
          }}
          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#7448C8]"
          style={{ background: `linear-gradient(90deg, #7448C8 0%, #3A63C8 100%)` }}
        />
        
        {/* Markers for key points */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center">
          {sortedPoints.map((point, idx) => {
            const left = ((point.year - minYear) / (maxYear - minYear)) * 100;
            return (
              <div 
                key={idx}
                className={`absolute w-2 h-2 rounded-full transition-all duration-300 border border-black ${point.year <= activeYear ? 'bg-white scale-125' : 'bg-gray-700'}`}
                style={{ left: `${left}%` }}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {sortedPoints.map((point, idx) => (
          <button
            key={idx}
            onClick={() => {
              onYearChange(point.year);
              setIsPlaying(false);
            }}
            className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
              point.year === activeYear 
              ? 'border-[#7448C8] bg-[#7448C8]/20 ring-1 ring-[#7448C8]' 
              : 'border-white/5 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${point.year <= activeYear ? 'bg-[#7448C8]' : 'bg-transparent'}`} />
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">{point.language}</div>
            <div className="text-sm font-bold truncate text-white/90">{point.word}</div>
            <div className="text-[10px] text-gray-400 mt-1">{point.year < 0 ? `${Math.abs(point.year)} BCE` : point.year} CE</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HistoryTimeline;
