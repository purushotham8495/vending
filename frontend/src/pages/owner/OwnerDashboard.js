import React, { useEffect, useState } from 'react';
import { ownerAPI } from '../../utils/api';
import StatCard from '../../components/StatCard';
import { Cpu, CreditCard, TrendingUp, Activity } from 'lucide-react';

const OwnerDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await ownerAPI.getDashboard();
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
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
        <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
        <p className="text-gray-600 mt-1">Your machines and earnings overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Machines"
          value={dashboard?.totalMachines || 0}
          icon={Cpu}
          color="info"
        />
        <StatCard
          title="Online Machines"
          value={dashboard?.onlineMachines || 0}
          icon={Activity}
          color="success"
          subtitle={`${dashboard?.offlineMachines || 0} offline`}
        />
        <StatCard
          title="Total Transactions"
          value={dashboard?.totalTransactions || 0}
          icon={CreditCard}
          color="primary"
        />
        <StatCard
          title="Total Earnings"
          value={`₹${dashboard?.totalRevenue?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Earnings</h3>
          <p className="text-3xl font-bold text-gray-900">
            ₹{dashboard?.todayRevenue?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
          <p className="text-3xl font-bold text-gray-900">
            ₹{dashboard?.monthRevenue?.toLocaleString() || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
