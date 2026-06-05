exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { user, repo, token, boardId, boardData } = JSON.parse(event.body);

    if (!user || !repo || !token || !boardId || !boardData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos requeridos' }) };
    }

    const path    = `tableros/${boardId}.json`;
    const apiUrl  = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    // Get current SHA if file exists
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, boardId })
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
