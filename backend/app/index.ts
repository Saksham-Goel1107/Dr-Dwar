import express from 'express';
import dotenv from 'dotenv';

const app = express();
app.use(express.json());
dotenv.config();

app.get('/healthz', (_, res) => {
  res.send('Server is healthy...');
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
