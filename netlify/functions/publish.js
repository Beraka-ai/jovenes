exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { user, repo, token, content, sha } = JSON.parse(event.body);

    if (!user || !repo || !token || !content) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos requeridos' }) };
    }

    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/index.html`;

    // Get current SHA if not provided
    let currentSha = sha;
    if (!currentSha) {
      const getRes = await fetch(apiUrl, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const existing = await getRes.json();
        currentSha = existing.sha;
      }
    }

    // Push updated file
    const body = {
      message: 'Actualizar tablero',
      content: content,
      ...(currentSha && { sha: currentSha })
    };

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await putRes.json();

    if (!putRes.ok) {
      return {
        statusCode: putRes.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: result.message || 'Error al publicar' })
      };
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
