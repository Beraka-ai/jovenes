export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { user, repo, token, boardId } = await context.request.json();

    if (!user || !repo || !token || !boardId) {
      return Response.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const path   = `tableros/${boardId}.json`;
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    const getRes = await fetch(apiUrl, { headers });
    if (!getRes.ok) throw new Error('Tablero no encontrado');
    const existing = await getRes.json();

    const delRes = await fetch(apiUrl, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        message: `Eliminar tablero: ${boardId}`,
        sha: existing.sha
      })
    });

    if (!delRes.ok) {
      const err = await delRes.json();
      throw new Error(err.message || 'Error al eliminar');
    }

    return Response.json({ ok: true });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
