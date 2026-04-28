import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Table, Progress, Tag } from 'antd';
import { CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { adminApi } from '../../../services';
import { DIMENSION_LABELS, RATING_COLORS } from '../../../types';

interface StatisticsData {
  completion_rate: { total: number; assessed: number; rate: number };
  department_stats: Array<{
    department: string;
    assessed_count: number;
    avg_score: number;
    dimension_avg: Record<string, number>;
  }>;
  question_accuracy: Array<{
    question_id: number;
    dimension: string;
    content: string;
    total_answers: number;
    correct_answers: number;
    accuracy: number;
  }>;
  dimension_accuracy: Record<string, number>;
}

const Statistics: React.FC = () => {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const res = await adminApi.getStatistics();
      setData(res.data.data);
    } catch {}
    setLoading(false);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 200 }} />;
  if (!data) return <div style={{ textAlign: 'center', marginTop: 200 }}>暂无统计数据</div>;

  // Department avg score bar chart
  const deptBarOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: data.department_stats.map(d => d.department) },
    yAxis: { type: 'value' as const, max: 100, name: '平均分' },
    series: [{
      type: 'bar' as const,
      data: data.department_stats.map(d => d.avg_score),
      itemStyle: {
        color: (params: any) => {
          const v = params.value;
          if (v >= 90) return '#52c41a';
          if (v >= 75) return '#1890ff';
          if (v >= 60) return '#faad14';
          return '#ff4d4f';
        },
      },
      label: { show: true, position: 'top' as const, formatter: '{c}' },
    }],
  };

  // Department dimension radar chart - use first department
  const radarDepts = data.department_stats.filter(d => d.avg_score > 0);
  const radarOption = radarDepts.length > 0 ? {
    tooltip: {},
    legend: { data: radarDepts.map(d => d.department), bottom: 0 },
    radar: {
      indicator: ['D1', 'D2', 'D3', 'D4'].map(d => ({ name: DIMENSION_LABELS[d], max: 100 })),
      shape: 'circle' as const,
      splitNumber: 4,
      axisName: { color: '#333', fontSize: 12 },
    },
    series: [{
      type: 'radar' as const,
      data: radarDepts.map((d, i) => ({
        value: ['D1', 'D2', 'D3', 'D4'].map(dim => d.dimension_avg[dim]),
        name: d.department,
        areaStyle: { opacity: 0.15 },
      })),
    }],
  } : null;

  // Dimension accuracy bar chart
  const dimAccOption = {
    tooltip: { trigger: 'axis' as const, formatter: (p: any) => `${p[0].name}: ${p[0].value}%` },
    xAxis: {
      type: 'category' as const,
      data: ['D1', 'D2', 'D3', 'D4'].map(d => DIMENSION_LABELS[d]),
    },
    yAxis: { type: 'value' as const, max: 100, name: '正确率(%)' },
    series: [{
      type: 'bar' as const,
      data: ['D1', 'D2', 'D3', 'D4'].map(d => data.dimension_accuracy[d] || 0),
      itemStyle: {
        color: (params: any) => {
          const v = params.value;
          if (v >= 80) return '#52c41a';
          if (v >= 60) return '#1890ff';
          if (v >= 40) return '#faad14';
          return '#ff4d4f';
        },
      },
      label: { show: true, position: 'top' as const, formatter: '{c}%' },
    }],
  };

  // Question difficulty distribution (accuracy ranges)
  const accRanges = [
    { label: '0-20% (极难)', min: 0, max: 20, color: '#ff4d4f' },
    { label: '20-40% (困难)', min: 20, max: 40, color: '#fa541c' },
    { label: '40-60% (中等)', min: 40, max: 60, color: '#faad14' },
    { label: '60-80% (较易)', min: 60, max: 80, color: '#1890ff' },
    { label: '80-100% (容易)', min: 80, max: 100, color: '#52c41a' },
  ];
  const diffData = accRanges.map(r => ({
    name: r.label,
    value: data.question_accuracy.filter(q => q.accuracy >= r.min && q.accuracy < r.max).length +
            (r.max === 100 ? data.question_accuracy.filter(q => q.accuracy === 100).length : 0),
  }));
  // Fix: add 100% to last range
  diffData[diffData.length - 1].value = data.question_accuracy.filter(q => q.accuracy >= 80).length;
  diffData[0].value = data.question_accuracy.filter(q => q.accuracy < 20).length;
  diffData[1].value = data.question_accuracy.filter(q => q.accuracy >= 20 && q.accuracy < 40).length;
  diffData[2].value = data.question_accuracy.filter(q => q.accuracy >= 40 && q.accuracy < 60).length;
  diffData[3].value = data.question_accuracy.filter(q => q.accuracy >= 60 && q.accuracy < 80).length;
  diffData[4].value = data.question_accuracy.filter(q => q.accuracy >= 80).length;

  const diffPieOption = {
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c}题 ({d}%)' },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      data: diffData.map((d, i) => ({ ...d, itemStyle: { color: accRanges[i].color } })),
      label: { formatter: '{b}\n{c}题' },
    }],
  };

  // Hardest questions table
  const hardestQuestions = [...data.question_accuracy]
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 10);

  const columns = [
    {
      title: '排名', key: 'rank', width: 60,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: '维度', dataIndex: 'dimension', width: 160,
      render: (d: string) => <Tag color="blue">{DIMENSION_LABELS[d]}</Tag>,
    },
    {
      title: '题目', dataIndex: 'content', ellipsis: true,
      render: (t: string) => <span title={t}>{t}</span>,
    },
    {
      title: '正确率', dataIndex: 'accuracy', width: 180,
      render: (v: number) => {
        const color = v >= 80 ? '#52c41a' : v >= 60 ? '#1890ff' : v >= 40 ? '#faad14' : '#ff4d4f';
        return <Progress percent={v} size="small" strokeColor={color} />;
      },
    },
    {
      title: '答题数', dataIndex: 'total_answers', width: 80, align: 'center' as const,
    },
  ];

  return (
    <div>
      {/* Row 1: Completion rate */}
      <Row gutter={20}>
        <Col span={8}>
          <Card>
            <Statistic title="员工总数" value={data.completion_rate.total} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="已参评" value={data.completion_rate.assessed} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="参评率" value={data.completion_rate.rate} suffix="%" valueStyle={{ color: data.completion_rate.rate >= 80 ? '#52c41a' : data.completion_rate.rate >= 50 ? '#faad14' : '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      {/* Row 2: Department charts */}
      <Row gutter={20} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="各部门平均分">
            <ReactECharts option={deptBarOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="各部门维度对比">
            {radarOption ? (
              <ReactECharts option={radarOption} style={{ height: 320 }} />
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 120, color: '#999' }}>暂无部门测评数据</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Row 3: Dimension accuracy + difficulty distribution */}
      <Row gutter={20} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="各维度正确率">
            <ReactECharts option={dimAccOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="题目难度分布">
            <ReactECharts option={diffPieOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      {/* Row 4: Hardest questions */}
      <Card title="最难题TOP10（正确率最低）" style={{ marginTop: 20 }}>
        <Table
          dataSource={hardestQuestions}
          columns={columns}
          rowKey="question_id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Statistics;
