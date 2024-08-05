import { NestFactory } from '@nestjs/core';

import helmet from 'helmet';
import 'dotenv/config';

import { AppModule } from './app.module';

const port = process.env.PORT || 4000;

// DNS lookup
const dns = require('dns');
dns.lookup('nodejsawscartapistack-cartrds6d757a80-lzxn1obinuve.c5088q8aehm5.eu-west-1.rds.amazonaws.com', (err, address, family) => {
  console.log('Address: ' + address);
  console.log('Family: ' + family);
});

console.log('address', dns.lookup('nodejsawscartapistack-cartrds6d757a80-lzxn1obinuve.c5088q8aehm5.eu-west-1.rds.amazonaws.com'))


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });
  app.use(helmet());

  await app.listen(port);
}
bootstrap().then(() => {
  console.log('App is running on %s port', port);
});
