exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { user, repo, token, boardId } = JSON.parse(event.body);

    if (!user || !repo || !token || !boardId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos requeridos' }) };
    }

    const path   = `tableros/${boardId}.json`;
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    // Get SHA first
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
