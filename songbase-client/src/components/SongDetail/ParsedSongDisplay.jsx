import React, { useState, useEffect } from 'react';
import './ParsedSongDisplay.css';

const CHORDS_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

// Transpose chords, preserving original separators (- and /)
function transposeChord(chordStr, semitones) {
  if (!chordStr) return '';
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

/**
 * Parse the raw lyrics into segments.
 * Recognizes any "### Something" heading as a tune section.
 */
function parseTuneSegments(raw) {
  if (!raw) return [{ type: 'common', lines: [] }];
  const headingRegex = /^#{3}\s*(.+)\s*$/i; // match any text after ###
  const rawLines = raw.split('\n');
  const segments = [];
  let current = { type: 'common', lines: [] };

  for (const rawLine of rawLines) {
    const m = rawLine.match(headingRegex);
    if (m) {
      // push current
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
  const preSegments = rawLyrics ? parseTuneSegments(rawLyrics) : [{ type: 'common', lines: [] }];
  const preTuneNames = [...new Set(preSegments.filter(s => s.type === 'tune').map(s => s.tuneName))];
  const initialTune = preTuneNames.length > 0 ? preTuneNames[0] : null;

  const [showChords, setShowChords] = useState(true);
  const [transpose, setTranspose] = useState(0);
  const [selectedTune, setSelectedTune] = useState(initialTune);

  useEffect(() => {
    const tuneNames = [...new Set(preSegments.filter(s => s.type === 'tune').map(s => s.tuneName))];
    setSelectedTune(tuneNames.length > 0 ? tuneNames[0] : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawLyrics]);

  if (!rawLyrics) return null;

  const allLines = rawLyrics.split('\n');

  const verseReference = allLines.find(line => line.startsWith('# ') && !line.toLowerCase().includes('capo'))
    ?.replace(/^#\s*/, '') || '';

  const capoMatch = allLines.find(line => line.toLowerCase().includes('capo'))
    ?.match(/capo\s*(\d+)/i);
  const capoNumber = capoMatch ? capoMatch[1] : null;

  const segments = preSegments;
  const tuneNames = preTuneNames;
  const shouldShowSelector = tuneNames.length >= 2;

  const displayLines = [];
  for (const seg of segments) {
    if (seg.type === 'tune') {
      if (!selectedTune || seg.tuneName !== selectedTune) continue;
    }
    for (const ln of seg.lines) {
      if (ln.startsWith('#')) continue;
      if (ln.toLowerCase().includes('capo')) continue;
      displayLines.push(ln);
    }
  }

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
    const isChorus = indentChars >= 2;
    const content = line.slice(indentChars);

    const regex = /\[([^\]]+)\]/g;
    let chords = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const rawChords = match[1];
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
        {transpose !== 0 && (
          <span className="transpose-indicator">
            ({transpose > 0 ? `+${transpose}` : transpose})
          </span>
        )}

        {shouldShowSelector && (
          <div className="tune-selector" style={{ marginLeft: 12 }}>
            <label>
              Tune:&nbsp;
              <select
                value={selectedTune || ''}
                onChange={e => setSelectedTune(e.target.value || null)}
              >
                {tuneNames.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="lyrics-section">
        {displayLines.map((line, idx) => {
          if (line.trim() === '') return <br key={`br-${idx}`} />;
          if (isSectionHeader(line)) return renderSectionHeader(line, idx);
          return renderLine(line, idx);
        })}
      </div>
    </div>
  );
}

export default ParsedSongDisplay;
