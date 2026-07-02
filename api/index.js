const crypto = require('crypto');

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    const referer = req.headers.referer || '/';
    res.writeHead(302, { Location: referer });
    return res.end();
  }

  const body = req.body || {};
  const query = req.query || {};

  // Validate required fields
  if (!body.name || !body.phone) {
    const referer = req.headers.referer || '/';
    res.writeHead(302, { Location: referer });
    return res.end();
  }

  // Config
  const config = {
    api_key: 'c66289394c2a6e8515c8e8b382fba719',
    offer_id: '13342',
    user_id: '75329',
    api_domain: 'https://t-api.org',
  };

  // Get client IP
  const ip =
    req.headers['cf-connecting-ip'] ||
    req.headers['x-client-ip'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'Unknown';

  // Build lead data
  const leadData = {
    name: (body.name || '').trim(),
    phone: (body.phone || '').trim(),
    offer_id: config.offer_id,
    country: 'HR',
  };

  // Optional params
  const optionalParams = [
    'tz', 'address', 'region', 'city', 'zip', 'stream_id', 'count',
    'email', 'user_comment',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'sub_id', 'sub_id_1', 'sub_id_2', 'sub_id_3', 'sub_id_4',
    'referer', 'user_agent', 'ip',
  ];

  // Merge from body
  const mergedParams = {
    ...body,
    region: body.region || null,
    city: body.city || null,
    count: body.count || null,
    offer_id: config.offer_id,
    stream_id: body.stream_id || '',
    country: 'HR',
    tz: body.tz || '',
    address: body.address || null,
    email: body.email || null,
    zip: body.zip || null,
    user_comment: body.user_comment || null,
    referer: query.referer || req.headers.referer || null,
    user_agent: req.headers['user-agent'] || 'Unknown',
    ip: ip,
    utm_source: query.utm_source || null,
    utm_medium: query.utm_medium || null,
    utm_campaign: query.utm_campaign || null,
    utm_term: query.utm_term || null,
    utm_content: query.utm_content || null,
    sub_id: query.sub_id || null,
    sub_id_1: query.sub_id_1 || null,
    sub_id_2: query.sub_id_2 || null,
    sub_id_3: query.sub_id_3 || null,
    sub_id_4: query.sub_id_4 || null,
  };

  for (const key of optionalParams) {
    if (mergedParams[key] !== undefined && mergedParams[key] !== null) {
      leadData[key] = mergedParams[key];
    }
  }

  // Build request payload
  const payload = {
    user_id: config.user_id,
    data: leadData,
  };

  const jsonData = JSON.stringify(payload);
  const checkSum = crypto.createHash('sha1').update(jsonData + config.api_key).digest('hex');

  const apiUrl = `${config.api_domain}/api/lead/create?check_sum=${encodeURIComponent(checkSum)}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonData,
    });

    const result = await response.json();

    if (result.status === 'ok' && result.data) {
      res.writeHead(302, { Location: `/success.html?id=${result.data.id}` });
      return res.end();
    } else if (result.status === 'error') {
      res.status(500).send(result.error || 'API error');
    } else {
      res.status(500).send('Unknown response status');
    }
  } catch (err) {
    res.status(500).send('HTTP request error: ' + err.message);
  }
};
