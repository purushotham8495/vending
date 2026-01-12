import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, controlAPI } from '../../utils/api';
import { 
  ArrowLeft, User, Phone, Mail, Calendar, 
  TrendingUp, DollarSign, Cpu, Activity,
  Plus, Trash2, Power, Wifi, WifiOff, Play, Square,
  AlertCircle
} from 'lucide-react';

const OwnerDetail = () => {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [machines, setMachines] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [machineForm, setMachineForm] = useState({
    machineId: '',
    location: '',
    fixedPrice: ''
  });

  useEffect(() => {
    fetchOwnerDetails();
    const interval = setInterval(fetchOwnerDetails, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [ownerId]);

  const fetchOwnerDetails = async () => {
    try {
      const response = await adminAPI.getOwnerDetails(ownerId);
      setOwner(response.data.owner);
      setMachines(response.data.machines);
      setTransactions(response.data.recentTransactions);
    } catch (error) {
      console.error('Failed to fetch owner details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addMachineToOwner(ownerId, machineForm);
      setShowAddMachine(false);
      setMachineForm({ machineId: '', location: '', fixedPrice: '' });
      fetchOwnerDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add machine');
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (!window.confirm('Are you sure you want to delete this machine?')) return;
    
    try {
      await adminAPI.deleteMachineFromOwner(ownerId, machineId);
      fetchOwnerDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete machine');
    }
  };

  const handleEmergencyStop = async (machineId) => {
    if (!window.confirm('Emergency stop this machine?')) return;
    
    try {
      await controlAPI.emergencyStop(machineId);
      alert('Emergency stop executed');
      fetchOwnerDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to stop machine');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'IDLE': return 'bg-green-100 text-green-800';
      case 'RUNNING': return 'bg-blue-100 text-blue-800';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Owner not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/owners')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{owner.name}</h1>
          <p className="text-gray-600">Owner Details & Machine Management</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          owner.status === 'active' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {owner.status}
        </span>
      </div>

      {/* Owner Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900">Contact</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-gray-400" />
              <span className="text-gray-700">{owner.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-gray-400" />
              <span className="text-gray-700">{owner.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-gray-700">
                Joined {new Date(owner.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Machines */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Cpu size={32} />
            <div className="text-right">
              <p className="text-purple-100 text-sm">Total Machines</p>
              <p className="text-4xl font-bold">{owner.totalMachines}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Wifi size={14} /> {owner.activeMachines} online
            </span>
            <span className="flex items-center gap-1">
              <WifiOff size={14} /> {owner.totalMachines - owner.activeMachines} offline
            </span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign size={32} />
            <div className="text-right">
              <p className="text-green-100 text-sm">Total Revenue</p>
              <p className="text-4xl font-bold">₹{owner.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-sm text-green-100">
            {owner.totalTransactions} transactions
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp size={32} />
            <div className="text-right">
              <p className="text-orange-100 text-sm">Today's Revenue</p>
              <p className="text-4xl font-bold">₹{owner.todayRevenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-sm text-orange-100">
            Updated in real-time
          </div>
        </div>
      </div>

      {/* Machines Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Machines</h2>
            <button
              onClick={() => setShowAddMachine(true)}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              <Plus size={20} />
              Add Machine
            </button>
          </div>
        </div>

        <div className="p-6">
          {machines.length === 0 ? (
            <div className="text-center py-12">
              <Cpu size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No machines yet. Add the first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.map((machine) => (
                <div
                  key={machine._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Machine Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{machine.machineId}</h3>
                      <p className="text-sm text-gray-600">{machine.location}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {machine.status !== 'OFFLINE' ? (
                        <Wifi className="text-green-500" size={20} />
                      ) : (
                        <WifiOff className="text-gray-400" size={20} />
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(machine.status)}`}>
                      {machine.status}
                    </span>
                  </div>

                  {/* Machine Info */}
                  <div className="space-y-2 mb-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price</span>
                      <span className="font-semibold">₹{machine.fixedPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Firmware</span>
                      <span className="text-gray-900">{machine.firmwareVersion}</span>
                    </div>
                    {machine.lastHeartbeat && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last seen</span>
                        <span className="text-gray-900">
                          {new Date(machine.lastHeartbeat).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/machine/${machine._id}`)}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium"
                    >
                      View Details
                    </button>
                    {machine.status === 'RUNNING' && (
                      <button
                        onClick={() => handleEmergencyStop(machine._id)}
                        className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100"
                        title="Emergency Stop"
                      >
                        <Power size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMachine(machine._id)}
                      className="bg-gray-50 text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                      title="Delete Machine"
                      disabled={machine.status === 'RUNNING'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {machine.processLocked && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                      <AlertCircle size={14} />
                      <span>Process locked</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Activity size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.machine?.machineId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.machine?.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{transaction.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Machine Modal */}
      {showAddMachine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Machine</h2>
            <form onSubmit={handleAddMachine} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machine ID
                </label>
                <input
                  type="text"
                  value={machineForm.machineId}
                  onChange={(e) => setMachineForm({ ...machineForm, machineId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., VM001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={machineForm.location}
                  onChange={(e) => setMachineForm({ ...machineForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Building A, Floor 2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fixed Price (₹)
                </label>
                <input
                  type="number"
                  value={machineForm.fixedPrice}
                  onChange={(e) => setMachineForm({ ...machineForm, fixedPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 20"
                  required
                  min="0"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                >
                  Add Machine
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMachine(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDetail;
