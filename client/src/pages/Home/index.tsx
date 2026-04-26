import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Tag, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { quizApi, assessmentApi } from '../../services';
import { useAuthStore } from '../../stores/authStore';
import { useQuizStore } from '../../stores/quizStore';
import { DIMENSION_LABELS, DIMENSION_ICONS, AssessmentHistory } from '../../types';

const { Title, Text, Paragraph } = Typography;

const dimensions = [
  { key: 'D1', color: '#1890ff', desc: '农险条款、承保理赔流程、农业灾害知识、政策性农险体系' },
  { key: 'D2', color: '#52c41a', desc: '核心业务系统操作、数据查询与报表、系统集成与接口、故障排查' },
  { key: 'D3', color: '#722ed1', desc: '需求分析与转化、跨部门协作、用户服务意识、应急响应' },
  { key: 'D4', color: '#fa8c16', desc: '数据安全与隐私保护、监管合规要求、操作风险防控、审计配合' },
];

const Home: React.FC = () => {
  const [history, setHistory] = useState<AssessmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setQuiz } = useQuizStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await assessmentApi.getHistory();
      setHistory(res.data.data || []);
    } catch { /* first time may have no records */ }
    setLoading(false);
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await quizApi.getQuestions();
      const { assessment_id, questions, time_limit } = res.data.data;
      setQuiz(assessment_id, questions);
      useQuizStore.getState().setTimeLeft(time_limit);
      navigate('/quiz');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '获取题目失败');
    } finally {
      setStarting(false);
    }
  };

  const getDimensionStatus = (dim: string) => {
    if (history.length === 0) return '未测评';
    return '已完成';
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 200 }} />;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={3}>欢迎，{user?.name}</Title>
        <Text type="secondary">{user?.department} | 工号 {user?.employee_no}</Text>
      </div>

      <Row gutter={[20, 20]}>
        {dimensions.map((dim) => (
          <Col xs={24} sm={12} key={dim.key}>
            <Card
              hoverable
              style={{ borderLeft: `4px solid ${dim.color}`, height: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 28, marginRight: 8 }}>{DIMENSION_ICONS[dim.key]}</span>
                <Title level={5} style={{ margin: 0 }}>{DIMENSION_LABELS[dim.key]}</Title>
              </div>
              <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
                {dim.desc}
              </Paragraph>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color={getDimensionStatus(dim.key) === '已完成' ? 'green' : 'default'}>
                  {getDimensionStatus(dim.key)}
                </Tag>
                <Text type="secondary">5题</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <Button type="primary" size="large" loading={starting} onClick={handleStart} style={{ width: 240, height: 48, fontSize: 16 }}>
          开始测评
        </Button>
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">共4个维度，20道选择题，限时60分钟</Text>
        </div>
      </div>
    </div>
  );
};

export default Home;
