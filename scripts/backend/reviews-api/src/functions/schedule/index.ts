import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 900,
  events: [
   {
    schedule: {
        rate: ['cron(0 */4 * * ? *)'], enabled: true
    }
   }
  ],
};
