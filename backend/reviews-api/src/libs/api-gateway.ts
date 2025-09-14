import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda"
import type { FromSchema } from "json-schema-to-ts";

export type ApiResponse = {
  statusCode: number,
  body: string,
  headers: any
}

const ORIGIN_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  'Access-Control-Allow-Credentials': true
}

type ValidatedAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, 'body'> & { body: FromSchema<S> }
export type ValidatedEventAPIGatewayProxyEvent<S> = Handler<ValidatedAPIGatewayProxyEvent<S>, APIGatewayProxyResult>

export const formatJSONResponse = (response: Record<string, unknown>): ApiResponse => {
  const { statusCode, ...res } = response;
  return {
    statusCode: Number(statusCode) || 200,
    body: JSON.stringify(res),
    headers: ORIGIN_HEADERS
  }
}

export const formatErrorResponse = (err: any): ApiResponse => {
  const error = err?.name ? err.name : 'Exception';
  const message = err?.message ? err.message : 'Unknown error';
  const statusCode = err?.statusCode ? err.statusCode : 500;
  return {
    statusCode,
    body: JSON.stringify({
      error,
      message
    }),
    headers: ORIGIN_HEADERS
  }
}
