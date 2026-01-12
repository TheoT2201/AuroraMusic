import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import './styles/app.css';

export default function App() {
  const [search, setSearch] = useState('');

  return (
    <div className="app">
      <Sidebar />
      <main>
        <Header search={search} setSearch={setSearch} />
        <Home search={search} />
      </main>
    </div>
  );
}
