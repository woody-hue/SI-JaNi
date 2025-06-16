const SUPABASE_URL = 'https://YOUR_SUPABASE_URL.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY';

export default async function handler(req, res) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  if (req.method === 'GET') {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/schedules?select=*`, {
      headers
    });
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
      method: 'POST',
      headers: {
        ...headers,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...rest } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing id for update' });
    }
    const response = await fetch(`${SUPABASE_URL}/rest/v1/schedules?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(rest)
    });
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing id for delete' });
    }
    const response = await fetch(`${SUPABASE_URL}/rest/v1/schedules?id=eq.${id}`, {
      method: 'DELETE',
      headers
    });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}