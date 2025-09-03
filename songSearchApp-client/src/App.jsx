import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Title from './components/Static/Title.jsx';
import SongDetail from './components/Pages/SongDetail.jsx';
import HomePage from './components/Pages/HomePage.jsx';
import BookList from './components/Pages/BookList.jsx';
import BookDetail from './components/Pages/BookDetail.jsx';

function App() {
  return (
    <Router>
      <Title />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/songs/:id" element={<SongDetail />} />
        <Route path="/books" element={<BookList />} />
        <Route path="/books/:slug" element={<BookDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
