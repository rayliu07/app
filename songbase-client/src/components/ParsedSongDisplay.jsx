import React, { useState } from 'react';
import './ParsedSongDisplay.css';

const CHORDS_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

// Transpose chords, preserving original separators (- and /)
function transposeChord(chordStr, semitones) {
  if (!chordStr) return '';
  // Match chords with their separators
  return chordStr.replace(/([A-G][b#]?[^-/]*)/g, (match, chord) => {
    const m = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!m) return chord;
    let [_, root, suffix] = m;
    root = FLAT_TO_SHARP[root] || root;
    const index = CHORDS_SHARP.indexOf(root);
    if (index === -1) return chord;
    const newIndex = (index + semitones + CHORDS_SHARP.length) % CHORDS_SHARP.length;
    return CHORDS_SHARP[newIndex] + suffix;
  });
}

const isSectionHeader = line => /^\[[A-Za-z\s]+\]$/.test(line.trim());

function ParsedSongDisplay({ rawLyrics }) {
  const [showChords, setShowChords] = useState(true);
  const [transpose, setTranspose] = useState(0);

  if (!rawLyrics) return null;

  const lines = rawLyrics.split('\n'); // keep leading spaces for chorus detection

  const verseReference = lines.find(line => line.startsWith('# ') && !line.toLowerCase().includes('capo'))
    ?.replace(/^#\s*/, '') || '';

  const capoMatch = lines.find(line => line.toLowerCase().includes('capo'))
    ?.match(/capo\s*(\d+)/i);
  const capoNumber = capoMatch ? capoMatch[1] : null;

  const lyricLines = lines.filter(line =>
    !line.startsWith('#') &&
    !line.toLowerCase().includes('capo')
  );

  const renderSectionHeader = (line, index) => {
    const label = line.replace(/\[|\]/g, '');
    const isChorus = /chorus/i.test(label);
    return (
      <div
        key={`section-${index}`}
        className={isChorus ? 'section-header chorus-header' : 'section-header'}
      >
        {label}
      </div>
    );
  };

  const renderLine = (line, index) => {
    const indentMatch = line.match(/^( +)/);
    const indentChars = indentMatch ? indentMatch[1].length : 0;
    const isChorus = indentChars >= 2; // lines starting with 2 spaces are chorus
    const content = line.slice(indentChars);

    const regex = /\[([^\]]+)\]/g;
    let chords = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const rawChords = match[1]; // full inside including separators
      const bracketEnd = match.index + match[0].length;
      const nextChar = content[bracketEnd];
      chords.push({
        rawChords,
        rawPosition: bracketEnd,
        hasNextChar: !!nextChar && nextChar !== '\n'
      });
    }

    const cleanLyrics = content.replace(/\[([^\]]+)\]/g, '');

    let chordLineLength = cleanLyrics.length;
    chords.forEach(({ rawChords, rawPosition, hasNextChar }) => {
      const bracketsBeforeLen = (content.slice(0, rawPosition).match(/\[([^\]]+)\]/g) || [])
        .reduce((sum, b) => sum + b.length, 0);
      let cleanPos = rawPosition - bracketsBeforeLen;
      if (!hasNextChar) {
        cleanPos = cleanLyrics.replace(/\s+$/, '').length;
      }
      const totalLen = cleanPos + transposeChord(rawChords, transpose).length;
      if (totalLen > chordLineLength) chordLineLength = totalLen;
    });

    const chordArray = Array(chordLineLength).fill(' ');
    chords.forEach(({ rawChords, rawPosition, hasNextChar }) => {
      const bracketsBeforeLen = (content.slice(0, rawPosition).match(/\[([^\]]+)\]/g) || [])
        .reduce((sum, b) => sum + b.length, 0);
      let cleanPos = rawPosition - bracketsBeforeLen;
      if (!hasNextChar) {
        cleanPos = cleanLyrics.replace(/\s+$/, '').length;
      }
      const chordStr = transposeChord(rawChords, transpose);
      for (let i = 0; i < chordStr.length; i++) {
        chordArray[cleanPos + i] = chordStr[i];
      }
    });

    return (
      <div
        key={index}
        className={`line-block${isChorus ? ' chorus-line' : ''}`}
        style={{
          fontFamily: 'monospace',
          whiteSpace: 'pre',
          ...(isChorus ? { ['--indent-ch']: indentChars } : {})
        }}
      >
        {showChords && <div className="chord-line">{chordArray.join('')}</div>}
        <div className="lyric-line">{cleanLyrics}</div>
      </div>
    );
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
      </div>

      <div className="lyrics-section">
        {lyricLines.map((line, idx) => {
          if (line.trim() === '') return <br key={`br-${idx}`} />;
          if (isSectionHeader(line)) return renderSectionHeader(line, idx);
          return renderLine(line, idx);
        })}
      </div>
    </div>
  );
}

export default ParsedSongDisplay;
