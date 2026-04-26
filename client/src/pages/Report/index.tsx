import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Descriptions, Tag, Row, Col, Button, Divider } from 'antd';
import ReactECharts from 'echarts-for-react';
import { assessmentApi } from '../../services';
import { AssessmentReport, DIMENSION_LABELS, RATING_COLORS, RATING_LABELS } from '../../types';

const { Title, Text, Paragraph } = Typography;

const Report: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const res = await assessmentApi.getReport(Number(id));
      setReport(res.data.data);
    } catch (err: any) {
      // try admin view
    }
    setLoading(false);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 200 }} />;
  if (!report) return <div style={{ textAlign: 'center', marginTop: 200 }}><Text>报告不存在</Text></div>;

  const radarOption = {
    tooltip: {},
    radar: {
      indicator: report.dimension_scores.map(ds => ({ name: ds.label, max: 100 })),
      shape: 'circle',
      splitNumber: 5,
      axisName: { color: '#333', fontSize: 13 },
    },
    series: [{
      type: 'radar',
      data: [{
        value: report.dimension_scores.map(ds => ds.score),
        name: '得分',
        areaStyle: { color: 'rgba(24,144,255,0.25)' },
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' },
      }],
    }],
  };

  const weakDimensions = report.dimension_scores.filter(ds => ds.score < 75);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>测评报告</Title>
            <Text type="secondary">{report.user.name} | {report.user.department} | {report.user.employee_no}</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: RATING_COLORS[report.assessment.rating] }}>
              {report.assessment.total_score}
            </div>
            <Tag color={RATING_COLORS[report.assessment.rating]} style={{ fontSize: 14, padding: '4px 12px' }}>
              {report.assessment.rating}级 - {RATING_LABELS[report.assessment.rating]}
            </Tag>
          </div>
        </div>
      </Card>

      <Row gutter={20} style={{ marginTop: 20 }}>
        {/* Radar */}
        <Col xs={24} md={12}>
          <Card title="能力雷达图">
            <ReactECharts option={radarOption} style={{ height: 320 }} />
          </Card>
        </Col>

        {/* Dimension Scores */}
        <Col xs={24} md={12}>
          <Card title="各维度得分">
            {report.dimension_scores.map(ds => (
              <div key={ds.dimension} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text strong>{ds.label}</Text>
                  <Text style={{ color: RATING_COLORS[ds.rating] }}>{ds.score}分 ({ds.correct_count}/{ds.total_count})</Text>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${ds.score}%`, height: '100%', borderRadius: 4, background: RATING_COLORS[ds.rating], transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Suggestions */}
      {weakDimensions.length > 0 && (
        <Card title="改进建议" style={{ marginTop: 20 }}>
          {weakDimensions.map(ds => (
            <div key={ds.dimension} style={{ marginBottom: 12 }}>
              <Text strong style={{ color: '#fa8c16' }}>{ds.label}（{ds.score}分）：</Text>
              <Paragraph style={{ marginBottom: 4, color: '#666' }}>{ds.suggestion}</Paragraph>
            </div>
          ))}
        </Card>
      )}

      {/* Detail Answers */}
      <Card title="答题详情" style={{ marginTop: 20 }}>
        {report.answers.map((a: any, idx: number) => (
          <div key={idx} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: idx < report.answers.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{idx + 1}. {a.content}</Text>
              <Tag color={a.is_correct ? 'green' : 'red'}>{a.is_correct ? '正确' : '错误'}</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              你的答案：{a.selected_answer} | 正确答案：{a.correct_answer}
            </Text>
          </div>
        ))}
      </Card>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button onClick={() => navigate('/history')}>查看历史记录</Button>
        <Button type="primary" style={{ marginLeft: 12 }} onClick={() => navigate('/home')}>返回首页</Button>
      </div>
    </div>
  );
};

export default Report;
