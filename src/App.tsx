import { Song } from "./musicUtils";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Music, 
  Settings, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Settings2,
  BookOpen,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instrument, 
  Clef, 
  transposeChord, 
  getChordInfo,
  SongBar 
} from './musicUtils';

const DEFAULT_SONGS: Song[] = [
  {
    id: '1',
    title: 'F Blues',
    composer: 'Traditional',
    timeSignature: '4/4',
    bars: [
      { chords: ['F7'] }, { chords: ['Bb7'] }, { chords: ['F7'] }, { chords: ['F7'] },
      { chords: ['Bb7'] }, { chords: ['Bb7'] }, { chords: ['F7'] }, { chords: ['D7'] },
      { chords: ['Gm7'] }, { chords: ['C7'] }, { chords: ['F7'] }, { chords: ['C7'] },
    ]
  },
  {
    id: '2',
    title: 'Blue Bossa',
    composer: 'Kenny Dorham',
    timeSignature: '4/4',
    bars: [
      { chords: ['Cm7'] }, { chords: ['Cm7'] }, { chords: ['Fm7'] }, { chords: ['Fm7'] },
      { chords: ['Dm7b5'] }, { chords: ['G7alt'] }, { chords: ['Cm7'] }, { chords: ['Cm7'] },
      { chords: ['Ebm7'] }, { chords: ['Ab7'] }, { chords: ['Dbmaj7'] }, { chords: ['Dbmaj7'] },
      { chords: ['Dm7b5'] }, { chords: ['G7alt'] }, { chords: ['Cm7'] }, { chords: ['Dm7b5', 'G7alt'] },
    ]
  }
];

export default function App() {
  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('jazz_songs');
    return saved ? JSON.parse(saved) : DEFAULT_SONGS;
  });
  const [currentSongId, setCurrentSongId] = useState<string>(songs[0].id);
  const [instrument, setInstrument] = useState<Instrument>('C');
  const [clef, setClef] = useState<Clef>('Treble');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isEditing, setIsEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(() => {
    const saved = localStorage.getItem('show_notes_theory');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [selectedChord, setSelectedChord] = useState<{ name: string; instrumentChord: string } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('jazz_songs', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('show_notes_theory', JSON.stringify(showNotes));
  }, [showNotes]);

  const currentSong = useMemo(() => 
    songs.find(s => s.id === currentSongId) || songs[0], 
  [songs, currentSongId]);

  const handleAddSong = () => {
    const newSong: Song = {
      id: Date.now().toString(),
      title: 'Untitled Blues',
      composer: 'Me',
      timeSignature: '4/4',
      bars: Array(12).fill(0).map(() => ({ chords: ['F7'] }))
    };
    setSongs([...songs, newSong]);
    setCurrentSongId(newSong.id);
    setIsEditing(true);
  };

  const handleUpdateSong = (updatedSong: Song) => {
    setSongs(songs.map(s => s.id === updatedSong.id ? updatedSong : s));
  };

  const handleDeleteSong = (id: string) => {
    if (songs.length === 1) return;
    const newSongs = songs.filter(s => s.id !== id);
    setSongs(newSongs);
    setCurrentSongId(newSongs[0].id);
  };

  return (
    <div className="flex h-screen bg-paper overflow-hidden text-ink">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth <= 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] z-40 transition-all"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-72 bg-paper border-r border-ink/10 flex flex-col z-50 fixed md:relative h-full"
            id="sidebar"
          >
            <div className="p-6 border-b border-ink/5 flex items-center justify-between">
              <h2 className="text-xl handwritten font-bold flex items-center gap-2">
                <BookOpen size={20} />
                My Library
              </h2>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-ink/5 rounded-full transition-colors"
                aria-label="Close Sidebar"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
              {songs.map(song => (
                <div
                  key={song.id}
                  onClick={() => {
                    setCurrentSongId(song.id);
                    setIsEditing(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setCurrentSongId(song.id);
                      setIsEditing(false);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between group transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
                    currentSongId === song.id 
                      ? 'bg-white text-ink border-2 border-ink/10 fake-book-shadow' 
                      : 'hover:bg-ink/5'
                  }`}
                  id={`song-btn-${song.id}`}
                >
                  <span className="handwritten font-medium">{song.title}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSong(song.id);
                      }}
                      className="p-2 hover:text-red-400"
                      title="Delete Song"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-ink/5">
              <button
                onClick={handleAddSong}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-ink/20 rounded-lg hover:border-ink/50 hover:bg-ink/5 transition-all text-sm uppercase tracking-wider font-bold"
                id="add-song-btn"
              >
                <Plus size={18} />
                Create New Chart
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-4 z-30 p-2 bg-paper border border-ink/10 rounded-lg fake-book-shadow hover:bg-ink/5 transition-all"
          id="open-sidebar-btn"
          aria-label="Open Sidebar"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative" id="main-content">
        {/* Header/Controls */}
        <header className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-ink/5 bg-paper/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-6">
            {!isSidebarOpen && <div className="w-8" />} {/* Spacer */}
            <h1 className="text-2xl handwritten font-bold whitespace-nowrap">
              {currentSong.title}
            </h1>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tight opacity-50">
              <span className="handwritten">{currentSong.composer}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-ink/5 p-1.5 px-3 rounded-xl border border-ink/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]">Notes</span>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`relative w-10 h-6 flex items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                  showNotes ? 'bg-blue-500' : 'bg-ink/20'
                }`}
                id="toggle-notes-btn"
                role="switch"
                aria-checked={showNotes}
              >
                <motion.div
                  initial={false}
                  animate={{ x: showNotes ? 18 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="flex bg-ink/5 p-1.5 rounded-xl border border-ink/5">
              {(['C', 'Bb', 'Eb', 'A'] as Instrument[]).map(inst => (
                <button
                  key={inst}
                  onClick={() => setInstrument(inst)}
                  className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                    instrument === inst 
                      ? 'bg-sheet text-ink shadow-sm ring-1 ring-ink/5' 
                      : 'text-ink/40 hover:text-ink/70'
                  }`}
                  id={`inst-${inst}`}
                >
                  {inst}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2.5 rounded-xl transition-all border ${
                isEditing 
                  ? 'bg-ink text-white border-ink shadow-lg' 
                  : 'bg-sheet text-ink/60 border-ink/10 hover:border-ink/30 hover:text-ink shadow-sm'
              }`}
              id="toggle-edit-btn"
              title={isEditing ? "Save Changes" : "Edit Chart"}
            >
              {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-12">
            {isEditing ? (
              <SongForm 
                song={currentSong} 
                onUpdate={handleUpdateSong} 
                instrument={instrument}
              />
            ) : (
              <SheetView 
                song={currentSong} 
                instrument={instrument} 
                clef={clef} 
                showNotes={showNotes}
                onChordClick={(name, instChord) => setSelectedChord({ name, instrumentChord: instChord })}
              />
            )}
          </div>
        </div>

        {/* Chord Details Modal */}
        <AnimatePresence>
          {selectedChord && (
            <ChordDetailsModal 
              chordName={selectedChord.name}
              instrumentChord={selectedChord.instrumentChord}
              onClose={() => setSelectedChord(null)} 
              instrument={instrument}
            />
          )}
        </AnimatePresence>

        {/* Legend / Tips Footer */}
        {!isEditing && (
          <footer className="p-4 bg-paper/50 border-t border-ink/5 text-[10px] uppercase font-bold tracking-widest text-ink/40 flex justify-center gap-4 md:gap-12 flex-wrap">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
               <span>BLUE NOTES: PENTATONIC BLUES SCALE</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-ink/20 border border-ink/30" />
               <span>CHORD TONES: 1, 3, 5, 7</span>
             </div>
          </footer>
        )}
      </main>
    </div>
  );
}

interface SheetViewProps {
  song: Song;
  instrument: Instrument;
  clef: Clef;
  showNotes: boolean;
  onChordClick: (name: string, instrumentChord: string) => void;
}

function SheetView({ song, instrument, clef, showNotes, onChordClick }: SheetViewProps) {
  const groupedBars = useMemo(() => {
    const groups: { bar: SongBar; startIndex: number; count: number; showTimeSignature: boolean }[] = [];
    if (song.bars.length === 0) return groups;

    let currentGroup = { 
      bar: song.bars[0], 
      startIndex: 0, 
      count: 1,
      showTimeSignature: true // Always show on first bar
    };

    let lastEffectiveTimeSignature = song.bars[0].timeSignature || song.timeSignature;

    for (let i = 1; i < song.bars.length; i++) {
      const bar = song.bars[i];
      const barTime = bar.timeSignature || song.timeSignature;
      const prevBarTime = song.bars[i-1].timeSignature || song.timeSignature;

      // Grouping logic: same chords AND same effective time signature
      const chordsSame = JSON.stringify(bar.chords) === JSON.stringify(currentGroup.bar.chords);
      const timeSame = barTime === prevBarTime;

      if (chordsSame && timeSame) {
        currentGroup.count++;
      } else {
        groups.push(currentGroup);
        
        // Show time signature if this bar's time is different from the last time we SHOWED a time signature
        // Actually, the requirement is "don't make it display if there isn't any change"
        // So we compare barTime with lastEffectiveTimeSignature.
        const showTime = barTime !== lastEffectiveTimeSignature;
        if (showTime) {
          lastEffectiveTimeSignature = barTime;
        }

        currentGroup = { 
          bar, 
          startIndex: i, 
          count: 1,
          showTimeSignature: showTime
        };
      }
    }
    groups.push(currentGroup);
    return groups;
  }, [song]);

  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-1 md:gap-4" id="sheet-view">
      {groupedBars.map((group, idx) => (
        <BarCard 
          key={`bar-group-${group.startIndex}`} 
          bar={group.bar} 
          index={group.startIndex}
          count={group.count}
          showTimeSignature={group.showTimeSignature}
          defaultTimeSignature={song.timeSignature}
          instrument={instrument}
          clef={clef}
          showNotes={showNotes}
          onChordClick={onChordClick}
        />
      ))}
    </div>
  );
}

interface BarCardProps {
  key?: React.Key;
  bar: SongBar;
  index: number;
  count?: number;
  showTimeSignature?: boolean;
  defaultTimeSignature: string;
  instrument: Instrument;
  clef: Clef;
  showNotes: boolean;
  onChordClick: (name: string, instrumentChord: string) => void;
}

function FormattedChord({ chord }: { chord: string }) {
  if (!chord) return null;

  // Replace standard symbols with musical ones
  const format = (text: string) => {
    return text.replace(/b/g, '♭').replace(/#/g, '♯');
  };

  // Heuristic to split into root and extension
  // Root can be A-G followed by optional # or b
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return <span className="handwritten">{format(chord)}</span>;

  const [, root, ext] = match;

  return (
    <span className="handwritten inline-flex items-baseline">
      <span className="text-3xl">{format(root)}</span>
      <sup className="text-lg ml-0.5 mt-[-0.5em]">{format(ext)}</sup>
    </span>
  );
}

function FormattedNote({ note }: { note: string }) {
  const formatted = note.replace(/b/g, '♭').replace(/#/g, '♯');
  return <span className="handwritten">{formatted}</span>;
}

function BarCard({ bar, index, count = 1, showTimeSignature, defaultTimeSignature, instrument, clef, showNotes, onChordClick }: BarCardProps) {
  const barRange = count > 1 ? `${index + 1} - ${index + count}` : `${index + 1}`;
  const effectiveTimeSignature = bar.timeSignature || defaultTimeSignature;
  
  return (
    <div 
      className={`relative border border-ink/10 md:border-2 bg-sheet rounded-lg md:rounded-xl overflow-hidden transition-all hover:border-ink/30 fake-book-shadow ${
        count > 1 ? 'col-span-2 md:col-span-2 lg:col-span-2' : ''
      }`} 
      id={`bar-${index}`}
    >
      {/* Bar Number */}
      <div className="absolute top-1 left-1 md:top-1.5 md:left-2 text-[8px] md:text-[10px] handwritten text-ink font-bold opacity-60 md:opacity-80">
        {barRange}
      </div>

      {/* Time Signature */}
      {showTimeSignature && effectiveTimeSignature && (
        <div className="absolute top-1 right-1 md:right-2 text-xs md:text-xl font-bold handwritten pointer-events-none opacity-40 md:opacity-80" style={{ lineHeight: 0.8 }}>
          {effectiveTimeSignature.includes('/') ? (
            <div className="flex flex-col items-center">
              <span>{effectiveTimeSignature.split('/')[0]}</span>
              <div className="w-2 md:w-4 h-[1px] bg-ink/20" />
              <span>{effectiveTimeSignature.split('/')[1]}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span>{effectiveTimeSignature}</span>
            </div>
          )}
        </div>
      )}


      <div className="p-0 md:p-4 space-y-0 md:space-y-4 min-h-0 md:min-h-[140px] flex flex-col justify-center">
        {bar.chords.map((chord, cIdx) => {
          // Display the chord in Concert Pitch (as written on lead sheets)
          // but transpose the technical analysis for the instrument notes
          const instrumentChord = transposeChord(chord, instrument, clef);
          const displayedChord = chord; 
          const transposedInfo = getChordInfo(instrumentChord);

          return (
            <button 
              key={cIdx} 
              className="space-y-0 md:space-y-1 block w-full group/chord hover:scale-105 transition-transform"
              onClick={() => onChordClick(displayedChord, instrumentChord)}
            >
              <div className="text-center hidden md:block">
                <FormattedChord chord={displayedChord} />
              </div>
              
              {/* Compact Mobile Chord Name */}
              <div className="text-center md:hidden text-[9px] leading-none handwritten font-bold text-ink/80">
                {displayedChord.replace(/b/g, '♭').replace(/#/g, '♯')}
              </div>
              
              {showNotes && transposedInfo && (
                <div className="flex flex-col items-center gap-0 md:gap-1">
                  {/* Chord Tones */}
                  <div className="flex flex-wrap justify-center gap-0.5 md:gap-1">
                    {transposedInfo.notes.map((note, nIdx) => (
                      <span key={nIdx} className="px-0.5 md:px-1.5 py-0 md:py-0.5 text-[6px] md:text-[9px] font-bold border border-ink/5 md:border-ink/20 rounded-sm uppercase bg-ink/5">
                        <FormattedNote note={note} />
                      </span>
                    ))}
                  </div>
                  {/* Blues Scale (1, b3, 4, 5, b7) - Hidden on mobile */}
                  <div className="hidden md:flex flex-wrap justify-center gap-0.5 md:gap-1">
                    {transposedInfo.bluesScale.map((note, sIdx) => (
                      <span key={sIdx} className="px-0.5 md:px-1 py-0 md:py-0.5 text-[6px] md:text-[8px] font-bold text-blue-800 bg-blue-500/10 rounded-full uppercase">
                        <FormattedNote note={note} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
    </div>
  );
}

function ChordDetailsModal({ chordName, instrumentChord, onClose, instrument }: { chordName: string; instrumentChord: string; onClose: () => void; instrument: Instrument }) {
  const info = getChordInfo(instrumentChord);
  
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-sheet w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-ink/10"
      >
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-4xl md:text-5xl font-bold handwritten tracking-tight">
                <FormattedChord chord={chordName} />
              </h2>
              <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-ink/30">
                {instrument !== 'C' ? `Written for ${instrument}: ${instrumentChord}` : `Chord Analysis (${info.tonic})`}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-ink/5 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid gap-8">
            {/* Chord Tones */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-widest text-ink/40">Chord Tones (Arpeggio)</h3>
              <div className="flex flex-wrap gap-2">
                {info.notes.map((note, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-ink text-lg font-bold bg-ink text-white shadow-lg">
                      <FormattedNote note={note} />
                    </div>
                    <span className="text-[10px] font-bold text-ink/40">
                      {idx === 0 ? 'ROOT' : idx === 1 ? '3RD' : idx === 2 ? '5TH' : '7TH'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scale Tones */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-widest text-ink/40">Major Scale Foundation (1, 3, 5)</h3>
              <div className="flex flex-wrap gap-2">
                {info.scaleNotes.map((note, idx) => (
                  <div key={idx} className="w-10 h-10 flex items-center justify-center rounded-lg border border-ink/10 text-sm font-bold bg-ink/5">
                    <FormattedNote note={note} />
                  </div>
                ))}
              </div>
            </div>

            {/* Blues Scale */}
            <div className="space-y-4 pt-4 border-t border-ink/5">
              <h3 className="text-xs uppercase font-bold tracking-widest text-ink/40">Pentatonic Blues Scale (1, ♭3, 4, 5, ♭7)</h3>
              <div className="flex flex-wrap gap-2">
                {info.bluesScale.map((note, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-center justify-center rounded-xl text-sm font-bold bg-blue-500/10 border border-blue-500/20 text-blue-800 shadow-sm">
                    <FormattedNote note={note} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-ink/[0.02] border-t border-ink/5 flex justify-center">
            <p className="text-[9px] uppercase font-bold tracking-widest text-ink/30 text-center">
              Notes are automatically transposed for your {instrumentChord !== chordName ? instrument : 'Concert C'} instrument
            </p>
        </div>
      </motion.div>
    </div>
  );
}

interface SongFormProps {
  song: Song;
  onUpdate: (s: Song) => void;
  instrument: Instrument;
}

interface BarInputProps {
  key?: React.Key;
  initialValue: string;
  initialTimeSignature?: string;
  onChange: (chords: string, timeSignature: string) => void;
  onRemove: () => void;
  index: number;
}

function BarInput({ initialValue, initialTimeSignature = '', onChange, onRemove, index }: BarInputProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [timeValue, setTimeValue] = useState(initialTimeSignature);

  // Sync if initial values change externally
  useEffect(() => {
    setInputValue(initialValue);
    setTimeValue(initialTimeSignature);
  }, [initialValue, initialTimeSignature]);

  return (
    <div className="relative group p-6 bg-sheet border border-ink/10 rounded-xl hover:border-ink/40 transition-shadow hover:shadow-md">
      <div className="absolute -top-3 left-4 px-2 bg-sheet text-[10px] handwritten text-ink font-bold flex items-center gap-2 border border-ink/10 rounded-full">
        <span>Bar {index + 1}</span>
      </div>
      
      <div className="space-y-4">
        <input 
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value, timeValue);
          }}
          className="w-full text-2xl handwritten font-bold bg-transparent py-2 focus:outline-none border-b border-ink/5 focus:border-ink/20"
          placeholder="C7 F7"
        />
        
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-ink/30">Time:</label>
          <input 
            value={timeValue}
            onChange={(e) => {
              setTimeValue(e.target.value);
              onChange(inputValue, e.target.value);
            }}
            className="w-12 text-xs handwritten font-bold bg-transparent focus:outline-none border-b border-ink/5 focus:border-ink/20"
            placeholder="4/4"
          />
        </div>
      </div>

      <button 
        onClick={onRemove}
        className="absolute -top-2 -right-2 p-1.5 bg-paper border border-ink/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 shadow-sm"
        title="Remove Bar"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function SongForm({ song, onUpdate, instrument }: SongFormProps) {
  const [localTitle, setLocalTitle] = useState(song.title);
  const [localComposer, setLocalComposer] = useState(song.composer || '');

  const updateBar = (index: number, chords: string, timeSignature: string) => {
    const newBars = [...song.bars];
    newBars[index] = { 
      chords: chords.split(/[\s,]+/).filter(Boolean),
      timeSignature: timeSignature || undefined
    };
    onUpdate({ ...song, bars: newBars });
  };

  const addBar = () => {
    onUpdate({ ...song, bars: [...song.bars, { chords: ['F7'] }] });
  };

  const removeBar = (index: number) => {
    const newBars = song.bars.filter((_, i) => i !== index);
    onUpdate({ ...song, bars: newBars });
  };

  return (
    <div className="space-y-12" id="song-editor">
      <div className="flex flex-col md:flex-row gap-6 md:items-end border-b-2 border-ink pb-8">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Song Title</label>
          <input 
            value={localTitle}
            onChange={(e) => {
              setLocalTitle(e.target.value);
              onUpdate({ ...song, title: e.target.value });
            }}
            className="w-full text-4xl handwritten font-bold bg-transparent border-none focus:ring-0 placeholder:opacity-20"
            placeholder="Giant Steps..."
          />
        </div>
        <div className="md:w-1/3 space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Composer</label>
          <input 
            value={localComposer}
            onChange={(e) => {
              setLocalComposer(e.target.value);
              onUpdate({ ...song, composer: e.target.value });
            }}
            className="w-full text-xl handwritten bg-transparent border-none focus:ring-0 placeholder:opacity-20"
            placeholder="John Coltrane"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {song.bars.map((bar, idx) => (
          <BarInput 
            key={`${song.id}-bar-${idx}`}
            initialValue={bar.chords.join(' ')}
            initialTimeSignature={bar.timeSignature}
            onChange={(chords, time) => updateBar(idx, chords, time)}
            onRemove={() => removeBar(idx)}
            index={idx}
          />
        ))}
        
        <button 
          onClick={addBar}
          className="flex items-center justify-center border-2 border-dashed border-ink/10 rounded-lg p-8 hover:border-ink/30 hover:bg-ink/5 transition-all group"
          title="Add Bar"
        >
          <Plus className="text-ink/10 group-hover:text-ink/40 transition-colors" size={32} />
        </button>
      </div>

      <div className="flex justify-center pt-12">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink/20 text-center max-w-sm">
          Tip: Enter chords separated by spaces for multiple chords per bar.
          Calculations update in real-time.
        </div>
      </div>
    </div>
  );
}

