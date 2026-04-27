import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Modal } from 'antd';
import { LockOutlined, UserOutlined, TeamOutlined, IdcardOutlined, SafetyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text, Link } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const loadCaptcha = async () => {
    try {
      const res = await authApi.getCaptcha();
      setCaptchaId(res.data.data.captcha_id);
      setCaptchaSvg(res.data.data.svg);
    } catch {}
  };

  useEffect(() => { if (isRegister) loadCaptcha(); }, [isRegister]);

  const onLogin = async (values: { employee_no: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(values.employee_no, values.password);
      const { token, user, must_change_pwd } = res.data.data;
      setAuth(token, user, must_change_pwd);
      if (must_change_pwd) {
        setPwdModalOpen(true);
      } else {
        navigate(user.role === 'admin' ? '/admin/overview' : '/home');
      }
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: { employee_no: string; name: string; department: string; password: string; captcha_text: string }) => {
    setRegisterLoading(true);
    try {
      await authApi.register(values.employee_no, values.name, values.department, values.password, captchaId, values.captcha_text);
      message.success('注册成功，请登录');
      setIsRegister(false);
      registerForm.resetFields();
      loginForm.setFieldsValue({ employee_no: values.employee_no });
    } catch (err: any) {
      loadCaptcha();
      message.error(err.response?.data?.error?.message || '注册失败');
    } finally {
      setRegisterLoading(false);
    }
  };

  const onChangePwd = async (values: { new_password: string; confirm: string }) => {
    setPwdLoading(true);
    try {
      await authApi.changePassword(values.new_password, values.new_password);
      message.success('密码修改成功');
      setPwdModalOpen(false);
      const user = useAuthStore.getState().user;
      navigate(user?.role === 'admin' ? '/admin/overview' : '/home');
    } catch (err: any) {
      message.error(err.response?.data?.error?.message || '修改失败');
    } finally {
      setPwdLoading(false);
    }
  };

  const pwdRule = { pattern: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/, message: '密码需包含字母和数字，至少8位' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ width: 420, background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ marginBottom: 4, fontSize: 20, fontWeight: 600 }}>农业保险IT员工</h2>
          <h3 style={{ marginTop: 0, color: '#666', fontSize: 16 }}>胜任力综合测评系统</h3>
        </div>

        {!isRegister ? (
          <>
            <Form form={loginForm} onFinish={onLogin} size="large">
              <Form.Item name="employee_no" rules={[{ required: true, message: '请输入工号' }]}>
                <Input prefix={<UserOutlined />} placeholder="工号" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  登 录
                </Button>
              </Form.Item>
            </Form>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">还没有账号？<Link onClick={() => setIsRegister(true)}>注册账号</Link></Text>
            </div>
          </>
        ) : (
          <>
            <Form form={registerForm} onFinish={onRegister} size="large">
              <Form.Item name="employee_no" rules={[{ required: true, message: '请输入工号' }]}>
                <Input prefix={<IdcardOutlined />} placeholder="工号" />
              </Form.Item>
              <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input prefix={<UserOutlined />} placeholder="姓名" />
              </Form.Item>
              <Form.Item name="department" rules={[{ required: true, message: '请输入部门' }]}>
                <Input prefix={<TeamOutlined />} placeholder="部门" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, pwdRule]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item name="confirm" dependencies={['password']} rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('两次密码不一致'));
                  },
                }),
              ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
              </Form.Item>
              <Form.Item name="captcha_text" rules={[{ required: true, message: '请输入验证码' }]}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input prefix={<SafetyOutlined />} placeholder="验证码" />
                  <div onClick={loadCaptcha} style={{ cursor: 'pointer', flexShrink: 0, height: 40, display: 'flex', alignItems: 'center' }} title="点击刷新">
                    {captchaSvg ? <span dangerouslySetInnerHTML={{ __html: captchaSvg }} /> : <Button icon={<ReloadOutlined />} />}
                  </div>
                </div>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={registerLoading} block>
                  注 册
                </Button>
              </Form.Item>
            </Form>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">已有账号？<Link onClick={() => setIsRegister(false)}>返回登录</Link></Text>
            </div>
          </>
        )}
      </div>

      <Modal title="修改密码" open={pwdModalOpen} footer={null} closable={false} maskClosable={false}>
        <p>首次登录需修改密码，新密码需包含字母和数字，至少8位。</p>
        <Form onFinish={onChangePwd}>
          <Form.Item name="new_password" rules={[
            { required: true, message: '请输入新密码' },
            pwdRule
          ]}>
            <Input.Password placeholder="新密码" />
          </Form.Item>
          <Form.Item name="confirm" dependencies={['new_password']} rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                return Promise.reject(new Error('两次密码不一致'));
              },
            }),
          ]}>
            <Input.Password placeholder="确认新密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={pwdLoading} block>确认修改</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
