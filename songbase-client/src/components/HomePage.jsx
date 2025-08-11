import React from 'react';
import SongSearch from './SongSearch';
import LanguageSelector from './LanguageSelector';


function HomePage() {
    const [selectedLang, setSelectedLang] = React.useState('');

    return (
        <div>
            <LanguageSelector onChange={setSelectedLang} />
            <SongSearch language={selectedLang} />
        </div>
    );
}

export default HomePage;
