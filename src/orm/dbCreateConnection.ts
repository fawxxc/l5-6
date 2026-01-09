// src/orm/dbCreateConnection.ts
import {
  Connection,
  createConnection,
  getConnectionManager,
} from 'typeorm';

import config from './config/ormconfig';

let connection: Connection | null = null;

export const dbCreateConnection = async (): Promise<Connection> => {
  // якщо вже є активне підключення – повертаємо його
  if (connection && connection.isConnected) {
    return connection;
  }

  try {
    console.log('PG_HOST from env =', process.env.PG_HOST);
    connection = await createConnection(config);
    return connection;
  } catch (err) {
    const anyErr = err as any;

    if (anyErr?.name === 'AlreadyHasActiveConnectionError') {
      // підключення вже створене – дістаємо його з менеджера
      const activeConnection = getConnectionManager().get(config.name);
      connection = activeConnection;
      return activeConnection;
    }

    console.error('DB connection error:', err);
    throw err; // важливо: викидаємо помилку, а не повертаємо null
  }
};
