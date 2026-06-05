export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { user, repo, token } = await context.request.json();

    if (!user || !repo || !token) {
      return Response.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/tableros`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    };

    const listRes = await fetch(apiUrl, { headers });

    if (listRes.status === 404) {
      return Response.json({ boards: [] });
    }

    if (!listRes.ok) throw new Error('Error al listar tableros');

    const files = await listRes.json();
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

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
      } catch(e) { return null; }
    }));

    return Response.json({ boards: boards.filter(Boolean) });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
