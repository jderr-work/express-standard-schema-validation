process.title = 'express-standard-schema-validation';

const port = 8080;

import express from 'express';
import { z } from 'zod';
import { createValidator } from '../../dist/index.js';
import router from './router.js';

const app = express();
const validator = createValidator();

const headerSchema = z.looseObject({
  host: z.string(),
  'user-agent': z.string(),
});

app.use(validator.headers(headerSchema));

app.use('/users', router);

app.listen(port, (err) => {
  if (err) {
    throw err;
  }

  console.log(`\napp started on ${port}\n`);
  console.log(
    `Try accessing http://localhost:${port}/users/1001 or http://localhost:${port}/users?name=barry to get some data.\n`,
  );
  console.log(
    `Now try access http://localhost:${port}/users?age=50. You should get an error complaining that your querystring is invalid.`,
  );
});
