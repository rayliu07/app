import React from 'react';
import './SongDisplay.css';

function SongDisplay({ lyrics, showChords = true }) {
  if (!lyrics) return null;

  const renderLine = (line, index) => {
    // Section headers
    if (/^\[(.*?)\]$/.test(line.trim())) {
      return (
        <div key={index} className="section-header">
          {line.replace(/\[|\]/g, '')}
        </div>
      );
    }

    if (line.trim() === '') {
      return <br key={index} />;
    }

    const chordRegex = /\[([^\]]+)\]/g;
    let resultLyric = '';
    let lyricChars = [];
    let chordChars = [];
    let lastIndex = 0;
    let match;

    while ((match = chordRegex.exec(line)) !== null) {
      const chord = match[1];
      const chordStart = match.index;

      // Text before this chord
      const before = line.slice(lastIndex, chordStart);
      resultLyric += before;

      // Next word after the chord
      const afterStart = chordRegex.lastIndex;
      const afterMatch = line.slice(afterStart).match(/(\S+)/);
      const afterWord = afterMatch ? afterMatch[0] : '';

      resultLyric += afterWord;
      lastIndex = afterStart + afterWord.length;

      // Build arrays of characters
      const totalLength = before.length + afterWord.length;

      for (let i = 0; i < before.length; i++) {
        lyricChars.push(before[i]);
        chordChars.push(' ');
      }
      for (let i = 0; i < afterWord.length; i++) {
        lyricChars.push(afterWord[i]);
        chordChars.push(i === 0 ? chord : ' '.repeat(chord.length > 1 ? chord.length - 1 : 0));
      }
    }

    // Remaining text
    const rest = line.slice(lastIndex);
    for (let i = 0; i < rest.length; i++) {
      lyricChars.push(rest[i]);
      chordChars.push(' ');
    }

    return (
      <div key={index} className="song-line">
        {showChords && (
          <pre className="chord-line">{chordChars.join('')}</pre>
        )}
        <pre className="lyric-line">{lyricChars.join('')}</pre>
      </div>
    );
  };

  return (
    <div className="song-display-container">
      {lyrics
        .split('\n')
        .map((line, index) => renderLine(line, index))}
    </div>
  );
}

export default SongDisplay;
