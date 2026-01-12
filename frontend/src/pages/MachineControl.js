import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { machineAPI, controlAPI, sequenceAPI } from '../utils/api';
import { 
  ArrowLeft, Power, RefreshCw, Play, Square, 
  Activity, Zap, ToggleLeft, ToggleRight,
  Wifi, WifiOff, Clock, AlertCircle, CheckCircle,
  Loader
} from 'lucide-react';

const MachineControl = () => {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [executionProgress, setExecutionProgress] = useState(null);

  useEffect(() => {
    fetchMachineData();
    fetchSequences();
    const interval = setInterval(fetchMachineData, 2000); // Refresh every 2s
    return () => clearInterval(interval);
  }, [machineId]);

  const fetchMachineData = async () => {
    try {
      const response = await machineAPI.getMachine(machineId);
      setMachine(response.data.machine);
    } catch (error) {
      console.error('Failed to fetch machine:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSequences = async () => {
    try {
      const response = await sequenceAPI.getSequences();
      setSequences(response.data.sequences);
    } catch (error) {
      console.error('Failed to fetch sequences:', error);
    }
  };

  const handleGPIOToggle = async (gpioId, currentState) => {
    try {
      await controlAPI.toggleGPIO(machineId, gpioId);
      fetchMachineData(); // Refresh to show new state
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle GPIO');
    }
  };

  const handleGPIOPulse = async (gpioId, duration) => {
    try {
      await controlAPI.pulseGPIO(machineId, gpioId, duration);
      alert(`GPIO pulsed for ${duration}ms`);
      fetchMachineData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to pulse GPIO');
    }
  };

  const handleRestartESP = async () => {
    if (!window.confirm('Are you sure you want to restart the ESP32? Machine will be offline for a few seconds.')) {
      return;
    }
    
    try {
      await controlAPI.restartESP(machineId);
      alert('Restart command sent. ESP32 will reboot in a few seconds.');
      setTimeout(fetchMachineData, 5000); // Refresh after 5s
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to restart ESP32');
    }
  };

  const handleExecuteSequence = async () => {
    if (!selectedSequence) {
      alert('Please select a sequence first');
      return;
    }

    setExecuting(true);
    setExecutionProgress({ currentStep: 0, totalSteps: selectedSequence.steps.length, status: 'running' });

    try {
      // Start sequence execution
      await controlAPI.startSequence(machineId, selectedSequence._id);
      
      // Monitor execution progress
      const progressInterval = setInterval(async () => {
        const status = await controlAPI.getStatus(machineId);
        const machineData = status.data.machine;
        
        if (machineData.status === 'IDLE') {
          clearInterval(progressInterval);
          setExecuting(false);
          setExecutionProgress({ ...executionProgress, status: 'completed' });
          fetchMachineData();
        }
      }, 1000);

    } catch (error) {
      alert(error.response?.data?.message || 'Failed to execute sequence');
      setExecuting(false);
      setExecutionProgress({ ...executionProgress, status: 'failed' });
    }
  };

  const handleEmergencyStop = async () => {
    if (!window.confirm('Emergency stop will immediately halt all operations. Continue?')) {
      return;
    }

    try {
      await controlAPI.emergencyStop(machineId);
      alert('Emergency stop executed');
      setExecuting(false);
      setExecutionProgress(null);
      fetchMachineData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to stop machine');
    }
  };

  const getGPIOStatusColor = (state) => {
    // For relay: HIGH = OFF, LOW = ON
    return state === 'ON' ? 'bg-green-500' : 'bg-gray-400';
  };

  const getGPIOStatusText = (state) => {
    // For relay: HIGH = OFF, LOW = ON
    return state === 'ON' ? 'ACTIVE (LOW)' : 'INACTIVE (HIGH)';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Machine not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{machine.machineId}</h1>
            <p className="text-gray-600">{machine.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {machine.status !== 'OFFLINE' ? (
              <Wifi className="text-green-500" size={24} />
            ) : (
              <WifiOff className="text-gray-400" size={24} />
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              machine.status === 'IDLE' ? 'bg-green-100 text-green-800' :
              machine.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {machine.status}
            </span>
          </div>
          <button
            onClick={handleRestartESP}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            disabled={machine.status === 'RUNNING'}
          >
            <RefreshCw size={20} />
            Restart ESP32
          </button>
        </div>
      </div>

      {/* Machine Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-blue-600" size={20} />
            <span className="text-sm text-gray-600">Status</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{machine.status}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-green-600" size={20} />
            <span className="text-sm text-gray-600">Last Heartbeat</span>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {machine.lastHeartbeat ? new Date(machine.lastHeartbeat).toLocaleTimeString() : 'Never'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-purple-600" size={20} />
            <span className="text-sm text-gray-600">Firmware</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{machine.firmwareVersion}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-orange-600" size={20} />
            <span className="text-sm text-gray-600">GPIOs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{machine.gpios?.length || 0}</p>
        </div>
      </div>

      {/* GPIO Control Panel */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">GPIO Control Panel</h2>
          <p className="text-sm text-gray-600 mt-1">
            Control individual GPIO pins (Note: HIGH = Relay OFF, LOW = Relay ON)
          </p>
        </div>
        <div className="p-6">
          {machine.gpios && machine.gpios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machine.gpios.map((gpio) => (
                <div
                  key={gpio._id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  {/* GPIO Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{gpio.gpioName}</h3>
                      <p className="text-xs text-gray-500">Pin: {gpio.gpioNumber}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${getGPIOStatusColor(gpio.currentState)}`}></div>
                  </div>

                  {/* Current State */}
                  <div className="mb-3 p-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">State:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {getGPIOStatusText(gpio.currentState)}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-2">
                    {/* Toggle Button */}
                    <button
                      onClick={() => handleGPIOToggle(gpio._id, gpio.currentState)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        gpio.currentState === 'ON' 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                      disabled={machine.status === 'RUNNING'}
                    >
                      {gpio.currentState === 'ON' ? (
                        <>
                          <ToggleRight size={20} />
                          Turn OFF
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={20} />
                          Turn ON
                        </>
                      )}
                    </button>

                    {/* Pulse Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGPIOPulse(gpio._id, 1000)}
                        className="flex-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-100"
                        disabled={machine.status === 'RUNNING'}
                      >
                        Pulse 1s
                      </button>
                      <button
                        onClick={() => handleGPIOPulse(gpio._id, 3000)}
                        className="flex-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-100"
                        disabled={machine.status === 'RUNNING'}
                      >
                        Pulse 3s
                      </button>
                      <button
                        onClick={() => handleGPIOPulse(gpio._id, 5000)}
                        className="flex-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-100"
                        disabled={machine.status === 'RUNNING'}
                      >
                        Pulse 5s
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No GPIOs configured for this machine</p>
            </div>
          )}
        </div>
      </div>

      {/* Sequence Execution */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Sequence Execution</h2>
          <p className="text-sm text-gray-600 mt-1">Execute predefined sequences step by step</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sequence Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Sequence
              </label>
              <select
                value={selectedSequence?._id || ''}
                onChange={(e) => {
                  const seq = sequences.find(s => s._id === e.target.value);
                  setSelectedSequence(seq);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-4"
                disabled={executing}
              >
                <option value="">Choose a sequence...</option>
                {sequences.map((seq) => (
                  <option key={seq._id} value={seq._id}>
                    {seq.name} ({seq.totalDuration}ms)
                  </option>
                ))}
              </select>

              {selectedSequence && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Sequence Steps:</h3>
                  <div className="space-y-2">
                    {selectedSequence.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-gray-900">Step {step.stepNumber}</span>
                          <p className="text-sm text-gray-600">{step.gpioId}</p>
                        </div>
                        <span className="text-sm font-mono text-gray-700">
                          {step.duration}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleExecuteSequence}
                  disabled={!selectedSequence || executing || machine.status === 'RUNNING'}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {executing ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      Execute Sequence
                    </>
                  )}
                </button>
                {machine.status === 'RUNNING' && (
                  <button
                    onClick={handleEmergencyStop}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium"
                  >
                    <Square size={20} />
                    STOP
                  </button>
                )}
              </div>
            </div>

            {/* Execution Progress */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Execution Status</h3>
              <div className="border-2 border-gray-200 rounded-lg p-4">
                {executionProgress ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`flex items-center gap-2 font-medium ${
                        executionProgress.status === 'running' ? 'text-blue-600' :
                        executionProgress.status === 'completed' ? 'text-green-600' :
                        'text-red-600'
                      }`}>
                        {executionProgress.status === 'running' && <Loader className="animate-spin" size={16} />}
                        {executionProgress.status === 'completed' && <CheckCircle size={16} />}
                        {executionProgress.status === 'failed' && <AlertCircle size={16} />}
                        {executionProgress.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">
                          {executionProgress.currentStep} / {executionProgress.totalSteps} steps
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(executionProgress.currentStep / executionProgress.totalSteps) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No sequence running</p>
                    <p className="text-sm text-gray-500 mt-1">Select and execute a sequence to see progress</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      {machine.status === 'RUNNING' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600" size={24} />
            <div>
              <p className="font-medium text-yellow-800">Machine is currently running</p>
              <p className="text-sm text-yellow-700">
                Manual GPIO controls are disabled. Use Emergency Stop to halt operations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineControl;
