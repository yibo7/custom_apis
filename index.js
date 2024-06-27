const express = require('express');
const bodyParser = require('body-parser');

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 305;

// 使用body-parser中间件解析JSON和URL编码的请求
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 简单的GET路由
app.get('/', (req, res) => {
  res.json({ message: 'apis!' });
});
 

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.post('/api/gemini', async (req, res) => {
  const data = req.body;
  const key = data.k;
  const prompt = data.txt;
  let model_name = "gemini-pro";
  if(data.model){
    model_name = data.model;
  }
  // console.log(prompt)
  const genAI = new GoogleGenerativeAI(key);

  const safety_settings = [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_NONE'
    },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_NONE'
    }
    ];
   

  const model = genAI.getGenerativeModel({ model: model_name}); 
  model.safetySettings = safety_settings;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  const text = response.text();

  res.json({ c: text,code:0 });
});

app.post('/api/gemini/s', async (req, res) => {

  const data = req.body;
  const key = data.k;
  const prompt = data.txt;
  let model_name = "gemini-pro";
  if(data.model){
    model_name = data.model;
  } 

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  let his = [];
  if(data.hs){

    his = data.hs;
  }

  // console.log(his)

  try {

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: model_name}); 

    const chat = model.startChat({
      history: his
      // ,generationConfig: {
      //   maxOutputTokens: 100,
      // },
    });

    const result = await chat.sendMessageStream(prompt);

    // const result = await model.generateContentStream(prompt);

    res.setHeader('Content-Type', 'text/plain'); // 设置响应类型为纯文本

    // 发送流式响应
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(chunkText); // 逐步写入响应
    }

    res.end(); // 完成响应

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 


// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});