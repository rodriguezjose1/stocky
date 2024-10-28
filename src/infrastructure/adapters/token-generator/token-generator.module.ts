import { Module } from '@nestjs/common';
import { JwtTokenGenerator } from './jwt-token-generator.adapter';
import { JwtModuleOptions, JwtService } from '@nestjs/jwt';
import { BasicTokenGenerator } from './basic-token-generator.adapter';

@Module({
  providers: [
    {
      provide: JwtService,
      useFactory: () => {
        const options: JwtModuleOptions = {
          secret: 'secret',
          signOptions: { expiresIn: '1h' },
        };
        return new JwtService(options);
      },
    },
    {
      provide: 'TokenGeneratorPort',
      useClass: JwtTokenGenerator,
    },
    {
      provide: 'TokenGeneratorBasicPort',
      useClass: BasicTokenGenerator,
    },
  ],
  exports: ['TokenGeneratorPort', 'TokenGeneratorBasicPort'],
})
export class TokenGeneratorModule {}
