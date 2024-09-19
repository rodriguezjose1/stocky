import { Module } from '@nestjs/common';
import { BcryptEncrypter } from './bcrypt.adapter';

@Module({
  providers: [
    {
      provide: 'EncrypterPort',
      useClass: BcryptEncrypter,
    },
  ],
  exports: ['EncrypterPort'],
})
export class EncrypterModule {}
