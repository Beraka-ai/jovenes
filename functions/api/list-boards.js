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

    const { user, repo } = JSON.parse(body);
    if (!user || !repo) {
      return Response.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/tableros`;
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'tablero-jovenes'
    };

    const res = await fetch(apiUrl, { headers });

    if (res.status === 404) {
      return Response.json({ boards: [] }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const rawText = await res.text();
    let files;
    try { files = JSON.parse(rawText); }
    catch(e) { throw new Error(`Error ${res.status}: ${rawText.slice(0, 300)}`); }

    if (!res.ok) throw new Error(files.message || rawText);

    const boards = await Promise.all(
      files
        .filter(f => f.name.endsWith('.json'))
        .map(async f => {
          const fileRes = await fetch(f.url, { headers });
          if (!fileRes.ok) return null;
          const fileData = await fileRes.json();
          const decoded = JSON.parse(decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, '')))));
          return {
            id: f.name.replace('.json', ''),
            data: decoded,
            savedAt: decoded.savedAt || ''
          };
        })
    );

    return Response.json(
      { boards: boards.filter(Boolean) },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );

  } catch(e) {
    return Response.json({ error: e.message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
