export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // CORS headers
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // KV binding name: CLICK_KV (configure in CF dashboard)
    const kv = env.CLICK_KV;
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { 'Content-Type': 'application/json', ...cors }
      });

    try {
      // GET /get/<namespace>/<key>
      if (pathname.startsWith('/get/')) {
        const [, , ns, key] = pathname.split('/');
        const storageKey = `${ns}:${key}`;
        const val = Number(await kv.get(storageKey)) || 0;
        return json({ value: val });
      }

      // GET /hit/<namespace>/<key> (+1)
      if (pathname.startsWith('/hit/')) {
        const [, , ns, key] = pathname.split('/');
        const storageKey = `${ns}:${key}`;
        const val = Number(await kv.get(storageKey)) || 0;
        const next = val + 1;
        await kv.put(storageKey, String(next));
        return json({ value: next });
      }

      // GET /update/<namespace>/<key>?amount=n
      if (pathname.startsWith('/update/')) {
        const [, , ns, key] = pathname.split('/');
        const amount = Number(searchParams.get('amount') || '1') || 1;
        const storageKey = `${ns}:${key}`;
        const val = Number(await kv.get(storageKey)) || 0;
        const next = val + amount;
        await kv.put(storageKey, String(next));
        return json({ value: next });
      }

      // GET /create?namespace=...&key=...&value=...
      if (pathname === '/create') {
        const ns = searchParams.get('namespace') || 'default';
        const key = searchParams.get('key') || 'counter';
        const value = Number(searchParams.get('value') || '0') || 0;
        const storageKey = `${ns}:${key}`;
        await kv.put(storageKey, String(value), { overwrite: false });
        const val = Number(await kv.get(storageKey)) || 0;
        return json({ value: val });
      }

      return json({ error: 'Not found' }, 404);
    } catch (e) {
      return json({ error: e.message || 'Internal error' }, 500);
    }
  }
}



