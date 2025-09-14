import middy from "@middy/core"
import middyJsonBodyParser from "@middy/http-json-body-parser"
import httpErrorHandler from '@middy/http-error-handler'
import validator from '@middy/validator'
import { transpileSchema } from '@middy/validator/transpile'
import doNotWaitForEmptyEventLoop from "@middy/do-not-wait-for-empty-event-loop"

export const middyfy = (handler, eventSchema?: any) => {
  const mid = middy()
    .use(httpErrorHandler())
    .use(doNotWaitForEmptyEventLoop({runOnError: true}));

    if (eventSchema) {
      mid.use(middyJsonBodyParser())
      mid.use(validator({ eventSchema: transpileSchema(eventSchema) }))
    }

    mid.handler(handler)
    return mid
}
