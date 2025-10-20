const axios = require('axios');

(async () => {
  try {
    const login = await axios.post('http://localhost:4000/api/auth/login', { username: 'admin', password: 'admin123' });
    const token = login.data.token;
    console.log('token:', token.slice(0, 20) + '...');

    const subs = await axios.get('http://localhost:4000/api/admin/subjects', { headers: { Authorization: 'Bearer ' + token } });
    console.log('subjects:');
    for (const s of subs.data) {
      console.log(`- id: ${s.id} name: ${s.name}`);
    }

    for (const s of subs.data) {
      try {
        const st = await axios.get(`http://localhost:4000/api/admin/stats/${s.id}`, { headers: { Authorization: 'Bearer ' + token } });
        console.log(`stats for ${s.name}:`, Object.keys(st.data));
      } catch (e) {
        console.error(`err stats ${s.name}:`, e.response ? e.response.status : e.message);
        if (e.response && e.response.data) console.error('body:', e.response.data);
      }
    }
  } catch (err) {
    console.error('error:', err.response ? err.response.data : err.message);
  }
})();
