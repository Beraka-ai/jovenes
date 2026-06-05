export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }
  if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { user, repo, token } = JSON.parse(await context.request.text());
    if (!user || !repo || !token) return Response.json({ error: 'Faltan datos' }, { status: 400 });

    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/tableros`;
    const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'User-Agent': 'tablero-jovenes' };

    const listRes = await fetch(apiUrl, { headers });
    if (listRes.status === 404) return Response.json({ boards: [] }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    if (!listRes.ok) throw new Error('Error al listar');

    const files = (await listRes.json()).filter(f => f.name.endsWith('.json'));
    const boards = await Promise.all(files.map(async f => {
      try {
        const d = await (await fetch(f.download_url)).json();
        return { id: f.name.replace('.json',''), data: d, savedAt: d.savedAt || f.name };
      } catch(e) { return null; }
    }));

    return Response.json({ boards: boards.filter(Boolean) }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
