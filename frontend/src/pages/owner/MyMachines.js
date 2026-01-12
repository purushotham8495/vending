import React, { useEffect, useState } from 'react';
import { ownerAPI } from '../../utils/api';
import MachineCard from '../../components/MachineCard';
import { RefreshCw } from 'lucide-react';

const MyMachines = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await ownerAPI.getMachines();
      setMachines(response.data.machines);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMachines();
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Machines</h1>
          <p className="text-gray-600 mt-1">Manage your vending machines</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map((machine) => (
          <MachineCard key={machine._id} machine={machine} />
        ))}
      </div>

      {machines.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No machines assigned to you yet. Contact admin to add machines.</p>
        </div>
      )}
    </div>
  );
};

export default MyMachines;
