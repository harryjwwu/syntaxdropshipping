import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  ChevronDown,
  Package,
  DollarSign,
  ShoppingCart,
  Calculator,
  Percent
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { admin, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: '仪表板',
      href: '/dashboard',
      icon: LayoutDashboard,
      permission: null // 所有管理员都可以访问
    },
    {
      name: 'SPU管理',
      href: '/spus',
      icon: Package,
      permission: 'system'
    },
    {
      name: 'SPU报价管理',
      href: '/spu-quotes',
      icon: DollarSign,
      permission: 'system'
    },
    {
      name: '订单管理',
      href: '/orders',
      icon: ShoppingCart,
      permission: 'system'
    },
    {
      name: '结算管理',
      href: '/settlement',
      icon: Calculator,
      permission: 'system'
    },
    {
      name: '佣金管理',
      href: '/commission',
      icon: Percent,
      permission: 'system'
    },
    {
      name: '充值管理',
      href: '/deposits',
      icon: CreditCard,
      permission: 'deposits'
    },
    {
      name: '用户管理',
      href: '/users',
      icon: Users,
      permission: 'users'
    },
    {
      name: '系统设置',
      href: '/settings',
      icon: Settings,
      permission: 'system'
    }
  ];

  const handleLogout = () => {
    logout();
  };

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo区域 */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Admin Panel</h1>
              </div>
            </div>
            <button
              className="lg:hidden p-1 rounded-md hover:bg-slate-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto admin-scrollbar">
            {navigation.map((item) => {
              const Icon = item.icon;
              const current = isCurrentPath(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    current
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 用户信息区域 */}
          <div className="p-4 border-t border-slate-200">
            <div className="relative">
              <button
                className="flex items-center w-full px-4 py-3 text-sm text-left rounded-lg hover:bg-slate-50 transition-colors"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {admin?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {admin?.role === 'super_admin' ? '超级管理员' : '管理员'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* 下拉菜单 */}
              {profileDropdownOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航栏 */}
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                欢迎回来，{admin?.name}
              </span>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
