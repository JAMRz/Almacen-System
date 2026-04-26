import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  addDetalleTarima,
  clearDetalleTarima,
  createTarima,
  deleteTarima,
  getTarimaById,
  getTarimas,
  removeDetalleTarima,
  updateTarima,
} from '../services/tarimas.service';
import type { CreateTarimaDto } from '../services/tarimas.service';
import { getOrdenDetalles } from '../services/ordenes.service';
import type { DetalleTarima, Tarima } from '../types/models';
import {
  formatOrderDetailLabel,
  formatOrderLabel,
  formatProductLabel,
} from '../utils/display';

const { Option } = Select;

type DetailViewMode = 'list' | 'grid';

export function TarimasRoute() {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetalleVisible, setIsDetalleVisible] = useState(false);
  const [selectedTarimaId, setSelectedTarimaId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>('list');

  const [form] = Form.useForm();
  const [detalleForm] = Form.useForm();

  const { data: tarimasResponse, isLoading } = useQuery({
    queryKey: ['tarimas'],
    queryFn: () => getTarimas(),
  });
  const { data: ordenDetalles } = useQuery({
    queryKey: ['ordenDetalles'],
    queryFn: () => getOrdenDetalles(),
  });

  const tarimas = tarimasResponse?.data ?? [];
  const detallesList = ordenDetalles ?? [];

  const { data: tarimaDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['tarima-detail', selectedTarimaId],
    queryFn: () => getTarimaById(selectedTarimaId!),
    enabled: !!selectedTarimaId,
  });

  const detalleRows = tarimaDetail?.detalles ?? [];

  const invalidateTarimas = () => {
    queryClient.invalidateQueries({ queryKey: ['tarimas'] });
    queryClient.invalidateQueries({ queryKey: ['inventario'] });
  };

  const createMutation = useMutation({
    mutationFn: createTarima,
    onSuccess: () => {
      message.success('Tarima creada');
      invalidateTarimas();
      setIsModalVisible(false);
    },
    onError: () => message.error('Error al crear tarima'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTarimaDto> }) =>
      updateTarima(id, data),
    onSuccess: () => {
      message.success('Tarima actualizada');
      invalidateTarimas();
      setIsModalVisible(false);
    },
    onError: () => message.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTarima,
    onSuccess: () => {
      message.success('Eliminada');
      invalidateTarimas();
    },
    onError: () => message.error('Error al eliminar'),
  });

  const addDetalleMutation = useMutation({
    mutationFn: addDetalleTarima,
    onSuccess: () => {
      message.success('Detalle añadido');
      queryClient.invalidateQueries({ queryKey: ['tarima-detail', selectedTarimaId] });
      invalidateTarimas();
      detalleForm.resetFields();
    },
    onError: () => message.error('Error al agregar detalle'),
  });

  const removeDetalleMutation = useMutation({
    mutationFn: removeDetalleTarima,
    onSuccess: () => {
      message.success('Detalle removido');
      queryClient.invalidateQueries({ queryKey: ['tarima-detail', selectedTarimaId] });
      invalidateTarimas();
    },
    onError: () => message.error('Error al remover detalle'),
  });

  const clearDetalleMutation = useMutation({
    mutationFn: clearDetalleTarima,
    onSuccess: () => {
      message.success('Detalle tarima vaciado');
      queryClient.invalidateQueries({ queryKey: ['tarima-detail', selectedTarimaId] });
      invalidateTarimas();
    },
    onError: () => message.error('Error al vaciar detalle tarima'),
  });

  const detailColumns = [
    {
      title: 'Posición',
      key: 'position',
      width: 96,
      render: (_: unknown, __: DetalleTarima, index: number) => index + 1,
    },
    {
      title: 'Peso (Kg)',
      dataIndex: 'pesoKg',
      key: 'pesoKg',
      render: (pesoKg: number | string) => Number(pesoKg).toFixed(2),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      render: (_: unknown, record: DetalleTarima) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeDetalleMutation.mutate(record.id)}
        >
          Borrar
        </Button>
      ),
    },
  ];

  const excelText = useMemo(() => {
    if (!tarimaDetail) {
      return '';
    }

    const rows = detalleRows.map(
      (detalle, index) => `${index + 1}\t${Number(detalle.pesoKg).toFixed(2)}`,
    );

    return ['Posición\tPeso (Kg)', ...rows].join('\n');
  }, [detalleRows, tarimaDetail]);

  const handleCopyWeights = async () => {
    if (!excelText) {
      message.warning('No hay pesos para copiar.');
      return;
    }

    try {
      await navigator.clipboard.writeText(excelText);
      message.success('Pesos copiados para Excel.');
    } catch {
      message.error('No se pudo copiar al portapapeles.');
    }
  };

  const handleOpenModal = (tarima?: Tarima) => {
    if (tarima) {
      setEditingId(tarima.id);
      form.setFieldsValue({
        numero: tarima.numero,
        ordenDetalleId: tarima.ordenDetalle?.orden ? tarima.ordenDetalle.id : undefined,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }

    setIsModalVisible(true);
  };

  const handleOpenDetalle = (tarimaId: number) => {
    setSelectedTarimaId(tarimaId);
    setIsDetalleVisible(true);
    setDetailViewMode('list');
  };

  const handleCloseTarimaModal = () => {
    setIsModalVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleCloseDetalleModal = () => {
    setIsDetalleVisible(false);
    setSelectedTarimaId(null);
    detalleForm.resetFields();
    setDetailViewMode('list');
  };

  const handleClearDetalle = () => {
    if (!selectedTarimaId) {
      return;
    }

    Modal.confirm({
      title: '¿Vaciar detalle tarima?',
      content:
        'Se eliminarán todos los pesos asociados a esta tarima y se recalcularán los totales.',
      okText: 'Sí, vaciar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: () => clearDetalleMutation.mutate(selectedTarimaId),
    });
  };

  const renderDetalleGrid = () => (
    <div
      style={{
        maxHeight: 420,
        overflowY: 'auto',
        paddingRight: 4,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}
    >
      {detalleRows.map((detalle, index) => (
        <Card
          key={detalle.id}
          size="small"
          styles={{
            body: {
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 132,
            },
          }}
          style={{
            borderRadius: 14,
            border: '1px solid #d9e2f2',
            background:
              'linear-gradient(180deg, rgba(247,250,255,1) 0%, rgba(235,242,252,1) 100%)',
          }}
        >
          <Typography.Text type="secondary">Posición {index + 1}</Typography.Text>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {Number(detalle.pesoKg).toFixed(2)} Kg
          </Typography.Title>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeDetalleMutation.mutate(detalle.id)}
            style={{ alignSelf: 'flex-end' }}
          >
            Borrar
          </Button>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Gestión de Tarimas
        </Typography.Title>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Crear tarima
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {tarimas.map((tarima) => {
          const tieneRelacionActiva = !!tarima.ordenDetalle?.orden;
          const productoLabel = formatProductLabel(tarima.ordenDetalle?.producto, {
            includeKey: true,
          });

          return (
            <Col xs={24} sm={12} lg={8} key={tarima.id}>
              <Card
                hoverable
                styles={{ body: { padding: '20px' } }}
                actions={[
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenModal(tarima)}
                  >
                    Editar
                  </Button>,
                  <Popconfirm
                    title="¿Eliminar?"
                    onConfirm={() => deleteMutation.mutate(tarima.id)}
                    okText="Sí"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      Borrar
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <Typography.Title level={5} style={{ margin: 0, color: '#1677ff' }}>
                    Tarima #{tarima.numero}
                  </Typography.Title>
                  {tieneRelacionActiva ? (
                    <Tag color="blue">{formatOrderLabel(tarima.ordenDetalle?.orden)}</Tag>
                  ) : (
                    <Tag color="red">Orden eliminada</Tag>
                  )}
                </div>

                <Typography.Text type="secondary" style={{ display: 'block' }}>
                  Producto
                </Typography.Text>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  {productoLabel}
                </Typography.Text>

                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                  Cliente
                </Typography.Text>
                <Typography.Text strong>
                  {tarima.ordenDetalle?.producto?.cliente?.nombre || 'N/A'}
                </Typography.Text>

                {!tieneRelacionActiva && (
                  <Typography.Paragraph
                    type="warning"
                    style={{ marginTop: 12, marginBottom: 0 }}
                  >
                    Esta tarima quedó ligada a una orden eliminada. Reasígnala a una orden activa.
                  </Typography.Paragraph>
                )}

                <Divider style={{ margin: '16px 0' }} />

                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <div
                      style={{
                        textAlign: 'center',
                        background: '#f5f5f5',
                        padding: '8px',
                        borderRadius: '4px',
                      }}
                    >
                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                        Unidades
                      </Typography.Text>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {tarima.totalUnidades}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div
                      style={{
                        textAlign: 'center',
                        background: '#e6f7ff',
                        padding: '8px',
                        borderRadius: '4px',
                      }}
                    >
                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                        Total Kg
                      </Typography.Text>
                      <div
                        style={{ fontSize: '18px', fontWeight: 'bold', color: '#1677ff' }}
                      >
                        {Number(tarima.totalKg).toFixed(2)}
                      </div>
                    </div>
                  </Col>
                </Row>

                <Button
                  type="primary"
                  size="large"
                  block
                  style={{
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                  }}
                  icon={<UnorderedListOutlined />}
                  onClick={() => handleOpenDetalle(tarima.id)}
                >
                  Visualizar detalles
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>

      {tarimas.length === 0 && !isLoading && (
        <Card>
          <Typography.Text>No hay tarimas registradas.</Typography.Text>
        </Card>
      )}

      <Modal
        title={editingId ? 'Editar Tarima' : 'Nueva Tarima'}
        open={isModalVisible}
        onCancel={handleCloseTarimaModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            editingId
              ? updateMutation.mutate({ id: editingId, data: values })
              : createMutation.mutate(values)
          }
        >
          <Form.Item name="numero" label="No. Tarima" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="ordenDetalleId"
            label="Orden y producto"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              allowClear
              optionFilterProp="children"
              placeholder="Selecciona una orden activa"
            >
              {detallesList.map((detalle) => (
                <Option key={detalle.id} value={detalle.id}>
                  {formatOrderDetailLabel(detalle)}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Detalle de Tarima #${tarimaDetail?.numero || selectedTarimaId}`}
        open={isDetalleVisible}
        onCancel={handleCloseDetalleModal}
        footer={null}
        width={920}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Card size="small" styles={{ body: { padding: 14 } }}>
            <Typography.Text type="secondary">Total unidades</Typography.Text>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {tarimaDetail?.totalUnidades || 0}
            </Typography.Title>
          </Card>
          <Card size="small" styles={{ body: { padding: 14 } }}>
            <Typography.Text type="secondary">Total peso</Typography.Text>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {Number(tarimaDetail?.totalKg || 0).toFixed(2)} Kg
            </Typography.Title>
          </Card>
          <Card size="small" styles={{ body: { padding: 14 } }}>
            <Typography.Text type="secondary">Producto</Typography.Text>
            <Typography.Text strong style={{ display: 'block', marginTop: 4 }}>
              {formatProductLabel(tarimaDetail?.ordenDetalle?.producto, {
                includeKey: true,
                includeClient: true,
              })}
            </Typography.Text>
          </Card>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Form
            form={detalleForm}
            layout="inline"
            onFinish={(values) =>
              addDetalleMutation.mutate({
                pesoKg: values.pesoKg,
                tarimaId: selectedTarimaId!,
              })
            }
          >
            <Form.Item name="pesoKg" rules={[{ required: true }]}>
              <InputNumber placeholder="Peso en Kg" min={0.01} step={0.01} autoFocus />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={addDetalleMutation.isPending}
              icon={<PlusOutlined />}
            >
              Agregar peso
            </Button>
          </Form>

          <Space wrap>
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyWeights}
              disabled={detalleRows.length === 0}
            >
              Copiar para Excel
            </Button>
            <Button
              danger
              onClick={handleClearDetalle}
              loading={clearDetalleMutation.isPending}
              disabled={detalleRows.length === 0}
            >
              Vaciar detalle tarima
            </Button>
          </Space>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}
        >
          <Typography.Text type="secondary">
            Vista principal orientada a revisión rápida y copiado de pesos.
          </Typography.Text>
          <Segmented<DetailViewMode>
            value={detailViewMode}
            onChange={(value) => setDetailViewMode(value)}
            options={[
              { label: 'Lista', value: 'list' },
              { label: 'Cuadrícula', value: 'grid' },
            ]}
          />
        </div>

        {detailViewMode === 'list' ? (
          <Table
            size="small"
            dataSource={detalleRows}
            columns={detailColumns}
            rowKey="id"
            loading={isLoadingDetail}
            pagination={false}
            tableLayout="fixed"
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Typography.Text strong>Totales</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Typography.Text strong>
                    {Number(tarimaDetail?.totalKg || 0).toFixed(2)} Kg
                  </Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Typography.Text type="secondary">
                    {tarimaDetail?.totalUnidades || 0} unidades
                  </Typography.Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        ) : (
          renderDetalleGrid()
        )}

        {!isLoadingDetail && detalleRows.length === 0 && (
          <Card size="small" style={{ marginTop: 16 }}>
            <Typography.Text>
              Esta tarima todavía no tiene pesos registrados.
            </Typography.Text>
          </Card>
        )}
      </Modal>
    </div>
  );
}
