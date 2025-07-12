export async function pingBackend() {
    const res = await fetch("http://localhost:8000/");
    const data = await res.json();
    return data;
  }
  