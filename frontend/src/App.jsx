import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Home from './pages/Home';
import Playlists from './pages/Playlists';

import './styles/app.css';

export default function App() {
  const [search, setSearch] = useState('');

  return (
    <div className="app">
      <Sidebar />
      <main>
        <Header search={search} setSearch={setSearch} />
        
        <Routes>
          <Route path="/" element={<Home search={search} />} />
          <Route path="/playlists" element={<Playlists />} />

          {/* fallback temporar */}
          <Route path="/library" element={<Home search={search} />} />
        </Routes>
      </main>
    </div>
  );
}
