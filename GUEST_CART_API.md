# Guest Cart API Documentation

## Endpoints para carritos de usuarios no autenticados

Todos los endpoints están disponibles en `/api/guest-carts/` y **NO requieren autenticación**.

### 1. Crear carrito de sesión

**POST** `/api/guest-carts/create`

**Body:**
```json
{
  "sessionId": "uuid-string-required"
}
```

**Response:**
```json
{
  "cart": {
    "id": "cart-id",
    "sessionId": "uuid-string-required",
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
  "cartId": "uuid-string-required",
  "productId": "product-id",
  "variantId": "variant-id",
  "quantity": 2,
  "isWholesalePackage": false,
  "predefinedQuantity": null
}
```

**Response:**
```json
{
  "cart": {
    "id": "cart-id",
    "sessionId": "uuid-string-required",
    "items": [
      {
        "product": {
          "_id": "product-id",
          "name": "Product Name",
          "code": "PROD001",
          "prices": {
            "retail": 100,
            "reseller": 80,
            "wholesale": 60
          }
        },
        "variant": {
          "_id": "variant-id",
          "size": "M",
          "color": "red"
        },
        "quantity": 2,
        "applied_price_type": "RETAIL"
      }
    ],
    "total_reseller": 160,
    "total_retail": 200,
    "total_wholesale": 0
  }
}
```

### 3. Obtener carrito

**GET** `/api/guest-carts/:sessionId`

**Response:**
```json
{
  "cart": {
    "id": "cart-id",
    "sessionId": "uuid-string-required",
    "items": [...],
    "total_reseller": 160,
    "total_retail": 200,
    "total_wholesale": 0
  }
}
```

### 4. Remover producto del carrito

**DELETE** `/api/guest-carts/:sessionId/remove-product`

**Body:**
```json
{
  "productId": "product-id",
  "variantId": "variant-id",
  "isWholesalePackage": false
}
```

### 5. Actualizar cantidad

**PUT** `/api/guest-carts/:sessionId/update-quantity`

**Body:**
```json
{
  "productId": "product-id",
  "variantId": "variant-id",
  "quantity": 3,
  "isWholesalePackage": false,
  "predefinedQuantity": null
}
```

## Ejemplo de uso en Frontend

```javascript
// 1. Generar UUID para la sesión
const sessionId = crypto.randomUUID();

// 2. Crear carrito
const createResponse = await fetch('/api/guest-carts/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
});

// 3. Guardar sessionId en localStorage
localStorage.setItem('cartSessionId', sessionId);

// 4. Agregar producto
const addProductResponse = await fetch('/api/guest-carts/add-product', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cartId: sessionId,
    productId: 'product-id',
    variantId: 'variant-id',
    quantity: 2
  })
});

// 5. Obtener carrito
const cartResponse = await fetch(`/api/guest-carts/${sessionId}`);
const cart = await cartResponse.json();
```

## Características importantes

- **sessionId obligatorio**: Debe ser proporcionado en todos los endpoints
- **Precios RETAIL**: Los usuarios no autenticados siempre ven precios minoristas
- **Sin autenticación**: No requiere login ni tokens
- **Persistencia**: Los carritos se mantienen hasta que se limpien automáticamente
- **Validaciones**: Stock disponible, productos existentes, etc.

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