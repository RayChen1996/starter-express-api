const axios = require('axios');

// Cloud Natural Language API 的 URL
const apiUrl = 'https://content-language.googleapis.com/v2/documents:analyzeEntities';
require("dotenv").config();

// 请替换为您的 Google Cloud 项目 ID 和 API 密钥
const projectId = 'YOUR_PROJECT_ID';
const apiKey = process.env.GOOGLE_APIKEY;

// 示例文本
const text = '測試測試測試測試文章 測試文章測試文章測試文章測試文章。';

// 发起 API 请求
axios.post(`${apiUrl}?key=${apiKey}`, {
  document: {
    content: text,
    type: 'PLAIN_TEXT',
  },
})
  .then(response => {
    console.log('API 响应:', response.data);
  })
  .catch(error => {
    console.error('API 请求失败:', error.response.data);
  });
