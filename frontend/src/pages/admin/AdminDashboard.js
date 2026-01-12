import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import StatCard from '../../components/StatCard';
import { Users, Cpu, CreditCard, Activity, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    const interval = setInterval(fetchStatistics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await adminAPI.getStatistics();
      setStats(response.data.statistics);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Owners"
          value={stats?.totalOwners || 0}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Total Machines"
          value={stats?.totalMachines || 0}
          icon={Cpu}
          color="info"
        />
        <StatCard
          title="Online Machines"
          value={stats?.onlineMachines || 0}
          icon={Activity}
          color="success"
          subtitle={`${stats?.offlineMachines || 0} offline`}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
          icon={CreditCard}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Revenue</h3>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₹{stats?.todayRevenue?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            From {stats?.totalTransactions || 0} transactions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Machine Uptime</span>
              <span className="font-semibold">
                {stats?.totalMachines > 0
                  ? Math.round((stats.onlineMachines / stats.totalMachines) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg per Machine</span>
              <span className="font-semibold">
                ₹{stats?.totalMachines > 0
                  ? Math.round(stats.totalRevenue / stats.totalMachines).toLocaleString()
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-gray-600">Check the Logs page for detailed activity monitoring</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
