import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { assessmentApi } from '../../services';
import { AssessmentHistory, RATING_COLORS, RATING_LABELS, DIMENSION_LABELS } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const History: React.FC = () => {
  const [records, setRecords] = useState<AssessmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await assessmentApi.getHistory();
      setRecords(res.data.data || []);
    } catch {}
    setLoading(false);
  };

  const parseDimScores = (record: AssessmentHistory) => {
    try {
      const arr = typeof record.dimension_scores === 'string' ? JSON.parse(record.dimension_scores) : record.dimension_scores;
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  };

  const columns = [
    {
      title: '测评时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '总分',
      dataIndex: 'total_score',
      key: 'total_score',
      render: (v: number) => <span style={{ fontWeight: 'bold', fontSize: 16 }}>{v}</span>,
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      render: (v: string) => <Tag color={RATING_COLORS[v]}>{v} - {RATING_LABELS[v]}</Tag>,
    },
    {
      title: '各维度',
      key: 'dimensions',
      render: (_: any, record: AssessmentHistory) => {
        const dims = parseDimScores(record);
        return dims.map((d: any) => (
          <span key={d.dimension} style={{ marginRight: 8 }}>
            {DIMENSION_LABELS[d.dimension]}: {d.score}
          </span>
        ));
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AssessmentHistory) => (
        <Button type="link" onClick={() => navigate(`/report/${record.id}`)}>查看报告</Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px' }}>
      <Title level={4}>测评历史记录</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default History;
