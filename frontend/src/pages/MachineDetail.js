import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { machineAPI, controlAPI, gpioAPI, sequenceAPI } from '../utils/api';
import { Wifi, WifiOff, AlertTriangle, Play, Power } from 'lucide-react';

const MachineDetail = () => {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [status, setStatus] = useState(null);
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachineData();
    const interval = setInterval(fetchStatus, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [machineId]);

  const fetchMachineData = async () => {
    try {
      const [machineRes, sequencesRes] = await Promise.all([
        machineAPI.getOne(machineId),
        sequenceAPI.getAll()
      ]);
      setMachine(machineRes.data.machine);
      setSequences(sequencesRes.data.sequences);
      fetchStatus();
    } catch (error) {
      console.error('Failed to fetch machine:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await controlAPI.getStatus(machineId);
      setStatus(response.data.status);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const handleEmergencyStop = async () => {
    if (!window.confirm('Emergency stop will halt all operations. Continue?')) return;
    
    try {
      await controlAPI.emergencyStop(machineId);
      fetchMachineData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to execute emergency stop');
    }
  };

  const handleStartSequence = async (sequenceId) => {
    try {
      await controlAPI.startSequence(machineId, sequenceId);
      fetchMachineData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start sequence');
    }
  };

  const handleToggleGPIO = async (gpioId, currentState) => {
    const newState = currentState === 'ON' ? 'OFF' : 'ON';
    try {
      await gpioAPI.toggle(machineId, { gpioId, state: newState });
      fetchMachineData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle GPIO');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isOnline = machine?.status !== 'OFFLINE';
  const isLocked = machine?.processLocked;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{machine?.machineId}</h1>
            <p className="text-gray-600 mt-1">{machine?.location}</p>
          </div>
          <div className="flex items-center gap-4">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-600">
                <Wifi size={20} />
                <span className="font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <WifiOff size={20} />
                <span className="font-medium">Offline</span>
              </div>
            )}
            <button
              onClick={() => navigate(`/machine/${machineId}/control`)}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              <Power size={20} />
              Advanced Control
            </button>
            <button
              onClick={handleEmergencyStop}
              disabled={!isOnline || !isLocked}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle size={20} />
              Emergency Stop
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Machine Status</p>
              <p className="font-semibold">{status.machineStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Process</p>
              <p className="font-semibold">{isLocked ? 'Locked' : 'Unlocked'}</p>
            </div>
            {status.currentSequence && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Current Sequence</p>
                  <p className="font-semibold">{status.currentSequence.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Step</p>
                  <p className="font-semibold">{status.currentStep}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* GPIO Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">GPIO Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machine?.gpios?.map((gpio) => (
            <div key={gpio._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">{gpio.gpioName}</p>
                  <p className="text-sm text-gray-600">Pin {gpio.gpioNumber}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  gpio.currentState === 'ON' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {gpio.currentState}
                </span>
              </div>
              <button
                onClick={() => handleToggleGPIO(gpio._id, gpio.currentState)}
                disabled={!isOnline || isLocked}
                className={`w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  gpio.currentState === 'ON'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Power size={16} className="inline mr-2" />
                Turn {gpio.currentState === 'ON' ? 'OFF' : 'ON'}
              </button>
            </div>
          ))}
        </div>
        {machine?.gpios?.length === 0 && (
          <p className="text-gray-600 text-center py-4">No GPIOs configured</p>
        )}
      </div>

      {/* Manual Sequence Control */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Start Sequence (Testing)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((seq) => (
            <button
              key={seq._id}
              onClick={() => handleStartSequence(seq._id)}
              disabled={!isOnline || isLocked}
              className="p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{seq.name}</p>
                <Play size={20} className="text-primary-600" />
              </div>
              <p className="text-sm text-gray-600">{seq.steps.length} steps</p>
              <p className="text-sm text-gray-600">{seq.totalDuration}s duration</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MachineDetail;
