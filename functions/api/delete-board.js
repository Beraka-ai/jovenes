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
    const token = context.env.GITHUB_TOKEN;
    if (!token) return Response.json({ error: 'Token no configurado en servidor' }, { status: 500 });

    const body = await context.request.text();
    if (!body) return Response.json({ error: 'Body vacío' }, { status: 400 });

    const { user, repo, boardId } = JSON.parse(body);
    if (!user || !repo || !boardId) {
      return Response.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const path = `tableros/${boardId}.json`;
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'tablero-jovenes'
    };

    const getRes = await fetch(apiUrl, { headers });
    if (!getRes.ok) {
      return Response.json({ ok: true, note: 'Archivo no encontrado, nada que eliminar' }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const sha = (await getRes.json()).sha;

    const delRes = await fetch(apiUrl, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        message: `Eliminar tablero: ${boardId}`,
        sha
      })
    });

    const rawText = await delRes.text();
    let result;
    try { result = JSON.parse(rawText); }
    catch(e) { throw new Error(`Error ${delRes.status}: ${rawText.slice(0, 300)}`); }

    if (!delRes.ok) throw new Error(result.message || rawText);

    return Response.json({ ok: true }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch(e) {
    return Response.json({ error: e.message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
