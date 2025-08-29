import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DataSource } from './data/dataSource.js';

// configures dotenv to work in your application
dotenv.config();

const dataSource = new DataSource(process.env.DB_PATH || './database.db');

const app = express();

app.use(express.static('static'));
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log('Server running at PORT: ', PORT);
}).on('error', (error) => {
  // gracefully handle error
  throw new Error(error.message);
});

// Entries

app.get('/entry/:type', (request: Request, response: Response) => {
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

// User Ratings

app.get('/user/:id/:entryId', (request: Request, response: Response) => {

  const userId = request.params.id;
  const entryId = request.params.entryId;

  const rating = dataSource.getUserRating(userId, entryId);

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
    dataSource.updateUserRating(userId, entryId, rating);
    response.status(200).send({ message: 'Rating updated successfully' });
  } catch (error) {
    response.status(500).send({
      error: 'Failed to update rating',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// OAuth2 with Discord

const currentAuthUserData: Record<string, any> = {};

app.get('/oauth2', async ({ query }, response) => {
  const code = query.code as string;
  const state = query.state as string;

  if (code) {
    try {
      const tokenResponseData = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID as string,
          client_secret: process.env.DISCORD_CLIENT_SECRET as string,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.APP_URL}/oauth2`,
          scope: 'identify',
          state: state
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const oauthData: any = await tokenResponseData.json();

      const userData = await fetch('https://discord.com/api/users/@me', {
	      headers: {
		      authorization: `${oauthData.token_type} ${oauthData.access_token}`,
	      },
      });

      const user = await userData.json() as any;

      dataSource.createUser(user.id);
      currentAuthUserData[state] = user;
    } catch (error) {
      // NOTE: An unauthorized token will not throw an error
      // tokenResponseData.statusCode will be 401
      console.error(error);
    }
  }

  return response.sendFile('oauth2.html', { root: '.' });
});

app.get('/oauth2/:state', (request, response) => {
  const state = request.params.state;
  const userData = currentAuthUserData[state];

  if (userData) {
    return response.status(200).send(userData);
  } else {
    return response.status(200).send({ error: 'User data not found' });
  }
});
