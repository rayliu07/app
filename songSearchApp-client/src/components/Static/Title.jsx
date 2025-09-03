import React from 'react';
import { Link } from 'react-router-dom';

function Title() {
    return (
        
        <div>
            <header className="header">
                <h1 className="header-title">
                    <Link to="/" className="header-link">
                        SongSearch
                    </Link>
                </h1>
                <nav className="nav">
                    <Link to="/books/" className="nav-link">
                        Books
                    </Link>
                </nav>
            </header>
        </div>
    );
}

export default Title;
