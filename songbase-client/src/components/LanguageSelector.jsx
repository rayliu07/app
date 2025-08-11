import React, { useState, useEffect } from 'react';

function LanguageSelector({ onChange }) {
  // State to hold the list of languages and the selected language
    const [languages, setLanguages] = useState([]);
    const [selectedLang, setSelectedLang] = useState('');
  // Fetch all the possible languages from the API when the component mounts
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/languages`)
            .then(res => res.json())
            .then(data => {
                data = data.languages || [];
                // stores the languages in state
                setLanguages(data);
                // If English is available, set it as the default selected language
                if (data.includes('english')) {
                  setSelectedLang('english');
                  onChange('english');
                // If no English, set the first available language
                } else if (data.length > 0) {
                setSelectedLang(data[0]);
                onChange(data[0]);
                }
            })
            .catch(() => setLanguages([]));
        }, [onChange]);
    // Handle language selection change
    const handleChange = (e) => {
    setSelectedLang(e.target.value);
    onChange(e.target.value);
  };
    return (
    <label>
      Select Language:{' '}
      <select value={selectedLang} onChange={handleChange}>
        {languages.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
    </label>
  );
}

export default LanguageSelector;