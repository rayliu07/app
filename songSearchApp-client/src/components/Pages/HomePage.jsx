import React from 'react';
import SongSearch from '../HomePage/SongSearch';
import LanguageSelector from '../HomePage/LanguageSelector';
import { Link } from 'react-router-dom';


function HomePage() {
    const [selectedLang, setSelectedLang] = React.useState('');

    return (
        <div>
            <div>
                <LanguageSelector onChange={setSelectedLang} />
                <SongSearch language={selectedLang} />
            </div>
        </div>
    );
}

export default HomePage;
