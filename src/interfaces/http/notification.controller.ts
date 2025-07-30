import { Body, Controller, Post, Inject, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IEmailService } from 'src/domain/ports/email-service.port';
import { NotificationUseCases } from '../../application/use-cases/notification.use-cases';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject('EmailService') private readonly emailService: IEmailService,
    private readonly notificationService: NotificationUseCases,
  ) {}

  @Post('async-events/sale-created/:saleId')
  async handleSaleCreated(@Param('saleId') saleId: string) {
    return this.notificationService.handleSaleCreated(saleId);
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Probar envío de email' })
  @ApiBody({
    description: 'Datos para probar el envío de email',
    examples: {
      example1: {
        summary: 'Email de prueba simple',
        value: {
          to: 'test@example.com',
          subject: 'Email de prueba',
          message: 'Este es un email de prueba desde la API'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Email enviado exitosamente' })
  @ApiResponse({ status: 500, description: 'Error al enviar email' })
  async testEmail(@Body() body: { to: string; subject: string; message: string }) {
    try {
      // Crear datos simples para el template
      const data = {
        message: body.message,
        timestamp: new Date().toISOString(),
        test: true
      };

      // Usar el template de error-notification que ya existe
      await this.emailService.sendEmail(
        body.to,
        body.subject,
        'error-notification',
        data
      );

      return {
        success: true,
        message: 'Email enviado exitosamente',
        to: body.to,
        subject: body.subject
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al enviar email',
        error: error.message
      };
    }
  }

  @Post('test-sale-email')
  @ApiOperation({ summary: 'Probar email de venta con datos hardcodeados de usuario invitado' })
  @ApiBody({
    description: 'Datos para probar el email de venta',
    examples: {
      example1: {
        summary: 'Email de venta con usuario invitado',
        value: {
          to: 'admin@example.com'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Email de venta enviado exitosamente' })
  @ApiResponse({ status: 500, description: 'Error al enviar email' })
  async testSaleEmail(@Body() body: { to: string }) {
    try {
      // Obtener fecha actual en zona horaria de Argentina
      const argentinaDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
      
      // Formatear con ceros a la izquierda para mejor legibilidad
      const day = argentinaDate.getDate().toString().padStart(2, '0');
      const month = (argentinaDate.getMonth() + 1).toString().padStart(2, '0');
      const year = argentinaDate.getFullYear();
      const hours = argentinaDate.getHours().toString().padStart(2, '0');
      const minutes = argentinaDate.getMinutes().toString().padStart(2, '0');
      
      const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

      // Datos hardcodeados para la prueba - siempre guest user
      const mockSaleData = {
        id: 'sale-123',
        date: formattedDate,
        user: {
          id: 'guest_550e8400-e29b-41d4-a716-446655440000',
          name: 'Juan',
          lastname: 'Pérez',
          email: 'juan.perez@email.com',
          phone: '+1234567890',
          address: 'Calle Principal 123, Ciudad, País'
        },
        details: [
          {
            productId: '507f1f77bcf86cd799439011',
            variantId: '507f1f77bcf86cd799439012',
            quantity: 2,
            prices: {
              retail: 100,
              reseller: 80,
              wholesale: 60
            },
            variantData: {
              productName: 'Camiseta Deportiva',
              productCode: 'CAM001',
              variantAttributes: [
                {
                  name: 'color',
                  keyLabel: 'Color',
                  value: 'red',
                  label: 'Rojo'
                },
                {
                  name: 'size',
                  keyLabel: 'Talle',
                  value: 'M',
                  label: 'Mediano'
                }
              ]
            }
          },
          {
            productId: '507f1f77bcf86cd799439013',
            variantId: '507f1f77bcf86cd799439014',
            quantity: 1,
            prices: {
              retail: 150,
              reseller: 120,
              wholesale: 90
            },
            variantData: {
              productName: 'Pantalón Deportivo',
              productCode: 'PAN002',
              variantAttributes: [
                {
                  name: 'color',
                  keyLabel: 'Color',
                  value: 'blue',
                  label: 'Azul'
                },
                {
                  name: 'size',
                  keyLabel: 'Talle',
                  value: 'L',
                  label: 'Grande'
                }
              ]
            }
          }
        ],
        total: 280
      };

      // Enviar email usando el template de venta
      await this.emailService.sendEmail(
        body.to,
        'Nueva compra realizada',
        'sale-template',
        mockSaleData
      );

      return {
        success: true,
        message: 'Email de venta enviado exitosamente',
        to: body.to,
        template: 'sale-template',
        userType: 'guest',
        date: formattedDate
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al enviar email de venta',
        error: error.message
      };
    }
  }

  @Post('test-purchase-email')
  @ApiOperation({ summary: 'Probar email de compra con datos hardcodeados de usuario invitado' })
  @ApiBody({
    description: 'Datos para probar el email de compra',
    examples: {
      example1: {
        summary: 'Email de compra con usuario invitado',
        value: {
          to: 'customer@example.com'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Email de compra enviado exitosamente' })
  @ApiResponse({ status: 500, description: 'Error al enviar email' })
  async testPurchaseEmail(@Body() body: { to: string }) {
    try {
      const argentinaDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
      const day = argentinaDate.getDate().toString().padStart(2, '0');
      const month = (argentinaDate.getMonth() + 1).toString().padStart(2, '0');
      const year = argentinaDate.getFullYear();
      const hours = argentinaDate.getHours().toString().padStart(2, '0');
      const minutes = argentinaDate.getMinutes().toString().padStart(2, '0');
      const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

      const mockSaleData = {
        id: 'sale-123',
        date: formattedDate,
        user: {
          id: 'guest_550e8400-e29b-41d4-a716-446655440000',
          name: 'Juan',
          lastname: 'Pérez',
          email: 'juan.perez@example.com',
          phone: '+1234567890',
          address: 'Calle Principal 123, Ciudad, País'
        },
        details: [
          {
            productId: '507f1f77bcf86cd799439011',
            variantId: '507f1f77bcf86cd799439012',
            quantity: 2,
            prices: { retail: 100, reseller: 80, wholesale: 60 },
            variantData: {
              productName: 'Camiseta Deportiva',
              productCode: 'CAM001',
              variantAttributes: [
                { name: 'color', keyLabel: 'Color', value: 'red', label: 'Rojo' },
                { name: 'size', keyLabel: 'Talle', value: 'M', label: 'Mediano' }
              ]
            }
          }
        ],
        total: 280
      };

      await this.emailService.sendEmail(
        body.to,
        'Gracias por tu compra',
        'purchase-template',
        mockSaleData
      );

      return {
        success: true,
        message: 'Email de compra enviado exitosamente',
        to: body.to,
        template: 'purchase-template',
        userType: 'guest',
        date: formattedDate
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al enviar email de compra',
        error: error.message
      };
    }
  }

  @Post('test-wholesale-email')
  @ApiOperation({ summary: 'Probar email con producto mayorista complejo' })
  @ApiBody({
    description: 'Datos para probar el email con producto mayorista',
    examples: {
      example1: {
        summary: 'Email con producto mayorista',
        value: {
          to: 'admin@example.com'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Email con producto mayorista enviado exitosamente' })
  @ApiResponse({ status: 500, description: 'Error al enviar email' })
  async testWholesaleEmail(@Body() body: { to: string }) {
    try {
      const argentinaDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
      const day = argentinaDate.getDate().toString().padStart(2, '0');
      const month = (argentinaDate.getMonth() + 1).toString().padStart(2, '0');
      const year = argentinaDate.getFullYear();
      const hours = argentinaDate.getHours().toString().padStart(2, '0');
      const minutes = argentinaDate.getMinutes().toString().padStart(2, '0');
      const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

      const mockSaleData = {
        id: 'sale-wholesale-123',
        date: formattedDate,
        user: {
          id: 'guest_550e8400-e29b-41d4-a716-446655440000',
          name: 'María',
          lastname: 'González',
          email: 'maria.gonzalez@example.com',
          phone: '+1234567890',
          address: 'Av. Libertador 456, Ciudad, País'
        },
        details: [
          {
            productId: '507f1f77bcf86cd799439013',
            variantId: null,
            quantity: 1,
            prices: { retail: 0, reseller: 0, wholesale: 1200 },
            variantData: {
              productName: 'Paquete Mayorista Camisetas',
              productCode: 'PKG001',
              variantAttributes: [
                { name: 'package_type', keyLabel: 'Tipo de Paquete', value: 'wholesale', label: 'Mayorista' },
                { name: 'predefined_quantity', keyLabel: 'Cantidad Predefinida', value: '12', label: '12 unidades' }
              ]
            },
            wholesaleVariants: [
              {
                variant: {
                  productName: 'Paquete Mayorista Camisetas',
                  productCode: 'PKG001',
                  variantId: '507f1f77bcf86cd799439014',
                  variantAttributes: [
                    { name: 'color', keyLabel: 'Color', value: 'red', label: 'Rojo' },
                    { name: 'size', keyLabel: 'Talle', value: 'S', label: 'Pequeño' }
                  ]
                },
                quantity: 3
              },
              {
                variant: {
                  productName: 'Paquete Mayorista Camisetas',
                  productCode: 'PKG001',
                  variantId: '507f1f77bcf86cd799439015',
                  variantAttributes: [
                    { name: 'color', keyLabel: 'Color', value: 'blue', label: 'Azul' },
                    { name: 'size', keyLabel: 'Talle', value: 'M', label: 'Mediano' }
                  ]
                },
                quantity: 4
              },
              {
                variant: {
                  productName: 'Paquete Mayorista Camisetas',
                  productCode: 'PKG001',
                  variantId: '507f1f77bcf86cd799439016',
                  variantAttributes: [
                    { name: 'color', keyLabel: 'Color', value: 'green', label: 'Verde' },
                    { name: 'size', keyLabel: 'Talle', value: 'L', label: 'Grande' }
                  ]
                },
                quantity: 5
              }
            ]
          }
        ],
        total: 1200
      };

      await this.emailService.sendEmail(
        body.to,
        'Nueva compra mayorista realizada',
        'sale-template',
        mockSaleData
      );

      return {
        success: true,
        message: 'Email con producto mayorista enviado exitosamente',
        to: body.to,
        template: 'sale-template',
        userType: 'guest',
        productType: 'wholesale',
        date: formattedDate
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al enviar email con producto mayorista',
        error: error.message
      };
    }
  }

  @Post('test-wholesale-structure')
  @ApiOperation({ summary: 'Probar estructura de datos de wholesaleVariants' })
  @ApiResponse({ status: 200, description: 'Estructura de datos mostrada' })
  async testWholesaleStructure() {
    try {
      // Simular la estructura exacta que se crea en GuestSaleUseCases
      const mockWholesaleVariants = [
        {
          variant: {
            productName: 'Paquete Mayorista Camisetas',
            productCode: 'PKG001',
            variantId: '507f1f77bcf86cd799439014',
            variantAttributes: [
              { name: 'color', keyLabel: 'Color', value: 'red', label: 'Rojo' },
              { name: 'size', keyLabel: 'Talle', value: 'S', label: 'Pequeño' }
            ]
          },
          quantity: 3
        },
        {
          variant: {
            productName: 'Paquete Mayorista Camisetas',
            productCode: 'PKG001',
            variantId: '507f1f77bcf86cd799439015',
            variantAttributes: [
              { name: 'color', keyLabel: 'Color', value: 'blue', label: 'Azul' },
              { name: 'size', keyLabel: 'Talle', value: 'M', label: 'Mediano' }
            ]
          },
          quantity: 4
        }
      ];

      return {
        success: true,
        message: 'Estructura de wholesaleVariants',
        structure: mockWholesaleVariants,
        example: {
          firstVariant: mockWholesaleVariants[0],
          firstVariantColor: mockWholesaleVariants[0].variant.variantAttributes[0].label,
          firstVariantSize: mockWholesaleVariants[0].variant.variantAttributes[1].label,
          firstVariantQuantity: mockWholesaleVariants[0].quantity
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al mostrar estructura',
        error: error.message
      };
    }
  }
}
