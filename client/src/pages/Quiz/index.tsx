import React, { useEffect, useRef, useCallback } from 'react';
import { Button, Card, Radio, Progress, Typography, Modal, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../../stores/quizStore';
import { quizApi } from '../../services';
import { DIMENSION_LABELS } from '../../types';

const { Title, Text } = Typography;

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d'] as const;

const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const { questions, answers, currentIndex, timeLeft, assessmentId, setAnswer, setCurrentIndex, setTimeLeft, reset } = useQuizStore();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const submittedRef = useRef(false);

  const currentQ = questions[currentIndex];

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      Modal.confirm({
        title: '提交确认',
        content: `还有 ${unanswered.length} 题未作答，确定提交吗？`,
        okText: '确定提交',
        cancelText: '继续作答',
        onOk: async () => {
          await doSubmit();
        },
        onCancel: () => { submittedRef.current = false; },
      });
    } else {
      await doSubmit();
    }
  }, [questions, answers, assessmentId]);

  const doSubmit = async () => {
    try {
      const res = await quizApi.submit(assessmentId!, answers);
      message.success('测评提交成功！');
      navigate(`/report/${assessmentId}`);
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '提交失败');
      submittedRef.current = false;
    }
  };

  useEffect(() => {
    if (questions.length === 0) { navigate('/home'); return; }
    timerRef.current = setInterval(() => {
      const newTime = useQuizStore.getState().timeLeft - 1;
      if (newTime <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        if (!submittedRef.current) {
          message.warning('时间到，自动提交！');
          handleSubmit();
        }
        return;
      }
      setTimeLeft(newTime);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (timeLeft === 300 && !submittedRef.current) {
      message.warning('剩余5分钟，请注意时间！');
    }
  }, [timeLeft]);

  if (!currentQ) return null;

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      {/* Timer & Progress */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>答题进度：{answeredCount} / {questions.length}</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: timeLeft <= 300 ? '#ff4d4f' : '#1890ff' }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
          <Text type="secondary">{DIMENSION_LABELS[currentQ.dimension]}</Text>
        </div>
        <Progress percent={progress} style={{ marginTop: 8 }} />
      </Card>

      {/* Question */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 24 }}>
          {currentIndex + 1}. {currentQ.content}
        </Title>
        <Radio.Group
          value={answers[currentQ.id] || ''}
          onChange={(e) => setAnswer(String(currentQ.id), e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {OPTION_KEYS.map((key, idx) => (
              <Radio
                key={key}
                value={OPTION_LABELS[idx]}
                style={{
                  display: 'flex', alignItems: 'flex-start', padding: '12px 16px',
                  borderRadius: 8, border: answers[currentQ.id] === OPTION_LABELS[idx] ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  background: answers[currentQ.id] === OPTION_LABELS[idx] ? '#e6f7ff' : '#fff',
                }}
              >
                <Text strong style={{ marginRight: 8 }}>{OPTION_LABELS[idx]}.</Text>
                <Text>{currentQ[key]}</Text>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Card>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>
          上一题
        </Button>
        {currentIndex === questions.length - 1 ? (
          <Button type="primary" onClick={handleSubmit}>
            提交测评
          </Button>
        ) : (
          <Button type="primary" onClick={() => setCurrentIndex(currentIndex + 1)}>
            下一题
          </Button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
