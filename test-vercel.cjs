const https = require('https');

const req = https.request('https://work-sphere-sooty.vercel.app/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});
req.write(JSON.stringify({}));
req.end();
