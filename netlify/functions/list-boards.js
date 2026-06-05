exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { user, repo, token } = JSON.parse(event.body);

    if (!user || !repo || !token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos requeridos' }) };
    }

    const apiUrl  = `https://api.github.com/repos/${user}/${repo}/contents/tableros`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    };

    const listRes = await fetch(apiUrl, { headers });

    // If folder doesn't exist yet, return empty list
    if (listRes.status === 404) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boards: [] })
      };
    }

    if (!listRes.ok) throw new Error('Error al listar tableros');

    const files = await listRes.json();
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

    // Fetch each board's content
    const boards = await Promise.all(jsonFiles.map(async (file) => {
      try {
        const res = await fetch(file.download_url);
        const boardData = await res.json();
        return {
          id: file.name.replace('.json', ''),
          data: boardData,
          sha: file.sha,
          savedAt: boardData.savedAt || file.name
        };
      } catch(e) {
        return null;
      }
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boards: boards.filter(Boolean) })
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
