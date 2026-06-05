export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }
  if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { user, repo, token, boardId } = JSON.parse(await context.request.text());
    if (!user || !repo || !token || !boardId) return Response.json({ error: 'Faltan datos' }, { status: 400 });

    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/tableros/${boardId}.json`;
    const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'tablero-jovenes' };

    const getRes = await fetch(apiUrl, { headers });
    if (!getRes.ok) throw new Error('No encontrado');
    const { sha } = await getRes.json();

    const delRes = await fetch(apiUrl, { method: 'DELETE', headers, body: JSON.stringify({ message: `Eliminar: ${boardId}`, sha }) });
    if (!delRes.ok) throw new Error('Error al eliminar');

    return Response.json({ ok: true }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
