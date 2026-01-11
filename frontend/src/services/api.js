const API_URL = 'http://localhost:5000'; // unde rulează backend-ul tău

export async function getTracks() {
  const res = await fetch(`${API_URL}/tracks`);
  return res.json();
}
