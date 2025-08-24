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

app.post('/:type', (request: Request, response: Response) => {
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

app.listen(PORT, () => {
  console.log('Server running at PORT: ', PORT);
}).on('error', (error) => {
  // gracefully handle error
  throw new Error(error.message);
});
