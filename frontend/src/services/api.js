export async function getTracks() {
  const res = await fetch('/api/tracks');
  return res.json();
}
