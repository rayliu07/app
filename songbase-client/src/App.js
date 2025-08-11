// Import React and hooks for state and side effects
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Title from './components/Title';
import SongDetail from './components/SongDetail';
import HomePage from './components/HomePage';


function App() {
  // State to hold the selected language


  // Render the UI
  return (
    <Router>
      <Title />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/songs/:id" element={<SongDetail />} />
      </Routes>


  </Router>
);
}

export default App;