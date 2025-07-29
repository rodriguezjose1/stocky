# Guest Cart API Documentation

## Endpoints para carritos de usuarios no autenticados

Todos los endpoints están disponibles en `/api/guest-carts/` y **NO requieren autenticación**.

### 1. Crear carrito de sesión

**POST** `/api/guest-carts`

**Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "cart": {
    "id": "cart-id",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "items": [],
    "total_reseller": 0,
    "total_retail": 0,
    "total_wholesale": 0,
    "active": true
  }
}
```

### 2. Agregar producto al carrito

**POST** `/api/guest-carts/add-product`

**Body:**
```json
{
  "cartId": "550e8400-e29b-41d4-a716-446655440000",
  "productId": "507f1f77bcf86cd799439011",
  "variantId": "507f1f77bcf86cd799439012",
  "quantity": 2,
  "isWholesalePackage": false,
  "predefinedQuantity": null
}
```

**Ejemplo con paquete mayorista:**
```json
{
  "cartId": "550e8400-e29b-41d4-a716-446655440000",
  "productId": "507f1f77bcf86cd799439011",
  "variantId": "507f1f77bcf86cd799439012",
  "quantity": 1,
  "isWholesalePackage": true,
  "predefinedQuantity": 6
}
```

**Response:**
```json
{
  "cart": {
    "id": "cart-id",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Product Name",
          "code": "PROD001",
          "prices": {
            "retail": 100,
            "reseller": 80,
            "wholesale": 60
          }
        },
        "variant": {
          "_id": "507f1f77bcf86cd799439012",
          "size": "M",
          "color": "red"
        },
        "quantity": 2,
        "applied_price_type": "RETAIL"
      }
    ],
    "total_reseller": 0,
    "total_retail": 200,
    "total_wholesale": 0
  }
}
```

### 3. Agregar producto mayorista complejo

**POST** `/api/guest-carts/add-complex-wholesale-product`

**Body:**
```json
{
  "cartId": "550e8400-e29b-41d4-a716-446655440000",
  "productId": "507f1f77bcf86cd799439011",
  "predefinedQuantity": 6,
  "variants": [
    {
      "variantId": "507f1f77bcf86cd799439012",
      "quantity": 2
    },
    {
      "variantId": "507f1f77bcf86cd799439013",
      "quantity": 4
    }
  ],
  "userRole": "WHOLESALE"
}
```

**Response:**
```json
{
  "cart": {
    "id": "cart-id",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Product Name",
          "code": "PROD001",
          "prices": {
            "retail": 100,
            "reseller": 80,
            "wholesale": 60
          }
        },
        "variant": null,
        "quantity": 6,
        "is_wholesale_package": true,
        "predefined_quantity": 6,
        "wholesale_variants": [
          {
            "variant": {
              "_id": "507f1f77bcf86cd799439012",
              "size": "M",
              "color": "red"
            },
            "quantity": 2
          },
          {
            "variant": {
              "_id": "507f1f77bcf86cd799439013",
              "size": "L",
              "color": "blue"
            },
            "quantity": 4
          }
        ],
        "applied_price_type": "RETAIL"
      }
    ],
    "total_reseller": 0,
    "total_retail": 600,
    "total_wholesale": 0
  }
}
```

### 4. Obtener carrito

**GET** `/api/guest-carts/:cartId`

**Response:**
```json
{
  "cart": {
    "id": "cart-id",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "items": [...],
    "total_reseller": 0,
    "total_retail": 200,
    "total_wholesale": 0
  }
}
```

### 5. Eliminar producto del carrito

**DELETE** `/api/guest-carts/:cartId/products/:productId`

**Body:**
```json
{
  "variantId": "507f1f77bcf86cd799439012",
  "isWholesalePackage": false
}
```

**Ejemplo para paquete mayorista:**
```json
{
  "variantId": "507f1f77bcf86cd799439012",
  "isWholesalePackage": true
}
```

### 6. Actualizar cantidad de producto

**PUT** `/api/guest-carts/:cartId/products/:productId/quantity`

**Body:**
```json
{
  "variantId": "507f1f77bcf86cd799439012",
  "quantity": 3,
  "isWholesalePackage": false
}
```

**Ejemplo para paquete mayorista:**
```json
{
  "variantId": "507f1f77bcf86cd799439012",
  "quantity": 1,
  "isWholesalePackage": true,
  "predefinedQuantity": 12
}
```

## Ejemplo de uso en Frontend

```javascript
// 1. Generar UUID para la sesión
const sessionId = crypto.randomUUID();

// 2. Crear carrito
const createResponse = await fetch('/api/guest-carts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
});

// 3. Guardar sessionId en localStorage
localStorage.setItem('cartSessionId', sessionId);

// 4. Agregar producto normal
const addProductResponse = await fetch('/api/guest-carts/add-product', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cartId: sessionId,
    productId: '507f1f77bcf86cd799439011',
    variantId: '507f1f77bcf86cd799439012',
    quantity: 2
  })
});

// 5. Agregar producto mayorista complejo
const addComplexResponse = await fetch('/api/guest-carts/add-complex-wholesale-product', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cartId: sessionId,
    productId: '507f1f77bcf86cd799439011',
    predefinedQuantity: 6,
    variants: [
      {
        variantId: '507f1f77bcf86cd799439012',
        quantity: 2
      },
      {
        variantId: '507f1f77bcf86cd799439013',
        quantity: 4
      }
    ]
  })
});

// 6. Actualizar cantidad (RESTful)
const updateQuantityResponse = await fetch(`/api/guest-carts/${sessionId}/products/507f1f77bcf86cd799439011/quantity`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variantId: '507f1f77bcf86cd799439012',
    quantity: 3
  })
});

// 7. Eliminar producto (RESTful)
const removeProductResponse = await fetch(`/api/guest-carts/${sessionId}/products/507f1f77bcf86cd799439011`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variantId: '507f1f77bcf86cd799439012',
    isWholesalePackage: false
  })
});

// 8. Obtener carrito
const cartResponse = await fetch(`/api/guest-carts/${sessionId}`);
const cart = await cartResponse.json();
```

## Características importantes

- **sessionId obligatorio**: Debe ser proporcionado al crear el carrito
- **Precios RETAIL**: Los usuarios no autenticados siempre ven precios minoristas
- **Sin autenticación**: No requiere login ni tokens
- **Persistencia**: Los carritos se mantienen hasta que se limpien automáticamente
- **Validaciones**: Stock disponible, productos existentes, etc.
- **RESTful**: Los endpoints PUT y DELETE siguen las mejores prácticas REST
- **Productos complejos**: Soporte para paquetes mayoristas con múltiples variantes

## Swagger Documentation

La documentación interactiva está disponible en:
```
http://localhost:8080/api/docs
```

**Solo disponible en desarrollo** (`NODE_ENV=dev`)

## Ventajas del diseño RESTful

1. **Semánticamente correcto**: El carrito y producto están en la URL
2. **Cacheable**: Los endpoints pueden ser cacheados
3. **Consistente**: Sigue patrones REST estándar para actualizaciones
4. **Debuggeable**: URL más descriptiva y fácil de entender

## Migración a usuario autenticado

Cuando un usuario se registre, puedes migrar su carrito de sesión:

```javascript
// Al registrarse el usuario
const sessionId = localStorage.getItem('cartSessionId');
if (sessionId) {
  // Migrar carrito de sesión a carrito de usuario
  await migrateGuestCartToUserCart(sessionId, userId);
  localStorage.removeItem('cartSessionId');
}
```

## Endpoints disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/guest-carts` | Crear carrito de sesión |
| POST | `/api/guest-carts/add-product` | Agregar producto normal |
| POST | `/api/guest-carts/add-complex-wholesale-product` | Agregar producto mayorista complejo |
| GET | `/api/guest-carts/:cartId` | Obtener carrito |
| DELETE | `/api/guest-carts/:cartId/products/:productId` | Eliminar producto |
| PUT | `/api/guest-carts/:cartId/products/:productId/quantity` | Actualizar cantidad | 