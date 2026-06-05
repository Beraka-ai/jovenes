exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { user, repo, token, content } = JSON.parse(event.body);

    if (!user || !repo || !token || !content) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos requeridos' }) };
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
      body: JSON.stringify({
        message: 'Actualizar tablero',
        content,
        ...(sha && { sha })
      })
    });

    const result = await putRes.json();
    if (!putRes.ok) throw new Error(result.message || 'Error al publicar');

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
