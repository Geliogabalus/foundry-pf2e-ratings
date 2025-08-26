import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DataSource } from './data/dataSource.js';

// configures dotenv to work in your application
dotenv.config();
const app = express();
app.use(cors({
  origin: '*',
}));
app.use(express.json());

const dataSource = new DataSource(process.env.DB_PATH || './database.db');

const PORT = process.env.PORT;

app.get('/ratings/:type', (request: Request, response: Response) => {
  const type = request.params.type;
  try {
    const ratings = dataSource.getRatings(type);
    response.status(200).send(JSON.stringify(ratings));
  } catch (error) {
    response.status(500).send({
      error: 'Failed to fetch ratings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/entry/:type', (request: Request, response: Response) => {
  const type = request.params.type;
  const id = request.body?.id;

  if (!id) {
    response.status(400).send({ error: 'Id is required' });
    return;
  }

  try {
    dataSource.addNewEntry({ id: id, type: type });
    response.status(201).send({ message: 'Entry added successfully' });
  } catch (error) {
    response.status(500).send({
      error: 'Failed to add new entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/auth', (request: Request, response: Response) => {

  const { username, password } = request.body;

  const exist = dataSource.checkAuth(username, password);

  if (exist) {
    response.status(200).send({ message: 'Authentication successful' });
  } else {
    response.status(401).send({ error: 'Invalid username or password' });
  }
});

app.listen(PORT, () => {
  console.log('Server running at PORT: ', PORT);
}).on('error', (error) => {
  // gracefully handle error
  throw new Error(error.message);
});

app.get('/user/:username', (request: Request, response: Response) => {
  const username = request.params.username;

  const exist = dataSource.checkUserName(username);
  console.log(exist);
  if (!exist) {
    response.status(404).send({ error: 'Username does not exist' });
    return;
  }
  response.status(200).send({ message: 'Username exists' });
});

app.post('/user', (request: Request, response: Response) => {
  const { username, password } = request.body;

  try {
    dataSource.createUser(username, password);
    response.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    response.status(500).send({
      error: 'Failed to create new user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
