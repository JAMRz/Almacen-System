import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Outlet />
    </Layout>
  );
}