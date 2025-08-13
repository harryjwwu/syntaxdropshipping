import React from 'react';
import { ShoppingCart, Package, Truck, Clock } from 'lucide-react';

const OrdersPage = () => {
  const mockStats = [
    { label: 'Total Orders', value: '0', icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Pending', value: '0', icon: Clock, color: 'text-yellow-600' },
    { label: 'Processing', value: '0', icon: Package, color: 'text-blue-600' },
    { label: 'Shipped', value: '0', icon: Truck, color: 'text-green-600' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and track your orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {mockStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                      <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-8 text-center">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Orders Management</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            This section will be implemented soon. You'll be able to view, manage, and track all your orders here.
          </p>
          
          {/* Feature List */}
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Coming Features:</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>View all orders with status tracking</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>Order details and shipping information</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>Order history and analytics</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>Bulk order management</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>Integration with fulfillment system</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8">
            <button
              disabled
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
            >
              <Package className="w-4 h-4 mr-2" />
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
