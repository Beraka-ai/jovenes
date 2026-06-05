export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }
  if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { user, repo, token, boardId, boardData } = JSON.parse(await context.request.text());
    if (!user || !repo || !token || !boardId || !boardData) return Response.json({ error: 'Faltan datos' }, { status: 400 });

    const path = `tableros/${boardId}.json`;
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
    const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };

    let sha = null;
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) { sha = (await getRes.json()).sha; }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(boardData, null, 2))));
    const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify({ message: `Guardar: ${boardData.title || boardId}`, content, ...(sha && { sha }) }) });
    const result = await putRes.json();
    if (!putRes.ok) throw new Error(result.message);

    return Response.json({ ok: true, boardId }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
