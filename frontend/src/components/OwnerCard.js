import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Cpu, TrendingUp, DollarSign, Wifi, WifiOff } from 'lucide-react';

const OwnerCard = ({ owner }) => {
  const activePercentage = owner.totalMachines > 0 
    ? Math.round((owner.activeMachines / owner.totalMachines) * 100) 
    : 0;

  return (
    <Link
      to={`/admin/owners/${owner._id}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-primary-500"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 p-3 rounded-full">
            <Users className="text-primary-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{owner.name}</h3>
            <p className="text-sm text-gray-500">{owner.phoneNumber}</p>
            <p className="text-xs text-gray-400">{owner.email}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          owner.status === 'active' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {owner.status}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Machines */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={16} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Machines</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{owner.totalMachines}</span>
            <div className="flex items-center gap-1 text-xs">
              <Wifi size={12} className="text-green-500" />
              <span className="text-green-600 font-medium">{owner.activeMachines}</span>
              <WifiOff size={12} className="text-gray-400 ml-1" />
              <span className="text-gray-500">{owner.totalMachines - owner.activeMachines}</span>
            </div>
          </div>
          {owner.totalMachines > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${activePercentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-1">{activePercentage}% online</span>
            </div>
          )}
        </div>

        {/* Total Revenue */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-green-600" />
            <span className="text-xs text-green-600 font-medium">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{owner.totalEarnings.toLocaleString()}</div>
        </div>
      </div>

      {/* Today's Revenue */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-600" />
            <span className="text-sm text-primary-700 font-medium">Today's Revenue</span>
          </div>
          <span className="text-xl font-bold text-primary-900">₹{owner.todayEarnings.toLocaleString()}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <span className="text-sm text-primary-600 font-medium hover:text-primary-700">
          View Details →
        </span>
      </div>
    </Link>
  );
};

export default OwnerCard;
