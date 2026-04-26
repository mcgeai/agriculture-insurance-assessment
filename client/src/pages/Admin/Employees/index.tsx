import React, { useEffect, useState } from 'react';
import { Table, Card, Select, Button, Tag, Space, Modal, message } from 'antd';
import { adminApi } from '../../../services';
import { RATING_COLORS, RATING_LABELS, DIMENSION_LABELS } from '../../../types';
import dayjs from 'dayjs';

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecords, setDetailRecords] = useState<any[]>([]);

  useEffect(() => { loadEmployees(); }, [page]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEmployees({ page, page_size: 20 });
      setEmployees(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {}
    setLoading(false);
  };

  const viewDetail = async (userId: number) => {
    try {
      const res = await adminApi.getEmployeeAssessments(userId);
      setDetailRecords(res.data.data || []);
      setDetailOpen(true);
    } catch {}
  };

  const columns = [
    { title: '工号', dataIndex: 'employee_no', width: 100 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '部门', dataIndex: 'department', width: 120 },
    { title: '最近评分', dataIndex: 'latest_score', width: 100, render: (v: number) => v != null ? <span style={{ fontWeight: 'bold' }}>{v}</span> : '-' },
    {
      title: '最近评级', dataIndex: 'latest_rating', width: 100,
      render: (v: string) => v ? <Tag color={RATING_COLORS[v]}>{v} - {RATING_LABELS[v]}</Tag> : <Tag>未测评</Tag>,
    },
    {
      title: '最近测评时间', dataIndex: 'latest_time', width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作', width: 100,
      render: (_: any, r: any) => <Button type="link" onClick={() => viewDetail(r.id)}>查看详情</Button>,
    },
  ];

  const detailColumns = [
    { title: '测评时间', dataIndex: 'submitted_at', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '总分', dataIndex: 'total_score' },
    { title: '评级', dataIndex: 'rating', render: (v: string) => <Tag color={RATING_COLORS[v]}>{v}</Tag> },
  ];

  return (
    <div>
      <Card title="员工测评明细">
        <Table columns={columns} dataSource={employees} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }} />
      </Card>

      <Modal title="测评历史" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={700}>
        <Table columns={detailColumns} dataSource={detailRecords} rowKey="id" pagination={false} size="small" />
      </Modal>
    </div>
  );
};

export default Employees;
