import React, { useState } from 'react';
import './ParsedSongDisplay.css';


const CHORDS_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };


// Transpose chords, supports multi-chord brackets like G-D-C-G
function transposeChord(chordStr, semitones) {
  if (!chordStr) return '';
  return chordStr
    .split(/[-/]/)
    .map(ch => {
      const match = ch.match(/^([A-G][b#]?)(.*)$/);
      if (!match) return ch;
      let [_, root, suffix] = match;
      root = FLAT_TO_SHARP[root] || root;
      const index = CHORDS_SHARP.indexOf(root);
      if (index === -1) return ch;
      const newIndex = (index + semitones + CHORDS_SHARP.length) % CHORDS_SHARP.length;
      return CHORDS_SHARP[newIndex] + suffix;
    })
    .join('-');
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
  // 1) Detect leading spaces and whether this is a chorus line
  const indentMatch = line.match(/^( +)/);
  const indentChars = indentMatch ? indentMatch[1].length : 0;
  const isChorus = indentChars >= 2; // your rule: lines starting with 2 spaces are chorus

  // 2) Work on content WITHOUT the leading spaces so our chord positions
  //    are relative to the first visible character
  const content = line.slice(indentChars);

  // 3) Extract chords from the de-indented content
  const regex = /\[([^\]]+)\]/g;
  let chords = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawChords = match[1].split(/[-/]/); // supports [D-Em] and [D/Em]
    const bracketEnd = match.index + match[0].length;
    const nextChar = content[bracketEnd];
    chords.push({
      rawChords,
      rawPosition: bracketEnd,
      hasNextChar: !!nextChar && nextChar !== '\n'
    });
  }

  // 4) Clean lyrics (no brackets), still from de-indented content
  const cleanLyrics = content.replace(/\[([^\]]+)\]/g, '');

  // 5) Compute how long the chord line must be (allow spill past last char)
  let chordLineLength = cleanLyrics.length;
  chords.forEach(({ rawChords, rawPosition, hasNextChar }) => {
    const bracketsBeforeLen = (content.slice(0, rawPosition).match(/\[([^\]]+)\]/g) || [])
      .reduce((sum, b) => sum + b.length, 0);
    let cleanPos = rawPosition - bracketsBeforeLen;
    if (!hasNextChar) {
      // end-of-line chords anchor at/after last visible character
      cleanPos = cleanLyrics.replace(/\s+$/,'').length;
    }
    const totalLen = cleanPos + rawChords.reduce((s, c) => s + transposeChord(c, transpose).length, 0);
    if (totalLen > chordLineLength) chordLineLength = totalLen;
  });

  // 6) Build chord array and place chords
  const chordArray = Array(chordLineLength).fill(' ');
  chords.forEach(({ rawChords, rawPosition, hasNextChar }) => {
    const bracketsBeforeLen = (content.slice(0, rawPosition).match(/\[([^\]]+)\]/g) || [])
      .reduce((sum, b) => sum + b.length, 0);
    let cleanPos = rawPosition - bracketsBeforeLen;
    if (!hasNextChar) {
      cleanPos = cleanLyrics.replace(/\s+$/,'').length;
    }
    rawChords.forEach(ch => {
      const chord = transposeChord(ch, transpose);
      for (let i = 0; i < chord.length; i++) {
        chordArray[cleanPos + i] = chord[i];
      }
      cleanPos += chord.length; // place next chord right after
    });
  });

  // 7) Render with a chorus class and per-line indent using a CSS variable
  return (
    <div
      key={index}
      className={`line-block${isChorus ? ' chorus-line' : ''}`}
      style={{
        fontFamily: 'monospace',
        whiteSpace: 'pre',
        // expose the number of "ch" units as a CSS variable so CSS can indent both rows equally
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



