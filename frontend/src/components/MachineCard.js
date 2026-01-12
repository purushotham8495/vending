import React from 'react';
import { Link } from 'react-router-dom';
import { Wifi, WifiOff, Play, Square } from 'lucide-react';

const MachineCard = ({ machine }) => {
  const isOnline = machine.status !== 'OFFLINE';
  const isRunning = machine.status === 'RUNNING';

  const statusColors = {
    IDLE: 'bg-green-100 text-green-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    OFFLINE: 'bg-gray-100 text-gray-800',
  };

  return (
    <Link
      to={`/machine/${machine._id}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{machine.machineId}</h3>
          <p className="text-sm text-gray-600">{machine.location}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="text-green-500" size={20} />
          ) : (
            <WifiOff className="text-gray-400" size={20} />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[machine.status]}`}>
            {machine.status}
          </span>
        </div>

        {isRunning && machine.currentSequence && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Play size={16} />
            <span>Step {machine.currentStep} of sequence</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Price</span>
          <span className="font-semibold text-gray-900">₹{machine.fixedPrice}</span>
        </div>

        {machine.lastHeartbeat && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last seen</span>
            <span className="text-xs text-gray-500">
              {new Date(machine.lastHeartbeat).toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-600">Firmware</span>
          <span className="text-xs text-gray-500">{machine.firmwareVersion}</span>
        </div>
      </div>

      {machine.processLocked && (
        <div className="mt-4 flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          <Square size={16} />
          <span>Process locked</span>
        </div>
      )}
    </Link>
  );
};

export default MachineCard;
