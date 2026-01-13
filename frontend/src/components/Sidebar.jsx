import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h1 className="logo">AuroraMusic</h1>

      <nav className="menu">
        <NavLink to="/" end>
          🏠 Home
        </NavLink>

        <NavLink to="/library">
          🎵 Library
        </NavLink>

        <NavLink to="/playlists">
          📁 Playlists
        </NavLink>
      </nav>
    </aside>
  );
}
