import { Suspense, lazy, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { queryClient } from '../providers/query-client';
import { useSession } from '../../hooks/useSession';
import { AppLayout } from '../../layouts/AppLayout';
import { AuthLayout } from '../../layouts/AuthLayout';
const DashboardRoute = lazy(() =>
  import('../../routes').then((module) => ({ default: module.DashboardRoute })),
);
const LoginRoute = lazy(() =>
  import('./login').then((module) => ({ default: module.LoginRoute })),
);
const ClientesRoute = lazy(() =>
  import('../../routes/clientes').then((module) => ({ default: module.ClientesRoute })),
);
const ProductosRoute = lazy(() =>
  import('../../routes/productos').then((module) => ({ default: module.ProductosRoute })),
);
const OrdenesRoute = lazy(() =>
  import('../../routes/ordenes').then((module) => ({ default: module.OrdenesRoute })),
);
const EntradasRoute = lazy(() =>
  import('../../routes/entradas').then((module) => ({ default: module.EntradasRoute })),
);
const TarimasRoute = lazy(() =>
  import('../../routes/tarimas').then((module) => ({ default: module.TarimasRoute })),
);
const InventarioRoute = lazy(() =>
  import('../../routes/inventario').then((module) => ({ default: module.InventarioRoute })),
);
const MovimientosRoute = lazy(() =>
  import('../../routes/movimientos').then((module) => ({ default: module.MovimientosRoute })),
);
const ConciliacionesRoute = lazy(() =>
  import('../../routes/conciliaciones').then((module) => ({ default: module.ConciliacionesRoute })),
);
const UsuariosRoute = lazy(() =>
  import('../../routes/usuarios').then((module) => ({ default: module.UsuariosRoute })),
);

function PrivateGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 10,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConfigProvider>
  );
}

function RouteLoadingFallback() {
  return (
    <div
      style={{
        minHeight: 240,
        display: 'grid',
        placeItems: 'center',
        color: 'rgba(0, 0, 0, 0.45)',
      }}
    >
      Cargando...
    </div>
  );
}

function renderWithSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <AppProviders>
        <AuthLayout />
      </AppProviders>
    ),
    children: [
      {
        index: true,
        element: renderWithSuspense(<LoginRoute />),
      },
    ],
  },
  {
    path: '/',
    element: (
      <AppProviders>
        <PrivateGuard>
          <AppLayout />
        </PrivateGuard>
      </AppProviders>
    ),
    children: [
      {
        index: true,
        element: renderWithSuspense(<DashboardRoute />),
      },
      { path: 'clientes', element: renderWithSuspense(<ClientesRoute />) },
      { path: 'productos', element: renderWithSuspense(<ProductosRoute />) },
      { path: 'ordenes', element: renderWithSuspense(<OrdenesRoute />) },
      { path: 'entradas', element: renderWithSuspense(<EntradasRoute />) },
      { path: 'tarimas', element: renderWithSuspense(<TarimasRoute />) },
      { path: 'inventario', element: renderWithSuspense(<InventarioRoute />) },
      { path: 'movimientos', element: renderWithSuspense(<MovimientosRoute />) },
      { path: 'conciliaciones', element: renderWithSuspense(<ConciliacionesRoute />) },
      { path: 'usuarios', element: renderWithSuspense(<UsuariosRoute />) },
    ],
  },
]);

