const path = require('path');
require('express-async-errors');
require('dotenv').config();
const express = require('express');

// Security Packages
const cors = require('cors');

const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');

const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Connect database
const connectDB = require('./db/connect');

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: 'https://pro-manage-frontend-wine.vercel.app', // Replace with your actual frontend domain
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://pro-manage-frontend-wine.vercel.app'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/v1/users/', userRoutes);
app.use('/api/v1/user/tasks/', taskRoutes);

// Middlewares
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = 3000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(process.env.PORT || port, () => {
      console.log(`Server is listening on port ${process.env.PORT || port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
