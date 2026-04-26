import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Collapse,
  DatePicker,
  Empty,
  Form,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  createEntrada,
  deleteEntrada,
  getEntradas,
  updateEntrada,
} from '../services/entradas.service';
import type { CreateEntradaDto } from '../services/entradas.service';
import { getOrdenDetalles } from '../services/ordenes.service';
import type { EntradaDiaria, TurnoEnum } from '../types/models';
import { TurnoEnumList } from '../types/models';
import {
  formatOrderDetailLabel,
  formatOrderLabel,
  formatProductLabel,
} from '../utils/display';
import {
  createConsecutiveColumn,
  DEFAULT_TABLE_PAGE_SIZE,
  resolvePaginationState,
} from '../utils/table';

const { Option } = Select;

type ViewMode = 'grouped' | 'flat';

type EntradaView = EntradaDiaria & {
  year: string;
  month: string;
  monthLabel: string;
  dayLabel: string;
  folioLabel: string;
  productLabel: string;
  turnoRank: number;
};

type TurnoGroup = {
  key: string;
  turno: TurnoEnum;
  items: EntradaView[];
  totalKg: number;
};

type DiaGroup = {
  key: string;
  day: string;
  label: string;
  items: EntradaView[];
  totalKg: number;
  turnos: TurnoGroup[];
};

type MesGroup = {
  key: string;
  month: string;
  label: string;
  items: EntradaView[];
  totalKg: number;
  dias: DiaGroup[];
};

type AnioGroup = {
  key: string;
  year: string;
  items: EntradaView[];
  totalKg: number;
  meses: MesGroup[];
};

const MONTH_LABELS: Record<string, string> = {
  '01': 'Enero',
  '02': 'Febrero',
  '03': 'Marzo',
  '04': 'Abril',
  '05': 'Mayo',
  '06': 'Junio',
  '07': 'Julio',
  '08': 'Agosto',
  '09': 'Septiembre',
  '10': 'Octubre',
  '11': 'Noviembre',
  '12': 'Diciembre',
};

const TURNO_ORDER: Record<TurnoEnum, number> = {
  PRIMERO: 1,
  SEGUNDO: 2,
  TERCERO: 3,
};

function sortEntradas(entries: EntradaView[]) {
  return [...entries].sort((a, b) => {
    const dateDiff = dayjs(b.fecha).valueOf() - dayjs(a.fecha).valueOf();
    if (dateDiff !== 0) {
      return dateDiff;
    }

    const turnoDiff = TURNO_ORDER[b.turno] - TURNO_ORDER[a.turno];
    if (turnoDiff !== 0) {
      return turnoDiff;
    }

    return dayjs(b.creadoEn).valueOf() - dayjs(a.creadoEn).valueOf();
  });
}

function sumKg(entries: Array<{ pesoKg: number | string }>) {
  return entries.reduce((sum, entry) => sum + Number(entry.pesoKg), 0);
}

export function EntradasRoute() {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [yearFilter, setYearFilter] = useState<string>();
  const [monthFilter, setMonthFilter] = useState<string>();
  const [turnoFilter, setTurnoFilter] = useState<TurnoEnum>();
  const [folioFilter, setFolioFilter] = useState<string>();
  const [productoFilter, setProductoFilter] = useState<string>();
  const [flatPagination, setFlatPagination] = useState({
    current: 1,
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
  });
  const [form] = Form.useForm();

  const { data: entradasResponse, isLoading } = useQuery({
    queryKey: ['entradas'],
    queryFn: () => getEntradas(),
  });
  const { data: ordenDetalles } = useQuery({
    queryKey: ['ordenDetalles'],
    queryFn: () => getOrdenDetalles(),
  });

  const entradas = entradasResponse?.data ?? [];
  const detallesList = ordenDetalles ?? [];

  const entradasEnriquecidas = useMemo(() => {
    const data = entradas.map((entrada) => {
      const date = dayjs(entrada.fecha);
      const month = date.format('MM');

      return {
        ...entrada,
        year: date.format('YYYY'),
        month,
        monthLabel: `${MONTH_LABELS[month]} ${date.format('YYYY')}`,
        dayLabel: date.format('DD/MM/YYYY'),
        folioLabel: entrada.ordenDetalle
          ? formatOrderLabel(entrada.ordenDetalle.orden)
          : 'Relación no disponible',
        productLabel: formatProductLabel(entrada.ordenDetalle?.producto, {
          includeKey: true,
          includeClient: true,
        }),
        turnoRank: TURNO_ORDER[entrada.turno],
      };
    });

    return sortEntradas(data);
  }, [entradas]);

  const availableYears = useMemo(
    () =>
      [...new Set(entradasEnriquecidas.map((entrada) => entrada.year))]
        .sort((a, b) => Number(b) - Number(a))
        .map((year) => ({ label: year, value: year })),
    [entradasEnriquecidas],
  );

  const availableMonths = useMemo(() => {
    const source = yearFilter
      ? entradasEnriquecidas.filter((entrada) => entrada.year === yearFilter)
      : entradasEnriquecidas;

    return [...new Set(source.map((entrada) => entrada.month))]
      .sort((a, b) => Number(b) - Number(a))
      .map((month) => ({
        label: MONTH_LABELS[month],
        value: month,
      }));
  }, [entradasEnriquecidas, yearFilter]);

  const availableFolios = useMemo(
    () =>
      [...new Set(entradasEnriquecidas.map((entrada) => entrada.folioLabel))].map(
        (folio) => ({
          label: folio,
          value: folio,
        }),
      ),
    [entradasEnriquecidas],
  );

  const availableProducts = useMemo(
    () =>
      [...new Set(entradasEnriquecidas.map((entrada) => entrada.productLabel))].map(
        (product) => ({
          label: product,
          value: product,
        }),
      ),
    [entradasEnriquecidas],
  );

  const filteredEntradas = useMemo(() => {
    return entradasEnriquecidas.filter((entrada) => {
      if (yearFilter && entrada.year !== yearFilter) {
        return false;
      }
      if (monthFilter && entrada.month !== monthFilter) {
        return false;
      }
      if (turnoFilter && entrada.turno !== turnoFilter) {
        return false;
      }
      if (folioFilter && entrada.folioLabel !== folioFilter) {
        return false;
      }
      if (productoFilter && entrada.productLabel !== productoFilter) {
        return false;
      }

      return true;
    });
  }, [
    entradasEnriquecidas,
    yearFilter,
    monthFilter,
    turnoFilter,
    folioFilter,
    productoFilter,
  ]);

  const groupedEntradas = useMemo<AnioGroup[]>(() => {
    const yearMap = new Map<string, EntradaView[]>();

    filteredEntradas.forEach((entrada) => {
      const current = yearMap.get(entrada.year) ?? [];
      current.push(entrada);
      yearMap.set(entrada.year, current);
    });

    return [...yearMap.entries()]
      .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
      .map(([year, yearEntries]) => {
        const monthMap = new Map<string, EntradaView[]>();

        yearEntries.forEach((entrada) => {
          const current = monthMap.get(entrada.month) ?? [];
          current.push(entrada);
          monthMap.set(entrada.month, current);
        });

        const meses: MesGroup[] = [...monthMap.entries()]
          .sort(([monthA], [monthB]) => Number(monthB) - Number(monthA))
          .map(([month, monthEntries]) => {
            const dayMap = new Map<string, EntradaView[]>();

            monthEntries.forEach((entrada) => {
              const current = dayMap.get(entrada.fecha) ?? [];
              current.push(entrada);
              dayMap.set(entrada.fecha, current);
            });

            const dias: DiaGroup[] = [...dayMap.entries()]
              .sort(([dayA], [dayB]) => dayjs(dayB).valueOf() - dayjs(dayA).valueOf())
              .map(([day, dayEntries]) => {
                const turnoMap = new Map<TurnoEnum, EntradaView[]>();

                dayEntries.forEach((entrada) => {
                  const current = turnoMap.get(entrada.turno) ?? [];
                  current.push(entrada);
                  turnoMap.set(entrada.turno, current);
                });

                const turnos: TurnoGroup[] = [...turnoMap.entries()]
                  .sort(
                    ([turnoA], [turnoB]) =>
                      TURNO_ORDER[turnoB] - TURNO_ORDER[turnoA],
                  )
                  .map(([turno, turnoEntries]) => ({
                    key: `${day}-${turno}`,
                    turno,
                    items: sortEntradas(turnoEntries),
                    totalKg: sumKg(turnoEntries),
                  }));

                return {
                  key: day,
                  day,
                  label: dayjs(day).format('DD/MM/YYYY'),
                  items: sortEntradas(dayEntries),
                  totalKg: sumKg(dayEntries),
                  turnos,
                };
              });

            return {
              key: `${year}-${month}`,
              month,
              label: `${MONTH_LABELS[month]} ${year}`,
              items: sortEntradas(monthEntries),
              totalKg: sumKg(monthEntries),
              dias,
            };
          });

        return {
          key: year,
          year,
          items: sortEntradas(yearEntries),
          totalKg: sumKg(yearEntries),
          meses,
        };
      });
  }, [filteredEntradas]);

  const invalidateEntradas = () => {
    queryClient.invalidateQueries({ queryKey: ['entradas'] });
    queryClient.invalidateQueries({ queryKey: ['inventario'] });
  };

  const createMutation = useMutation({
    mutationFn: createEntrada,
    onSuccess: () => {
      message.success('Entrada registrada');
      invalidateEntradas();
      handleCloseModal();
    },
    onError: () => message.error('Error al registrar'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateEntradaDto> }) =>
      updateEntrada(id, data),
    onSuccess: () => {
      message.success('Entrada actualizada');
      invalidateEntradas();
      handleCloseModal();
    },
    onError: () => message.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEntrada,
    onSuccess: () => {
      message.success('Eliminada');
      invalidateEntradas();
    },
    onError: () => message.error('Error al eliminar'),
  });

  const handleOpenModal = (entrada?: EntradaDiaria) => {
    if (entrada) {
      setEditingId(entrada.id);
      form.setFieldsValue({
        pesoKg: entrada.pesoKg,
        fecha: dayjs(entrada.fecha),
        ordenDetalleId: entrada.ordenDetalle?.id,
        turno: entrada.turno,
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ fecha: dayjs(), turno: 'PRIMERO' });
    }

    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const clearFilters = () => {
    setYearFilter(undefined);
    setMonthFilter(undefined);
    setTurnoFilter(undefined);
    setFolioFilter(undefined);
    setProductoFilter(undefined);
    setFlatPagination({
      current: 1,
      pageSize: DEFAULT_TABLE_PAGE_SIZE,
    });
  };

  const handleFinish = (values: {
    fecha: dayjs.Dayjs;
    ordenDetalleId: number;
    pesoKg: number;
    turno: TurnoEnum;
  }) => {
    const data: CreateEntradaDto = {
      ...values,
      fecha: values.fecha.format('YYYY-MM-DD'),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
      return;
    }

    createMutation.mutate(data);
  };

  const groupedColumns = [
    {
      title: 'Folio',
      key: 'orden',
      render: (_: unknown, record: EntradaView) => record.folioLabel,
    },
    {
      title: 'Producto',
      key: 'producto',
      render: (_: unknown, record: EntradaView) => record.productLabel,
    },
    {
      title: 'Peso (Kg)',
      dataIndex: 'pesoKg',
      key: 'pesoKg',
      width: 120,
      render: (value: number | string | null | undefined) =>
        value != null ? (
          <Typography.Text strong style={{ color: '#52c41a' }}>
            {Number(value).toFixed(2)} Kg
          </Typography.Text>
        ) : (
          '-'
        ),
    },
    {
      title: 'Usuario',
      key: 'usuario',
      width: 140,
      render: (_: unknown, record: EntradaView) => record.usuario?.user ?? 'N/A',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      render: (_: unknown, record: EntradaView) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Eliminar entrada?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Sí"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const flatColumns = [
    createConsecutiveColumn<EntradaView>(flatPagination),
    {
      title: 'Fecha',
      key: 'fecha',
      width: 110,
      render: (_: unknown, record: EntradaView) => record.dayLabel,
    },
    {
      title: 'Turno',
      dataIndex: 'turno',
      key: 'turno',
      width: 120,
      render: (turno: TurnoEnum) => <Tag color="blue">{turno}</Tag>,
    },
    {
      title: 'Folio',
      key: 'orden',
      render: (_: unknown, record: EntradaView) => record.folioLabel,
    },
    {
      title: 'Producto',
      key: 'producto',
      render: (_: unknown, record: EntradaView) => record.productLabel,
    },
    {
      title: 'Peso (Kg)',
      dataIndex: 'pesoKg',
      key: 'pesoKg',
      width: 120,
      render: (value: number | string | null | undefined) =>
        value != null ? Number(value).toFixed(2) : '-',
    },
    {
      title: 'Usuario',
      key: 'usuario',
      width: 140,
      render: (_: unknown, record: EntradaView) => record.usuario?.user ?? 'N/A',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      render: (_: unknown, record: EntradaView) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Eliminar entrada?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Sí"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderTurnos = (dayGroup: DiaGroup) => (
    <Collapse
      size="small"
      defaultActiveKey={dayGroup.turnos[0] ? [dayGroup.turnos[0].key] : []}
      items={dayGroup.turnos.map((turnoGroup) => ({
        key: turnoGroup.key,
        label: (
          <Space wrap>
            <Typography.Text strong>{turnoGroup.turno}</Typography.Text>
            <Typography.Text type="secondary">
              {turnoGroup.items.length} registros
            </Typography.Text>
            <Typography.Text type="secondary">
              {turnoGroup.totalKg.toFixed(2)} Kg
            </Typography.Text>
          </Space>
        ),
        children: (
          <Table
            size="small"
            dataSource={turnoGroup.items}
            columns={groupedColumns}
            rowKey="id"
            pagination={false}
          />
        ),
      }))}
    />
  );

  const renderDias = (monthGroup: MesGroup) => (
    <Collapse
      size="small"
      defaultActiveKey={monthGroup.dias[0] ? [monthGroup.dias[0].key] : []}
      items={monthGroup.dias.map((dayGroup) => ({
        key: dayGroup.key,
        label: (
          <Space wrap>
            <Typography.Text strong>{dayGroup.label}</Typography.Text>
            <Typography.Text type="secondary">
              {dayGroup.items.length} registros
            </Typography.Text>
            <Typography.Text type="secondary">
              {dayGroup.totalKg.toFixed(2)} Kg
            </Typography.Text>
          </Space>
        ),
        children: renderTurnos(dayGroup),
      }))}
    />
  );

  const renderMeses = (yearGroup: AnioGroup) => (
    <Collapse
      size="small"
      defaultActiveKey={yearGroup.meses[0] ? [yearGroup.meses[0].key] : []}
      items={yearGroup.meses.map((monthGroup) => ({
        key: monthGroup.key,
        label: (
          <Space wrap>
            <Typography.Text strong>{monthGroup.label}</Typography.Text>
            <Typography.Text type="secondary">
              {monthGroup.items.length} registros
            </Typography.Text>
            <Typography.Text type="secondary">
              {monthGroup.totalKg.toFixed(2)} Kg
            </Typography.Text>
          </Space>
        ),
        children: renderDias(monthGroup),
      }))}
    />
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Entradas Diarias
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Registrar Entrada
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space
          size={[12, 12]}
          wrap
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <Space size={[12, 12]} wrap>
            <Select
              allowClear
              placeholder="Año"
              value={yearFilter}
              options={availableYears}
              style={{ minWidth: 110 }}
              onChange={(value) => {
                setYearFilter(value);
                setMonthFilter(undefined);
              }}
            />
            <Select
              allowClear
              placeholder="Mes"
              value={monthFilter}
              options={availableMonths}
              style={{ minWidth: 150 }}
              onChange={setMonthFilter}
            />
            <Select
              allowClear
              placeholder="Turno"
              value={turnoFilter}
              style={{ minWidth: 140 }}
              onChange={setTurnoFilter}
            >
              {TurnoEnumList.map((turno) => (
                <Option key={turno} value={turno}>
                  {turno}
                </Option>
              ))}
            </Select>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Folio"
              value={folioFilter}
              options={availableFolios}
              style={{ minWidth: 260 }}
              onChange={setFolioFilter}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Producto"
              value={productoFilter}
              options={availableProducts}
              style={{ minWidth: 320 }}
              onChange={setProductoFilter}
            />
            <Button onClick={clearFilters}>Limpiar filtros</Button>
          </Space>

          <Segmented<ViewMode>
            value={viewMode}
            onChange={(value) => setViewMode(value)}
            options={[
              { label: 'Vista agrupada', value: 'grouped' },
              { label: 'Vista plana', value: 'flat' },
            ]}
          />
        </Space>
      </Card>

      {isLoading ? (
        <Card loading />
      ) : filteredEntradas.length === 0 ? (
        <Card>
          <Empty description="No hay entradas con los filtros actuales." />
        </Card>
      ) : viewMode === 'grouped' ? (
        <Collapse
          defaultActiveKey={groupedEntradas[0] ? [groupedEntradas[0].key] : []}
          items={groupedEntradas.map((yearGroup) => ({
            key: yearGroup.key,
            label: (
              <Space wrap>
                <Typography.Text strong>Año {yearGroup.year}</Typography.Text>
                <Typography.Text type="secondary">
                  {yearGroup.items.length} registros
                </Typography.Text>
                <Typography.Text type="secondary">
                  {yearGroup.totalKg.toFixed(2)} Kg
                </Typography.Text>
              </Space>
            ),
            children: renderMeses(yearGroup),
          }))}
        />
      ) : (
        <Card bordered={false} bodyStyle={{ padding: 0 }}>
          <Table
            dataSource={filteredEntradas}
            columns={flatColumns}
            rowKey="id"
            pagination={{
              current: flatPagination.current,
              pageSize: flatPagination.pageSize,
              total: filteredEntradas.length,
              showSizeChanger: true,
            }}
            onChange={(pagination) =>
              setFlatPagination(resolvePaginationState(pagination))
            }
          />
        </Card>
      )}

      <Modal
        title={editingId ? 'Editar Entrada' : 'Nueva Entrada'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="ordenDetalleId"
            label="Orden y Producto"
            rules={[{ required: true }]}
          >
            <Select showSearch optionFilterProp="children" placeholder="Busca la orden">
              {detallesList.map((detalle) => (
                <Option key={detalle.id} value={detalle.id}>
                  {formatOrderDetailLabel(detalle)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="turno" label="Turno" rules={[{ required: true }]}>
            <Select>
              {TurnoEnumList.map((value) => (
                <Option key={value} value={value}>
                  {value}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="fecha" label="Fecha" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="pesoKg" label="Peso (Kg)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
