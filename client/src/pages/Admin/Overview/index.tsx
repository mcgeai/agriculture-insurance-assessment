import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import { adminApi } from '../../../services';
import { DIMENSION_LABELS } from '../../../types';

const Overview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getOverview().then(res => setData(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 200 }} />;
  if (!data) return <div>加载失败</div>;

  const pieOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: Object.entries(data.rating_distribution as Record<string, number>).map(([k, v]) => ({
        name: `${k}级`, value: v,
        itemStyle: { color: { A: '#52c41a', B: '#1890ff', C: '#faad14', D: '#ff4d4f' }[k] },
      })),
      label: { formatter: '{b}: {c}人' },
    }],
  };

  const barOption = {
    tooltip: {},
    xAxis: { type: 'category', data: Object.keys(DIMENSION_LABELS).map(k => DIMENSION_LABELS[k]) },
    yAxis: { type: 'value', max: 100 },
    series: [{
      type: 'bar',
      data: Object.entries(data.dimension_avg as Record<string, number>).map(([k, v]) => ({
        value: v,
        itemStyle: { color: { D1: '#1890ff', D2: '#52c41a', D3: '#722ed1', D4: '#fa8c16' }[k] },
      })),
      barWidth: 50,
      label: { show: true, position: 'top', formatter: '{c}' },
    }],
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}><Card><Statistic title="参评人数" value={data.total_participants} /></Card></Col>
        <Col span={6}><Card><Statistic title="平均分" value={data.avg_score} precision={1} /></Card></Col>
        <Col span={6}><Card><Statistic title="最高分" value={data.max_score} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="最低分" value={data.min_score} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>
      <Row gutter={20}>
        <Col span={12}>
          <Card title="评级分布"><ReactECharts option={pieOption} style={{ height: 300 }} /></Card>
        </Col>
        <Col span={12}>
          <Card title="各维度平均分"><ReactECharts option={barOption} style={{ height: 300 }} /></Card>
        </Col>
      </Row>
    </div>
  );
};

export default Overview;
