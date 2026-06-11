const http = require('http');
const fs = require('fs');

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/env',
    method: 'GET',
  },
  (res) => {
    let body = '';
    res.on('data', (d) => {
      body += d;
    });
    res.on('end', () => {
        fs.writeFileSync('output.log', body);
    });
  }
);
req.end();
