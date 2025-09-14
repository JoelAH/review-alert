import { Context } from 'aws-lambda';
import { connectDB } from '@libs/utilities/db';
import { processApps } from './process';

let dbConn = null;
const DB_URI = process.env.DB_URI;

export const main = async (context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try{
    await connectDB(dbConn, DB_URI);
    await processApps();
  }
  catch (err) {
    console.log(err)
  }
};
