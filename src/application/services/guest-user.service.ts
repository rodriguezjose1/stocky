import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/entities/user.entity';
import { GuestUserData } from 'src/domain/entities/sale.entity';
import { UserUseCases } from '../use-cases/user.use-cases';

@Injectable()
export class GuestUserService {
  constructor(
    private userUseCases: UserUseCases,
  ) {}

  /**
   * Crea o obtiene un usuario cliente basado en los datos del cliente
   * @param customerData - Datos del cliente
   * @param sessionId - ID de sesión para fallback
   * @returns Datos del usuario (real o invitado)
   */
  async createOrGetCustomerUser(
    customerData: {
      name: string;
      lastname: string;
      email: string;
      phone?: string;
      address?: string;
    },
    sessionId: string
  ): Promise<GuestUserData> {
    try {
      // Verificar si ya existe un usuario con ese email
      const existingUser = await this.userUseCases.findByEmail(customerData.email);
      
      if (existingUser) {
        // Usar el usuario existente
        return new GuestUserData(
          existingUser.id,
          existingUser.name,
          existingUser.lastname,
          existingUser.email,
          existingUser.phone,
          existingUser.address
        );
      } else {
        // Crear nuevo usuario cliente
        const newUser = new User(
          null, // ID se generará automáticamente
          customerData.name,
          customerData.lastname,
          '', // Password se generará automáticamente
          customerData.email,
          [], // Roles se asignarán automáticamente
          customerData.phone || '',
          new Date(), // birthdate
          customerData.address || '',
          true, // active
          new Date(), // lastConnection
          '' // dni
        );

        const createdUser = await this.userUseCases.createUser(newUser, 'customer');
        
        return new GuestUserData(
          createdUser.id,
          createdUser.name,
          createdUser.lastname,
          createdUser.email,
          createdUser.phone,
          createdUser.address
        );
      }
    } catch (error) {
      // Si hay error al crear/obtener usuario, usar guest user como fallback
      console.log('Error creating/getting user, using guest user as fallback:', error.message);
      return new GuestUserData(
        `guest_${sessionId}`,
        customerData.name,
        customerData.lastname,
        customerData.email,
        customerData.phone,
        customerData.address
      );
    }
  }
} 