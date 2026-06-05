export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { user, repo, token, boardId, boardData } = await context.request.json();

    if (!user || !repo || !token || !boardId || !boardData) {
      return Response.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const path   = `tableros/${boardId}.json`;
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    let sha = null;
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) { const ex = await getRes.json(); sha = ex.sha; }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(boardData, null, 2))));

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Guardar tablero: ${boardData.title || boardId}`,
        content,
        ...(sha && { sha })
      })
    });

    const result = await putRes.json();
    if (!putRes.ok) throw new Error(result.message || 'Error al guardar');

    return Response.json({ ok: true, boardId });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
