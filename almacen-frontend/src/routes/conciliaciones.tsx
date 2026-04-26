import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  createConciliacion,
  deleteConciliacion,
  getConciliaciones,
  updateConciliacion,
} from '../services/conciliaciones.service';
import type { CreateConciliacionDto } from '../services/conciliaciones.service';
import { getInventarios } from '../services/inventario.service';
import { getOrdenDetalles } from '../services/ordenes.service';
import { getProductos } from '../services/productos.service';
import type { Conciliacion, EstadoConciliacion } from '../types/models';
import { formatOrderLabel, formatProductLabel } from '../utils/display';
import {
  createConsecutiveColumn,
  DEFAULT_TABLE_PAGE_SIZE,
  resolvePaginationState,
} from '../utils/table';

const { Option } = Select;

export function ConciliacionesRoute() {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [form] = Form.useForm();

  const { data: conciliacionesResponse, isLoading } = useQuery({
    queryKey: ['conciliaciones'],
    queryFn: () => getConciliaciones(),
  });
  const { data: productosResponse } = useQuery({
    queryKey: ['productos'],
    queryFn: () => getProductos(),
  });
  const { data: inventariosResponse } = useQuery({
    queryKey: ['inventario'],
    queryFn: () => getInventarios(),
  });
  const { data: ordenDetalles } = useQuery({
    queryKey: ['ordenDetalles'],
    queryFn: () => getOrdenDetalles(),
  });

  const conciliaciones = conciliacionesResponse?.data ?? [];
  const productos = productosResponse?.data ?? [];
  const inventarios = inventariosResponse?.data ?? [];
  const detalles = ordenDetalles ?? [];

  const inventarioPorProductoId = useMemo(
    () => new Map(inventarios.map((inventario) => [inventario.producto.id, inventario])),
    [inventarios],
  );

  const ordenesPorProductoId = useMemo(() => {
    const map = new Map<number, string[]>();

    detalles.forEach((detalle) => {
      const productoId = detalle.producto?.id;
      if (!productoId) {
        return;
      }

      const ordenLabel = formatOrderLabel(detalle.orden);
      const current = map.get(productoId) ?? [];
      if (!current.includes(ordenLabel)) {
        current.push(ordenLabel);
      }
      map.set(productoId, current);
    });

    return map;
  }, [detalles]);

  const createMutation = useMutation({
    mutationFn: createConciliacion,
    onSuccess: () => {
      message.success('Conciliación creada');
      queryClient.invalidateQueries({ queryKey: ['conciliaciones'] });
      handleCloseModal();
    },
    onError: () => message.error('Error al crear'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { pesoFisico?: number; notas?: string };
    }) => updateConciliacion(id, data),
    onSuccess: () => {
      message.success('Actualizada');
      queryClient.invalidateQueries({ queryKey: ['conciliaciones'] });
      handleCloseModal();
    },
    onError: () => message.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConciliacion,
    onSuccess: () => {
      message.success('Eliminada');
      queryClient.invalidateQueries({ queryKey: ['conciliaciones'] });
    },
    onError: () => message.error('Error al eliminar'),
  });

  const handleOpenModal = (conciliacion?: Conciliacion) => {
    if (conciliacion) {
      setEditingId(conciliacion.id);
      form.setFieldsValue({
        pesoFisico: conciliacion.pesoFisico,
        notas: conciliacion.notas,
        productoId: conciliacion.producto?.id,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const handleFinish = (values: CreateConciliacionDto) => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          pesoFisico: values.pesoFisico,
          notas: values.notas,
        },
      });
      return;
    }

    createMutation.mutate(values);
  };

  const getUnidadesProducto = (productoId?: number) =>
    productoId ? inventarioPorProductoId.get(productoId)?.totalUnidades ?? 0 : 0;

  const getOrdenesProducto = (productoId?: number) =>
    productoId ? ordenesPorProductoId.get(productoId) ?? [] : [];

  const columns = [
    createConsecutiveColumn<Conciliacion>(pagination),
    { title: 'Fecha', dataIndex: 'fecha', key: 'fecha' },
    {
      title: 'Producto',
      key: 'producto',
      render: (_: unknown, record: Conciliacion) =>
        formatProductLabel(record.producto, {
          includeKey: true,
          includeClient: true,
        }),
    },
    {
      title: 'Presentación',
      key: 'presentacion',
      render: (_: unknown, record: Conciliacion) =>
        record.producto
          ? `${record.producto.presentacion} | ${record.producto.medidas}`
          : 'N/A',
    },
    {
      title: 'Unidades',
      key: 'unidades',
      render: (_: unknown, record: Conciliacion) =>
        getUnidadesProducto(record.producto?.id),
    },
    {
      title: 'Ordenes',
      key: 'ordenes',
      render: (_: unknown, record: Conciliacion) => {
        const ordenes = getOrdenesProducto(record.producto?.id);
        return ordenes.length > 0 ? ordenes.join(' | ') : 'Sin orden activa';
      },
    },
    { title: 'Entradas', dataIndex: 'pesoEntradas', key: 'pesoEntradas' },
    { title: 'Tarimas', dataIndex: 'pesoTarimas', key: 'pesoTarimas' },
    { title: 'Físico', dataIndex: 'pesoFisico', key: 'pesoFisico' },
    {
      title: 'Dif. Libretas',
      dataIndex: 'diferenciaLibretas',
      key: 'diferenciaLibretas',
    },
    {
      title: 'Dif. Físico',
      dataIndex: 'diferenciaFisico',
      key: 'diferenciaFisico',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: EstadoConciliacion) => (
        <Tag color={estado === 'CONCILIADO' ? 'green' : 'orange'}>{estado}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 90,
      render: (_: unknown, record: Conciliacion) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="¿Eliminar?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Sí"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Conciliaciones
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Nueva Conciliación
        </Button>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={conciliaciones}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: conciliacionesResponse?.total ?? conciliaciones.length,
            showSizeChanger: true,
          }}
          onChange={(nextPagination) => setPagination(resolvePaginationState(nextPagination))}
        />
      </Card>

      <Modal
        title={editingId ? 'Editar Conciliación' : 'Nueva Conciliación'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="productoId"
            label="Producto"
            rules={[{ required: true }]}
            hidden={!!editingId}
          >
            <Select showSearch optionFilterProp="children" disabled={!!editingId}>
              {productos.map((producto) => {
                const ordenes = getOrdenesProducto(producto.id);
                const unidades = getUnidadesProducto(producto.id);

                return (
                  <Option key={producto.id} value={producto.id}>
                    {[
                      formatProductLabel(producto, {
                        includeKey: true,
                        includeClient: true,
                      }),
                      `Unidades: ${unidades}`,
                      `Ordenes: ${
                        ordenes.length > 0 ? ordenes.join(', ') : 'Sin orden activa'
                      }`,
                    ].join(' | ')}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item name="pesoFisico" label="Peso Físico (Kg)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="notas" label="Notas">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
