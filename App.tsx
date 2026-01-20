
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Info, Globe, Loader2, Sparkles, BookOpen, Clock } from 'lucide-react';
import { WordEvolution, AppStatus } from './types';
import { fetchWordEvolution } from './services/geminiService';
import { INITIAL_WORD, COLORS } from './constants';
import GlobeMap from './components/GlobeMap';
import HistoryTimeline from './components/HistoryTimeline';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<WordEvolution | null>(null);
  const [activeYear, setActiveYear] = useState(0);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (word: string) => {
    if (!word) return;
    setStatus(AppStatus.LOADING);
    setError(null);
    try {
      const result = await fetchWordEvolution(word);
      setData(result);
      if (result.timeline.length > 0) {
        // Sort timeline and set initial active year to the first known year
        const sorted = [...result.timeline].sort((a, b) => a.year - b.year);
        setActiveYear(sorted[0].year); // Start at the beginning
      }
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError('Failed to trace the evolution of this word. Try a common noun or verb.');
      setStatus(AppStatus.ERROR);
    }
  }, []);

  useEffect(() => {
    handleSearch(INITIAL_WORD);
  }, [handleSearch]);

  const activePoint = data?.timeline.find(p => p.year === activeYear) || data?.timeline[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0e14]">
      {/* Header */}
      <header className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7448C8] rounded-xl shadow-lg shadow-[#7448C8]/30">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Geo Word
            </h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">Linguistic Migration Map</p>
          </div>
        </div>

        <form 
          className="relative flex-1 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchTerm);
          }}
        >
          <input
            type="text"
            placeholder="Trace any word (e.g. 'Ocean', 'Zero', 'Avatar')..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-6 pl-12 focus:outline-none focus:border-[#7448C8] transition-all text-sm text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <button 
            disabled={status === AppStatus.LOADING}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#7448C8] hover:bg-[#633ca8] disabled:opacity-50 text-white rounded-full p-2 transition-colors"
          >
            {status === AppStatus.LOADING ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </form>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row relative">
        {/* Left Side: Map Container */}
        <div className="flex-1 min-h-[400px] relative border-r border-white/5">
          {status === AppStatus.LOADING && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#7448C8]/20 border-t-[#7448C8] rounded-full animate-spin"></div>
                <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#7448C8]" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-300 animate-pulse">Tracing linguistic roots across centuries...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-20 p-6">
              <div className="glass-panel p-6 rounded-2xl max-w-sm text-center border-red-500/20">
                <Info className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2 text-white">Oops! Search failed</h3>
                <p className="text-sm text-gray-400 mb-6">{error}</p>
                <button 
                  onClick={() => handleSearch(INITIAL_WORD)}
                  className="px-6 py-2 bg-[#7448C8] rounded-full hover:bg-[#633ca8] transition-colors text-sm font-semibold text-white"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

          <GlobeMap data={data} activeYear={activeYear} />

          {/* Floating UI Elements over Map */}
          {data && (
            <div className="absolute bottom-6 left-6 right-6 lg:right-auto lg:w-96 flex flex-col gap-4 pointer-events-none">
              <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-[#7448C8] pointer-events-auto shadow-2xl">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-black text-white">{data.modernWord}</h2>
                  <span className="text-[10px] font-bold bg-[#7448C8]/20 text-[#7448C8] px-2 py-0.5 rounded-full uppercase">MODERN</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed italic line-clamp-3">
                  "{data.etymologySummary}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Data Details */}
        <div className="lg:w-96 bg-[#0f1218] overflow-y-auto flex flex-col border-l border-white/5">
          {activePoint ? (
            <div className="p-6 space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4 text-[#7448C8]">
                  <Clock className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Active Era</h3>
                </div>
                <div className="p-6 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BookOpen className="w-16 h-16 text-[#7448C8]" />
                  </div>
                  <div className="text-4xl font-black mb-1 text-white">
                    {activePoint.year < 0 ? `${Math.abs(activePoint.year)} BCE` : `${activePoint.year} CE`}
                  </div>
                  <div className="text-[#7448C8] font-bold text-lg mb-4">{activePoint.language}</div>
                  <div className="p-4 bg-black/40 rounded-xl mb-4 border border-white/5">
                     <span className="text-2xl font-mono text-white/90">"{activePoint.word}"</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{activePoint.region}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activePoint.description}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4 text-[#7448C8]">
                  <Info className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Etymological Context</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between p-4 bg-white/5 rounded-2xl text-sm border border-white/5">
                    <span className="text-gray-400">Chronological Rank</span>
                    <span className="font-bold text-white">Stage {data?.timeline.indexOf(activePoint) !== undefined ? data.timeline.indexOf(activePoint) + 1 : '?'}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-white/5 rounded-2xl text-sm border border-white/5">
                    <span className="text-gray-400">Root Language</span>
                    <span className="font-bold text-white">{data?.timeline[0].language}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-white/5 rounded-2xl text-sm border border-white/5">
                    <span className="text-gray-400">Initial Form</span>
                    <span className="font-bold text-[#7448C8] font-mono">{data?.timeline[0].word}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <Clock className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm italic">Search for a word to explore its history.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer / Timeline */}
      <footer className="glass-panel border-t border-white/5 z-40 bg-[#0b0e14]/90 backdrop-blur-xl">
        <HistoryTimeline 
          timeline={data?.timeline || []} 
          activeYear={activeYear} 
          onYearChange={setActiveYear} 
        />
      </footer>
    </div>
  );
};

export default App;
