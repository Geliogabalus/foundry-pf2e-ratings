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

app.get('/entry/:id/ratings', (request: Request, response: Response) => {
  const id = request.params.id;

  const ratings = dataSource.getEntryRatings(id);

  if (!ratings) {
    response.status(200).send({
      entryId: id,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    });
    return;
  }

  response.status(200).send(ratings);
});

app.get('/user/:id/:entryId', (request: Request, response: Response) => {

  const userId = request.params.id;
  const entryId = request.params.entryId;

  const rating = dataSource.getUserRating(Number(userId), entryId);

  response.status(200).send({ rating });
});

app.put('/user/:id/:entryId', (request: Request, response: Response) => {
  const userId = request.params.id;
  const entryId = request.params.entryId;
  const { rating } = request.body;

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    response.status(400).send({ error: 'Rating must be a number between 1 and 5' });
    return;
  }

  try {
    dataSource.updateUserRating(Number(userId), entryId, rating);
    response.status(200).send({ message: 'Rating updated successfully' });
  } catch (error) {
    response.status(500).send({
      error: 'Failed to update rating',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/auth', (request: Request, response: Response) => {

  const { username, password } = request.body;

  const id = dataSource.checkAuth(username, password);

  if (id != null) {
    response.status(200).send({ message: 'Authentication successful', userId: id });
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
    const id = dataSource.createUser(username, password);
    response.status(201).send({ message: 'User created successfully', userId: id });
  } catch (error) {
    response.status(500).send({
      error: 'Failed to create new user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
