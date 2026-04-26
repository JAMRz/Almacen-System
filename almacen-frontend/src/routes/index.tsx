import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { getClientes } from '../services/clientes.service';
import { getInventarios } from '../services/inventario.service';
import { getMovimientos } from '../services/movimientos.service';
import { getProductos } from '../services/productos.service';

export function DashboardRoute() {
  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: getClientes });
  const { data: productos } = useQuery({ queryKey: ['productos'], queryFn: () => getProductos() });
  const { data: inventario } = useQuery({ queryKey: ['inventario'], queryFn: getInventarios });
  const { data: movimientos } = useQuery({ queryKey: ['movimientos'], queryFn: () => getMovimientos() });

  return (
    <div>
      <Typography.Title level={3}>Dashboard</Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Clientes" value={clientes?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Productos" value={productos?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Inventario" value={inventario?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Movimientos" value={movimientos?.total ?? 0} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
