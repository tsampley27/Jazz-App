import { Chord, Scale, Note } from "tonal";

export type Instrument = "C" | "Bb" | "Eb" | "A";
export type Clef = "Treble" | "Bass";

export interface SongBar {
  chords: string[];
  timeSignature?: string;
}

export interface Song {
  id: string;
  title: string;
  composer?: string;
  bars: SongBar[];
  timeSignature: string;
}

// The interval to add to Concert Pitch to get the Written Pitch for each instrument
const INSTRUMENT_INTERVALS: Record<Instrument, string> = {
  C: "1P",  // Concert: No transposition
  Bb: "2M", // Bb (Trumpet/Tenor): Sounds M2 lower than written, so transpose UP M2
  Eb: "6M", // Eb (Alto/Bari): Sounds M6 lower than written, so transpose UP M6
  A: "3m",  // A (A Clarinet): Sounds m3 lower than written, so transpose UP m3
};

export function transposeChord(
  chordName: string,
  instrument: Instrument,
  clef: Clef = "Treble"
): string {
  if (clef === "Bass") return chordName;
  if (instrument === "C" || !chordName) return chordName;

  const interval = INSTRUMENT_INTERVALS[instrument];
  const [tonic, symbol] = Chord.tokenize(chordName);

  if (!tonic) return chordName;

  const transposedTonic = Note.transpose(tonic, interval);
  return transposedTonic + symbol;
}

export function calculateScales(tonic: string) {
  if (!tonic) return null;

  // Derive 1, 3, 5 from the major scale via intervals (more reliable than array indexing)
  const chordTones = [
    Note.transpose(tonic, "1P"), // Root
    Note.transpose(tonic, "3M"), // Major 3rd
    Note.transpose(tonic, "5P"), // Perfect 5th
  ];

  // Minor pentatonic / blues scale: 1, b3, 4, 5, b7
  const bluesScale = [
    Note.transpose(tonic, "1P"), // Root (1)
    Note.transpose(tonic, "3m"), // Flat third (b3)
    Note.transpose(tonic, "4P"), // Perfect fourth (4)
    Note.transpose(tonic, "5P"), // Perfect fifth (5)
    Note.transpose(tonic, "7m"), // Flat seventh (b7)
  ];

  return { chordTones, bluesScale };
}

export function getChordInfo(chordName: string) {
  const chord = Chord.get(chordName);
  if (chord.empty) return null;

  const tonic = chord.tonic;
  if (!tonic) return null;

  const derived = calculateScales(tonic);
  if (!derived) return null;

  // Include 7th if it's a 7th chord (check symbol and original string)
  const is7th = chordName.includes("7") || chord.symbol.includes("7");
  const notes = is7th ? chord.notes.slice(0, 4) : chord.notes.slice(0, 3);

  return {
    name: chord.name,
    notes,         // Respects quality (e.g. b3 for minor, 7th for 7 chords)
    scaleNotes: derived.chordTones, // 1, 3, 5 of the major scale
    bluesScale: derived.bluesScale, // 1, b3, 4, 5, b7
    tonic,
  };
}