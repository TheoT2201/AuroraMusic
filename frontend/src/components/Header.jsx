export default function Header({ search, setSearch }) {
  return (
    <div className="search">
      🔍
      <input
        placeholder="Search tracks, artists..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}
