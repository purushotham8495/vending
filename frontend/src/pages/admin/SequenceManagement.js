import React, { useEffect, useState } from 'react';
import { sequenceAPI } from '../../utils/api';
import { Plus, Edit, Trash2, Star } from 'lucide-react';

const SequenceManagement = () => {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    steps: [],
    isDefault: false
  });
  const [editingSequence, setEditingSequence] = useState(null);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const response = await sequenceAPI.getAll();
      setSequences(response.data.sequences);
    } catch (error) {
      console.error('Failed to fetch sequences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { stepNumber: formData.steps.length + 1, gpioName: '', onTime: 0, offTime: 0 }]
    });
  };

  const handleRemoveStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      steps: newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }))
    });
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index][field] = field === 'gpioName' ? value : Number(value);
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSequence) {
        await sequenceAPI.update(editingSequence._id, formData);
      } else {
        await sequenceAPI.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchSequences();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (sequence) => {
    setEditingSequence(sequence);
    setFormData({
      name: sequence.name,
      description: sequence.description,
      steps: sequence.steps,
      isDefault: sequence.isDefault
    });
    setShowModal(true);
  };

  const handleDelete = async (sequenceId) => {
    if (!window.confirm('Delete this sequence? This cannot be undone.')) return;
    
    try {
      await sequenceAPI.delete(sequenceId);
      fetchSequences();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete sequence');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', steps: [], isDefault: false });
    setEditingSequence(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Sequence Management</h1>
          <p className="text-gray-600 mt-1">Define cleaning sequences for machines</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus size={20} />
          Create Sequence
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sequences.map((sequence) => (
          <div key={sequence._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{sequence.name}</h3>
                  {sequence.isDefault && (
                    <Star className="text-yellow-500 fill-yellow-500" size={16} />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{sequence.description}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Steps:</span>
                <span className="font-medium">{sequence.steps.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Duration:</span>
                <span className="font-medium">{sequence.totalDuration}s</span>
              </div>
            </div>

            <details className="mb-4">
              <summary className="text-sm text-primary-600 cursor-pointer">
                View Steps
              </summary>
              <div className="mt-2 space-y-2">
                {sequence.steps.map((step) => (
                  <div key={step.stepNumber} className="text-sm bg-gray-50 p-2 rounded">
                    <span className="font-medium">Step {step.stepNumber}:</span> {step.gpioName} - {step.onTime}s
                  </div>
                ))}
              </div>
            </details>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(sequence)}
                className="flex-1 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100"
              >
                <Edit size={16} className="inline mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(sequence._id)}
                className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <Trash2 size={16} className="inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingSequence ? 'Edit Sequence' : 'Create New Sequence'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sequence Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="2"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  Set as default sequence
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sequence Steps
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add Step
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded">
                      <span className="font-medium text-sm mt-2">{index + 1}.</span>
                      <input
                        type="text"
                        placeholder="GPIO Name"
                        value={step.gpioName}
                        onChange={(e) => handleStepChange(index, 'gpioName', e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        required
                      />
                      <input
                        type="number"
                        placeholder="ON (s)"
                        value={step.onTime}
                        onChange={(e) => handleStepChange(index, 'onTime', e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        min="0"
                        required
                      />
                      <input
                        type="number"
                        placeholder="OFF (s)"
                        value={step.offTime}
                        onChange={(e) => handleStepChange(index, 'offTime', e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="text-red-600 hover:text-red-700 mt-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                >
                  {editingSequence ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
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

export default SequenceManagement;
