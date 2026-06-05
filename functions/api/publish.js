export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await context.request.text();
    if (!body) return Response.json({ error: 'Body vacío' }, { status: 400 });
    const { user, repo, token, content } = JSON.parse(body);

    if (!user || !repo || !token || !content) {
      return Response.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/index.html`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    let sha = null;
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) { const ex = await getRes.json(); sha = ex.sha; }

    const putRes = await fetch(apiUrl, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ message: 'Actualizar tablero', content, ...(sha && { sha }) })
});

const rawText = await putRes.text(); // <-- captura texto crudo primero

let result;
try { result = JSON.parse(rawText); } 
catch(e) { throw new Error(`Respuesta no-JSON (${putRes.status}): ${rawText}`); }

if (!putRes.ok) throw new Error(result.message || rawText);
