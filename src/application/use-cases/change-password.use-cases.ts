import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ChangePasswordDto } from 'src/domain/entities/user.entity';
import { EncrypterPort } from 'src/domain/ports/encrypter.port';
import { UserRepositoryPort } from 'src/domain/ports/user-repository.port';
import { userErrors } from '../error.constants';

@Injectable()
export class ChangePasswordUseCases {
  constructor(
    @Inject('UserRepositoryPort')
    private userRepository: UserRepositoryPort,
    @Inject('EncrypterPort')
    private encrypter: EncrypterPort,
  ) {}

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Obtener el usuario por su ID
    const user = await this.userRepository.findByIdAuth(userId);
    if (!user) {
      throw new BadRequestException(userErrors.userNotFound);
    }

    // Verificar la contraseña actual
    const isMatch = await this.encrypter.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException(userErrors.currentPasswordIsIncorrect);
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await this.encrypter.hash(newPassword);
    user.password = hashedNewPassword;

    // Guardar el usuario con la nueva contraseña
    await this.userRepository.update(userId, { password: user.password });
  }
}
