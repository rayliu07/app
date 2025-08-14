import React from 'react';
import { Link } from 'react-router-dom';

function Title() {
    return (
        <div style={{ maxWidth: 700, margin: 'auto', fontFamily: 'Arial, sans-serif', padding: 20 }}>
        {/* App title */}
        <h1>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                Songbase Replicate
            </Link>
        </h1>
        </div>
    )
}

export default Title;