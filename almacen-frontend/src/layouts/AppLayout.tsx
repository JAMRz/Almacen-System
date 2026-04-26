import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  TeamOutlined,
  FileDoneOutlined,
  UnorderedListOutlined,
  InboxOutlined,
  SwapOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

const { Header, Sider, Content } = Layout;

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, usuario } = useSession();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/clientes', icon: <TeamOutlined />, label: 'Clientes' },
    { key: '/productos', icon: <AppstoreOutlined />, label: 'Productos' },
    { key: '/ordenes', icon: <FileDoneOutlined />, label: 'Órdenes P.' },
    { key: '/entradas', icon: <UnorderedListOutlined />, label: 'Entradas' },
    { key: '/tarimas', icon: <InboxOutlined />, label: 'Tarimas' },
    { key: '/inventario', icon: <BarChartOutlined />, label: 'Inventario' },
    { key: '/movimientos', icon: <SwapOutlined />, label: 'Movimientos' },
    {
      key: '/conciliaciones',
      icon: <SafetyCertificateOutlined />,
      label: 'Conciliaciones',
    },
  ];

  if (usuario?.rol === 'SUPERVISOR') {
    menuItems.push({ key: '/usuarios', icon: <UserOutlined />, label: 'Usuarios' });
  }

  const selectedKey =
    menuItems.find((item) =>
      item.key === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.key),
    )?.key || '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220}>
        <div
          style={{
            color: '#fff',
            padding: 16,
            fontWeight: 700,
            fontSize: 18,
            textAlign: 'center',
          }}
        >
          Almacén
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '12px 18px',
            height: 'auto',
            minHeight: 76,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                flex: '1 1 320px',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                lineHeight: 1.15,
                overflow: 'hidden',
              }}
            >
              <Typography.Title
                level={4}
                style={{
                  margin: 0,
                  lineHeight: 1.15,
                  whiteSpace: 'normal',
                  overflowWrap: 'anywhere',
                }}
              >
                Panel de almacén
              </Typography.Title>
              <Typography.Text
                type="secondary"
                style={{
                  lineHeight: 1.25,
                  whiteSpace: 'normal',
                  overflowWrap: 'anywhere',
                }}
              >
                {usuario?.user} · {usuario?.rol}
              </Typography.Text>
            </div>

            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ flex: '0 0 auto' }}
            >
              Cerrar sesión
            </Button>
          </div>
        </Header>

        <Content style={{ margin: 16 }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 16,
              minHeight: 400,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
