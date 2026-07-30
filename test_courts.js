const http = require('http');

const data = JSON.stringify({ email: 'admin@localhost.com', password: 'adminpassword' });

const options = {
  hostname: 'localhost',
  port: 3010,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const cookies = res.headers['set-cookie'];
    if (!cookies) return console.log('No cookies, login failed:', body);
    
    const tokenCookie = cookies.find(c => c.startsWith('token='));
    const token = tokenCookie ? tokenCookie.split(';')[0].split('=')[1] : null;

    const getOptions = {
      hostname: 'localhost',
      port: 3010,
      path: '/api/admin/courts',
      method: 'GET',
      headers: {
        'Cookie': `token=${token}`
      }
    };
    const getReq = http.request(getOptions, getRes => {
      let getBody = '';
      getRes.on('data', d => getBody += d);
      getRes.on('end', () => console.log('Response:', getRes.statusCode, getBody));
    });
    getReq.end();
  });
});

req.write(data);
req.end();
