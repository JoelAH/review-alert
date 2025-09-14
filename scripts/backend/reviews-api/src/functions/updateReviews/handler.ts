import { formatErrorResponse, formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import schema from './schema';
import { update } from './update';
import { Context } from 'aws-lambda';
import { connectDB } from '@libs/utilities/db';

let dbConn = null;
const DB_URI = process.env.DB_URI;

interface UpdateRequest {
    body: { ids: string[] }
}

const handler = async (event: UpdateRequest, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log('body', event.body);
  try{
    await connectDB(dbConn, DB_URI);
    return formatJSONResponse(await update(event.body.ids));
  }
  catch (err) {
    console.log(err)
    return formatErrorResponse(err)
  }
};

export const main = middyfy(handler, schema);
