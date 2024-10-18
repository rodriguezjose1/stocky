import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';
import { UserUseCases } from 'src/application/use-cases/user.use-cases';

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(Strategy) {
  constructor(private userUseCases: UserUseCases) {
    super({
      passReqToCallback: true,
    });
  }

  public validate = async (req, username, password): Promise<boolean> => {
    try {
      const user = await this.userUseCases.validateUserBasic(username, password);
      return user;
    } catch (error) {
      return false;
    }
  };
}
