# Almacen Frontend

Este es el frontend para el sistema de gestión de Almacén. Es una aplicación React de una sola página (SPA) diseñada para administrar inventarios, órdenes de producción, entradas diarias, movimientos, y más.

La aplicación proporciona una interfaz de usuario limpia e intuitiva utilizando Ant Design y gestiona el estado y la obtención de datos eficientemente con React Query.

## Tecnologías Principales

- **React 19**: Biblioteca principal para la construcción de interfaces de usuario.
- **TypeScript**: Superset de JavaScript que añade tipado estático, mejorando la robustez y mantenibilidad del código.
- **Vite**: Herramienta de construcción (bundler) rápida y ligera.
- **React Router DOM 7**: Para el enrutamiento y la navegación dentro de la aplicación.
- **Ant Design (antd) 6**: Biblioteca de componentes de UI empresarial para React, proporcionando tablas, formularios, modales, y otros elementos visuales listos para usar.
- **TanStack React Query 5**: Poderosa herramienta para la obtención, almacenamiento en caché y actualización de estado asíncrono.
- **Ky**: Cliente HTTP elegante y ligero basado en la API Fetch, usado para la comunicación con el backend (NestJS).

## Estructura del Proyecto

El código fuente principal se encuentra en la carpeta `src/`. La estructura general es la siguiente:

```text
src/
├── app/          # Configuración global de la aplicación (ej. proveedores de estado, configuración inicial)
├── components/   # Componentes de React reutilizables (botones, modales, widgets de UI)
├── hooks/        # Custom React hooks (ej. lógica compartida, wrappers para React Query)
├── layouts/      # Componentes de diseño estructural (Navbar, Sidebar, layout principal de la app)
├── routes/       # Páginas principales de la aplicación asociadas a las rutas (Clientes, Inventario, Tarimas, etc.)
├── services/     # Módulos para interactuar con la API del backend, organizados por entidad (ky/fetch logic)
├── types/        # Definiciones de interfaces y tipos de TypeScript globales
└── utils/        # Funciones de utilidad, formateadores y helpers generales
```

## Módulos y Características

La aplicación está dividida en varias rutas y servicios principales para gestionar las diferentes entidades del almacén:

- **Autenticación (`auth`)**: Manejo de inicio de sesión y sesiones de usuario.
- **Usuarios (`usuarios`)**: Gestión de cuentas de usuario del sistema.
- **Clientes (`clientes`)**: Administración del catálogo de clientes.
- **Productos (`productos`)**: Catálogo de productos disponibles en el almacén.
- **Órdenes de Producción (`ordenes`)**: Creación y seguimiento de órdenes de producción.
- **Entradas Diarias (`entradas`)**: Registro de las entradas de producción agrupadas por fecha y turno.
- **Tarimas (`tarimas`)**: Gestión detallada de las tarimas, sus detalles y folios asociados.
- **Inventario (`inventario`)**: Vista general y gestión del stock actual en el almacén (calculado automáticamente).
- **Movimientos (`movimientos`)**: Registro histórico y auditoría de entradas, salidas y ajustes de inventario.
- **Conciliaciones (`conciliaciones`)**: Herramienta para realizar ajustes de inventario e igualar el stock teórico con el físico.

## Gestión de Estado y Peticiones a la API

El proyecto utiliza **TanStack React Query** para manejar el estado del servidor. Esto proporciona múltiples beneficios:
- Caché automático de las respuestas de la API.
- Re-obtención (refetching) inteligente de datos en segundo plano.
- Manejo simplificado de estados de carga (loading) y errores.
- Mutaciones optimistas y actualizaciones de la UI tras operaciones de creación/edición/eliminación.

Para la capa de red, se utiliza **Ky**. Los servicios (en `src/services/`) actúan como un puente que define las llamadas HTTP específicas, las cuales luego son consumidas por los hooks de React Query dentro de las rutas/componentes.

## Requisitos Previos

- [Node.js](https://nodejs.org/) (Versión recomendada: >= 18.x)
- Un gestor de paquetes como `npm` o `yarn`

## Instalación y Ejecución Local

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```

2. Configura las variables de entorno:
   Crea un archivo `.env` o `.env.local` en la raíz del proyecto y asegúrate de configurar la URL de la API del backend.
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible localmente, generalmente en `http://localhost:5173`.

## Comandos Disponibles

- `npm run dev`: Inicia el servidor de desarrollo Vite.
- `npm run build`: Compila la aplicación con TypeScript y Vite para producción (salida en la carpeta `dist/`).
- `npm run lint`: Ejecuta ESLint para analizar el código en busca de problemas de sintaxis y estilo.
- `npm run preview`: Inicia un servidor web local para previsualizar la compilación de producción generada por `npm run build`.
