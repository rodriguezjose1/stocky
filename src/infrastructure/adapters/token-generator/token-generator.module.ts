import { Module } from '@nestjs/common';
import { JwtTokenGenerator } from './jwt-token-generator.adapter';
import { JwtModuleOptions, JwtService } from '@nestjs/jwt';

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
  ],
  exports: ['TokenGeneratorPort'],
})
export class TokenGeneratorModule {}
