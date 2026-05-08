const axios = require('axios');
axios.get('https://masothue.com/Search/?q=0101243150')
  .then(res => console.log(res.status, res.data.substring(0, 100)))
  .catch(err => console.log(err.message, err.response?.status));
