import http from 'http';

const content = JSON.stringify({
  text: "Halo sahabat setia",
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/tts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': content.length,
    },
  },
  (res) => {
    let body = '';
    res.on('data', (d) => {
      body += d;
    });
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      try {
           const j = JSON.parse(body);
           console.log('Keys:', Object.keys(j));
           if(j.error) console.log('ERROR:', j.error);
      } catch(e) {
           console.log('Body:', body.slice(0, 100));
      }
    });
  }
);

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(content);
req.end();
