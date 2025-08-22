// Import React and hooks for state and side effects
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Title from './components/Static/Title';
import SongDetail from './components/Pages/SongDetail';
import HomePage from './components/Pages/HomePage';
import BookList from './components/Pages/BookList';
import BookDetail from './components/Pages/BookDetail';


function App() {
  // State to hold the selected language


  // Render the UI
  return (
    <Router>
      <Title />
      <Routes>
        <Route path="/books/" element={<BookList />} />
        <Route path="/books/:slug" element={<BookDetail />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/songs/:id" element={<SongDetail />} />
      </Routes>


  </Router>
);
}

export default App;