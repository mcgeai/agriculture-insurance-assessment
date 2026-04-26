import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Typography } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined, FormOutlined, HistoryOutlined,
  BarChartOutlined, BookOutlined, TeamOutlined, UserOutlined,
  LogoutOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  const empMenuItems = [
    { key: '/home', icon: <HomeOutlined />, label: '测评首页' },
    { key: '/history', icon: <HistoryOutlined />, label: '历史记录' },
  ];

  const adminMenuItems = [
    { key: '/admin/overview', icon: <BarChartOutlined />, label: '数据总览' },
    { key: '/admin/questions', icon: <BookOutlined />, label: '题目管理' },
    { key: '/admin/employees', icon: <TeamOutlined />, label: '员工明细' },
    { key: '/admin/accounts', icon: <UserOutlined />, label: '账号管理' },
  ];

  const menuItems = isAdmin ? adminMenuItems : empMenuItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dropdownItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Text strong style={{ fontSize: collapsed ? 14 : 16, whiteSpace: 'nowrap' }}>
            {collapsed ? '测评' : '胜任力测评'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <Text>{user?.name}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
