import React, { useState, useMemo, useEffect } from 'react';
import './ParsedSongDisplay.css';

const CHORDS_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

function transposeChord(chordStr, semitones) {
  if (!chordStr) return '';
  return chordStr.replace(/([A-G][b#]?[^-/]*)/g, (match, chord) => {
    const m = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!m) return chord;
    let [, root, suffix] = m;
    root = FLAT_TO_SHARP[root] || root;
    const index = CHORDS_SHARP.indexOf(root);
    if (index === -1) return chord;
    const newIndex = (index + semitones + CHORDS_SHARP.length) % CHORDS_SHARP.length;
    return CHORDS_SHARP[newIndex] + suffix;
  });
}

function parseTuneSegments(raw) {
  if (!raw) return [{ type: 'common', lines: [] }];
  const headingRegex = /^#{3}\s*(.+)\s*$/i;
  const rawLines = raw.split('\n');
  const segments = [];
  let current = { type: 'common', lines: [] };

  for (const rawLine of rawLines) {
    const m = rawLine.match(headingRegex);
    if (m) {
      segments.push(current);
      const tuneName = m[1].trim();
      current = { type: 'tune', tuneName, lines: [] };
    } else {
      current.lines.push(rawLine);
    }
  }
  segments.push(current);
  return segments;
}

function ParsedSongDisplay({ rawLyrics }) {
  const [showChords, setShowChords] = useState(true);
  const [showChordsEveryVerse, setShowChordsEveryVerse] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [selectedTune, setSelectedTune] = useState(null);

  const preSegments = useMemo(() => parseTuneSegments(rawLyrics), [rawLyrics]);
  const tuneNames = useMemo(() => [...new Set(preSegments.filter(s => s.type === 'tune').map(s => s.tuneName))], [preSegments]);
  const initialTune = tuneNames.length > 0 ? tuneNames[0] : null;

  useEffect(() => {
    setSelectedTune(initialTune);
  }, [initialTune]);

  if (!rawLyrics) return null;

  const allLines = rawLyrics.split('\n');
  const verseReference = allLines.find(line => line.startsWith('# ') && !line.toLowerCase().includes('capo'))
    ?.replace(/^#\s*/, '') || '';
  const capoMatch = allLines.find(line => line.toLowerCase().includes('capo'))
    ?.match(/capo\s*(\d+)/i);
  const capoNumber = capoMatch ? capoMatch[1] : null;

  const verses = useMemo(() => {
    const processed = [];
    let currentVerse = [];
    let currentVerseNumber = null;

    for (const seg of preSegments) {
      if (seg.type === 'tune' && selectedTune && seg.tuneName !== selectedTune) continue;

      for (let i = 0; i < seg.lines.length; i++) {
        const ln = seg.lines[i];

        if (ln.startsWith('#') || ln.toLowerCase().includes('capo')) continue;

        if (/^\d+$/.test(ln.trim())) {
          if (currentVerse.length > 0) {
            processed.push({ isNumbered: !!currentVerseNumber, verseNumber: currentVerseNumber, lines: currentVerse });
            currentVerse = [];
          }
          currentVerseNumber = parseInt(ln.trim(), 10);
          continue;
        }

        if (ln.trim() === '') {
          if (currentVerse.length > 0) {
            processed.push({ isNumbered: !!currentVerseNumber, verseNumber: currentVerseNumber, lines: currentVerse });
            currentVerse = [];
            currentVerseNumber = null;
          }
        } else {
          const regex = /\[([^\]]+)\]/g;
          const chords = [];
          let match;
          while ((match = regex.exec(ln)) !== null) {
            const rawChords = match[1];
            const bracketEnd = match.index + match[0].length;
            const nextChar = ln[bracketEnd];
            chords.push({
              rawChords,
              rawPosition: bracketEnd,
              hasNextChar: !!nextChar && nextChar !== '\n'
            });
          }
          const cleanLyrics = ln.replace(/\[([^\]]+)\]/g, '');
          currentVerse.push({ line: ln, chords, cleanLyrics });
        }
      }

      if (currentVerse.length > 0) {
        processed.push({ isNumbered: !!currentVerseNumber, verseNumber: currentVerseNumber, lines: currentVerse });
        currentVerse = [];
        currentVerseNumber = null;
      }
    }
    return processed;
  }, [preSegments, selectedTune]);

  // Compute first verse chord positions (anchors) for alignment
  const firstVerseAnchors = useMemo(() => {
    if (!verses.length) return [];
    return verses[0].lines.map(line =>
      line.chords.map(c => {
        const bracketsBeforeLen = (line.line.slice(0, c.rawPosition).match(/\[([^\]]+)\]/g) || [])
          .reduce((sum, b) => sum + b.length, 0);
        const cleanPos = c.rawPosition - bracketsBeforeLen;
        return { chord: c.rawChords, charIndex: cleanPos };
      })
    );
  }, [verses]);

  const renderChordLine = (lineObj) => {
    const chords = lineObj.chords;
    const cleanLyrics = lineObj.cleanLyrics;
    let chordLineLength = cleanLyrics.length;

    chords.forEach(({ rawChords, rawPosition, hasNextChar }) => {
      const bracketsBeforeLen = (lineObj.line.slice(0, rawPosition).match(/\[([^\]]+)\]/g) || [])
        .reduce((sum, b) => sum + b.length, 0);
      let cleanPos = rawPosition - bracketsBeforeLen;
      if (!hasNextChar) cleanPos = cleanLyrics.replace(/\s+$/, '').length;
      const totalLen = cleanPos + transposeChord(rawChords, transpose).length;
      if (totalLen > chordLineLength) chordLineLength = totalLen;
    });

    const chordArray = Array(chordLineLength).fill(' ');
    chords.forEach(({ rawChords, rawPosition, hasNextChar }) => {
      const bracketsBeforeLen = (lineObj.line.slice(0, rawPosition).match(/\[([^\]]+)\]/g) || [])
        .reduce((sum, b) => sum + b.length, 0);
      let cleanPos = rawPosition - bracketsBeforeLen;
      if (!hasNextChar) cleanPos = cleanLyrics.replace(/\s+$/, '').length;
      const chordStr = transposeChord(rawChords, transpose);
      for (let i = 0; i < chordStr.length; i++) {
        chordArray[cleanPos + i] = chordStr[i];
      }
    });

    return chordArray.join('');
  };

  return (
    <div className="parsed-song-container">
      {verseReference && <div className="verse-reference">{verseReference}</div>}
      {capoNumber && <div className="capo-text">Capo {capoNumber}</div>}

      <div className="controls">
        <button onClick={() => setShowChords(prev => !prev)}>
          {showChords ? 'Hide Chords' : 'Show Chords'}
        </button>
        <button onClick={() => setTranspose(t => t + 1)}>Transpose +</button>
        <button onClick={() => setTranspose(t => t - 1)}>Transpose -</button>
        {transpose !== 0 && <span className="transpose-indicator">({transpose > 0 ? `+${transpose}` : transpose})</span>}
        <button onClick={() => setShowChordsEveryVerse(prev => !prev)}>
          {showChordsEveryVerse ? 'Hide Chords on Repeated Verses' : 'Show Chords on All Verses'}
        </button>
        {tuneNames.length >= 2 && (
          <div className="tune-selector" style={{ marginLeft: 12 }}>
            <label>
              Tune:&nbsp;
              <select value={selectedTune || ''} onChange={e => setSelectedTune(e.target.value || null)}>
                {tuneNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="lyrics-section">
        {verses.map((verse, vi) => (
          <div
            key={vi}
            className="verse-block"
            style={{
              display: 'grid',
              gridTemplateColumns: '2.25rem 1fr',
              columnGap: '8px',
              marginTop: '12px',
              alignItems: 'start',
            }}
          >
            <div className="verse-number-column" style={{ fontWeight: 'bold' }}>
              {verse.isNumbered ? verse.verseNumber : ''}
            </div>
            <div className="lyrics-column">
              {verse.lines.map((lineObj, li) => {
                // Only align chords to first verse for numbered verses (not chorus)
                let chordsToRender = lineObj.chords;
                if (showChordsEveryVerse && verse.isNumbered && li < firstVerseAnchors.length) {
                  chordsToRender = firstVerseAnchors[li].map(({ chord, charIndex }) => ({
                    rawChords: chord,
                    rawPosition: charIndex,
                    hasNextChar: true
                  }));
                }

                return (
                  <div key={li} className="line-block" style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}>
                    {showChords && <div className="chord-line">{renderChordLine({ ...lineObj, chords: chordsToRender })}</div>}
                    <div className="lyric-line">{lineObj.cleanLyrics}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ParsedSongDisplay;
