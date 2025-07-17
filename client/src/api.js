
export async function parseCode(code, language) {
  try {
    const res = await fetch('http://localhost:3000/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(`AST Error: ${error.error}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Parse failed:', error);
    throw error;
  }
}
  