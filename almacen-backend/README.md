# Almacén Backend

Backend para el sistema de gestión de almacén e inventario, construido con **NestJS**, **TypeORM** y **PostgreSQL**.

## 🛠️ Tecnologías

- **Framework:** NestJS v11
- **Base de datos:** PostgreSQL 16
- **ORM:** TypeORM
- **Autenticación:** JWT (JSON Web Tokens) con Passport
- **Validación:** class-validator & class-transformer

## 🏗️ Arquitectura y Módulos

El sistema está diseñado de forma modular, con los siguientes dominios principales:

### 1. Autenticación y Usuarios (`auth`, `usuarios`)
- Gestión de usuarios con roles (`SUPERVISOR`, `OPERADOR`, `LECTURA`).
- Autenticación mediante JWT.
- Rutas protegidas mediante Guards (`JwtAuthGuard`, `RolesGuard`).

### 2. Catálogos Base (`clientes`, `productos`)
- **Clientes:** Gestión del directorio de clientes.
- **Productos:** Catálogo de productos. Se autogenera una `clave` única basada en el cliente, nombre, presentación y medidas. Maneja atributos como `tipoMaterial` y `unidadEntrega`.

### 3. Producción (`ordenes-produccion`, `entradas-diarias`, `tarimas`)
- **Órdenes de Producción:** Agrupan productos a fabricar bajo un folio específico. Relación 1:N con `OrdenDetalle`.
- **Entradas Diarias:** Registro del pesaje de producción por fecha, turno y producto (vinculado al detalle de la orden).
- **Tarimas:** Agrupación lógica y física de productos terminados. Permite agregar pesos individuales (`DetalleTarima`) que se suman al peso total de la tarima.

### 4. Inventario y Movimientos (`inventario`, `movimientos`)
- **Movimientos:** Registro manual de entradas y salidas extraodinarias de inventario (por kg y unidades), opcionalmente vinculados a tarimas.
- **Inventario:** Módulo que **calcula dinámicamente** el stock actual de los productos. 
  - Fórmula base: `Total Kg = Entradas Diarias + Movimientos (Entrada) - Movimientos (Salida)`.
  - El stock también se sincroniza y persiste en la base de datos cada vez que hay una entrada, tarima o movimiento relacionado a un producto para facilitar consultas rápidas.

### 5. Conciliaciones (`conciliaciones`)
- Módulo para auditorías de inventario.
- Compara el peso en libros (Entradas Diarias - Tarimas armadas) contra el físico reportado.
- Determina automáticamente el estado: `CONCILIADO` o `DISCREPANCIA`.

## 🚀 Instalación y Configuración

### 1. Prerrequisitos
- Node.js (v20 o superior recomendado)
- Docker y Docker Compose (para la base de datos local)

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo para crear tus variables de entorno locales:
```bash
cp .env.example .env
```
Ajusta los valores en `.env` (credenciales de BD, secretos JWT, etc.).

### 3. Levantar Base de Datos
Inicia el contenedor de PostgreSQL usando Docker:
```bash
docker-compose up -d
```

### 4. Instalar Dependencias
```bash
npm install
```

### 5. Ejecutar la Aplicación
```bash
# Modo desarrollo
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```
La API estará disponible en `http://localhost:3000/api`.

## 🛡️ Seguridad y Control de Acceso

Las rutas están protegidas por JWT. Para acceder a rutas restringidas:
1. Hacer un `POST` a `/api/auth/login` con credenciales válidas.
2. Usar el `access_token` devuelto en las peticiones subsecuentes en la cabecera: `Authorization: Bearer <token>`.

Se usan decoradores personalizados (`@Roles`) para restringir endpoints según el rol del usuario:
- **SUPERVISOR:** Acceso total (crear, actualizar, eliminar).
- **OPERADOR:** Puede crear y editar registros operativos, pero no eliminarlos ni realizar tareas administrativas.
- **LECTURA:** Solo visualización (por defecto).

## 🗃️ Notas sobre la Base de Datos
- Las entidades utilizan `Soft Delete` (columna `eliminado_en`). Esto significa que los registros no se borran permanentemente de la base de datos, sino que se marcan como eliminados para mantener la integridad histórica.
- TypeORM sincroniza el esquema automáticamente en desarrollo (`synchronize: true` en `app.module.ts`). Para producción, se recomienda cambiar a un sistema de migraciones.

---

## 📡 Referencia de API (Rutas y Ejemplos)

Todas las rutas base están bajo el prefijo `/api`. Todas las rutas protegidas requieren el encabezado `Authorization: Bearer <token>`.

### 1. Autenticación (`/api/auth`)
- `POST /login` (Público)
  ```json
  {
    "user": "admin",
    "password": "123"
  }
  ```

### 2. Usuarios (`/api/usuarios`)
- `POST /` (Público - Creación)
  ```json
  {
    "user": "juan.perez",
    "password": "password123",
    "rol": "OPERADOR" // Opciones: SUPERVISOR, OPERADOR, LECTURA
  }
  ```
- `GET /` (Query param opcional: `?limit=10&offset=0`)
- `GET /:id`
- `PATCH /:id` (Solo SUPERVISOR)
- `DELETE /:id` (Solo SUPERVISOR)

### 3. Clientes (`/api/clientes`)
- `POST /` (SUPERVISOR, OPERADOR)
  ```json
  {
    "nombre": "Plásticos de México S.A. de C.V."
  }
  ```
- `GET /` (Query param opcional: `?limit=10&offset=0`)
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

### 4. Productos (`/api/productos`)
- `POST /` (SUPERVISOR, OPERADOR)
  ```json
  {
    "nombre": "Bolsa tipo camiseta",
    "presentacion": "Rollo",
    "medidas": "25x30 cm",
    "tipoMaterial": "CAMISETA", // Opciones: BOBINA, BOLSA, TURBOPACK, CINTA, CAMISETA, PINHOLL, RACIMO, OTRO
    "unidadEntrega": "KILOGRAMOS", // Opciones: KILOGRAMOS, UNIDADES, PAQUETES
    "clienteId": 1
  }
  ```
- `GET /` (Query params opcionales: `?clienteId=1&nombre=Bolsa`)
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

### 5. Órdenes de Producción (`/api/ordenes-produccion`)
- `POST /` (SUPERVISOR, OPERADOR)
  ```json
  {
    "folio": "ORD-2024-001",
    "productoIds": [1, 2]
  }
  ```
- `GET /` (Query params opcionales: `?productoId=1&folio=ORD`)
- `GET /detalles` (Lista todos los detalles de órdenes activas)
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

### 6. Entradas Diarias (`/api/entradas-diarias`)
- `POST /` (SUPERVISOR, OPERADOR)
  ```json
  {
    "pesoKg": 125.50,
    "fecha": "2024-10-25",
    "ordenDetalleId": 1,
    "turno": "PRIMERO" // Opciones: PRIMERO, SEGUNDO, TERCERO
  }
  ```
- `GET /` (Query params opcionales: `?ordenId=1&fecha=2024-10-25&turno=PRIMERO`)
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

### 7. Tarimas (`/api/tarimas`)
- `POST /` (SUPERVISOR, OPERADOR)
  ```json
  {
    "numero": 1, // Número identificador de la tarima (ej. Tarima 1)
    "ordenDetalleId": 1
  }
  ```
- `GET /` (Query params opcionales: `?productoId=1&ordenId=1`)
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

#### Detalles de Tarima (Agregar/Eliminar pesos a la tarima)
- `POST /detalle` (SUPERVISOR, OPERADOR)
  ```json
  {
    "pesoKg": 25.5,
    "tarimaId": 1
  }
  ```
- `DELETE /detalle/:id` (Elimina un peso específico)
- `DELETE /:id/detalle` (Vacía todos los pesos de la tarima `:id`)

### 8. Conciliaciones (`/api/conciliaciones`)
- `POST /` (SUPERVISOR, OPERADOR)
  ```json
  {
    "pesoFisico": 1500.25,
    "notas": "Se encontró diferencia durante el inventario físico",
    "productoId": 1
  }
  ```
- `GET /` (Query params opcionales: `?productoId=1&estado=CONCILIADO`)
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

### 9. Movimientos Manuales (`/api/movimientos`)
- `POST /` (SUPERVISOR, OPERADOR)
  ```json
  {
    "tipo": "ENTRADA", // Opciones: ENTRADA, SALIDA
    "unidades": 0,
    "kg": 50.5,
    "unidadFacturacion": "KILOGRAMOS",
    "productoId": 1,
    "tarimaId": null, // Opcional
    "notas": "Ajuste de inventario manual"
  }
  ```
- `GET /` (Query params opcionales: `?tipo=ENTRADA&productoId=1&fecha=2024-10-25`)
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

### 10. Inventario (`/api/inventario`)
*El inventario se calcula automáticamente, pero expone estas rutas para consultas rápidas.*
- `POST /` (Fuerza el recálculo manual para un producto)
  ```json
  {
    "productoId": 1
  }
  ```
- `GET /` (Lista el inventario de todos los productos paginado)
- `GET /:id` (Por ID interno del inventario)
- `GET /producto/:productoId` (Obtiene el inventario actual de un producto específico)
- `PATCH /:id`
- `DELETE /:id`
