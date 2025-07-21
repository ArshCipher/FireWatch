/**
 * 🔥 Firefighter Onboarding Dashboard
 * 
 * Comprehensive registration system for firefighters with all required details
 * Evidence-based data collection for personalized monitoring thresholds
 * Based on Zhang et al. (2021) research and NIOSH/NFPA guidelines
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface FirefighterProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  badgeNumber: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  
  // Professional Information
  department: string;
  station: string;
  rank: string;
  shift: string;
  yearsExperience: number;
  yearsOfService: number;
  certifications: string[];
  
  // Physical/Health Information (Evidence-based)
  height: number; // cm
  weight: number; // kg
  restingHeartRate: number;
  baselineHeartRate: number;
  maxHeartRate: number; // calculated: 208 - 0.7 × age (Zhang et al. formula)
  baselineTemperature: number; // °C
  baselineHRV: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Medical Information
  medicalConditions: string[];
  medications: string[];
  allergies: string[];
  lastPhysicalExam: string;
  lastPhysical: string;
  medicalClearance: boolean;
  medicalRestrictions: string;
  fitnessLevel: 'poor' | 'fair' | 'good' | 'excellent' | 'elite';
  baselineHRV: number;
  
  // Equipment Information
  helmetId?: string;
  helmetType?: string;
  scbaId?: string;
  scbaModel?: string;
  sensorIds: {
    heartRate?: string;
    temperature?: string;
    accelerometer?: string;
  };
  equipmentSize: {
    helmet: string;
    jacket: string;
    pants: string;
    boots: string;
    gloves: string;
  };
  
  // Training Information
  lastTraining: string;
}

const OnboardingDashboard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FirefighterProfile>>({});
  const queryClient = useQueryClient();

  // Calculate age-predicted max heart rate
  const calculateMaxHeartRate = (dateOfBirth: string): number => {
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    return Math.round(208 - 0.7 * age);
  };

  const createFirefighterMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('📡 Sending to backend:', data);
      const response = await fetch('http://localhost:3004/api/firefighters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        throw new Error(`Failed to create firefighter: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Firefighter created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['firefighters'] });
      alert('Firefighter profile created successfully!');
      setFormData({});
      setCurrentStep(1);
    },
    onError: (error: any) => {
      console.error('❌ Mutation error:', error);
      alert(`Error: ${error.message}`);
    }
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate max heart rate when DOB changes
    if (field === 'dateOfBirth' && value) {
      const maxHR = calculateMaxHeartRate(value);
      setFormData(prev => ({ ...prev, maxHeartRate: maxHR }));
    }
  };

  const handleSubmit = () => {
    // Map form data to match backend validation requirements
    const backendData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      height: formData.height,
      weight: formData.weight,
      badgeNumber: formData.badgeNumber,
      department: formData.department,
      station: formData.station,
      rank: formData.rank || 'Firefighter',
      shift: formData.shift,
      yearsOfService: formData.yearsOfService || 0,
      fitnessLevel: formData.fitnessLevel || 'good',
      // System defaults - using valid ObjectId format for createdBy
      createdBy: '507f1f77bcf86cd799439011', // Valid ObjectId for system user
      isActive: true,
      // Optional fields
      medicalClearance: formData.medicalClearance || false,
      allergies: formData.allergies || '',
      medications: formData.medications || '',
      medicalRestrictions: formData.medicalRestrictions || '',
    };

    console.log('🚀 Submitting firefighter data:', backendData);
    createFirefighterMutation.mutate(backendData as any);
  };

  const steps = [
    { title: 'Personal Info', icon: '👤' },
    { title: 'Medical Info', icon: '🏥' },
    { title: 'Department', icon: '🚒' },
    { title: 'Baselines', icon: '📊' },
    { title: 'Equipment', icon: '🛡️' },
    { title: 'Review', icon: '✅' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏥 Firefighter Onboarding</h1>
        <p className="text-gray-600 mt-2">Complete registration for safety monitoring system</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                index + 1 <= currentStep 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {step.icon}
              </div>
              <span className={`text-sm mt-2 ${
                index + 1 <= currentStep ? 'text-red-600' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-red-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Badge Number *</label>
                <input
                  type="text"
                  value={formData.badgeNumber || ''}
                  onChange={(e) => updateFormData('badgeNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
                {formData.dateOfBirth && (
                  <p className="text-sm text-gray-600 mt-1">
                    Age-predicted Max HR: {calculateMaxHeartRate(formData.dateOfBirth)} bpm
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm) *</label>
                <input
                  type="number"
                  min="150"
                  max="220"
                  value={formData.height || ''}
                  onChange={(e) => updateFormData('height', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg) *</label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={formData.weight || ''}
                  onChange={(e) => updateFormData('weight', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Medical Information</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="medicalClearance"
                  checked={formData.medicalClearance || false}
                  onChange={(e) => updateFormData('medicalClearance', e.target.checked)}
                  className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="medicalClearance" className="text-sm font-medium text-gray-700">
                  Current medical clearance for firefighting duties *
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Physical Exam Date</label>
                <input
                  type="date"
                  value={formData.lastPhysical || ''}
                  onChange={(e) => updateFormData('lastPhysical', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical Restrictions</label>
                <textarea
                  value={formData.medicalRestrictions || ''}
                  onChange={(e) => updateFormData('medicalRestrictions', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Any medical restrictions or conditions..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                <textarea
                  value={formData.allergies || ''}
                  onChange={(e) => updateFormData('allergies', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                  placeholder="List any known allergies..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                <textarea
                  value={formData.medications || ''}
                  onChange={(e) => updateFormData('medications', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                  placeholder="List current medications..."
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">🚒 Department Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => updateFormData('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Metro Fire Department"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Station *</label>
                <input
                  type="text"
                  value={formData.station || ''}
                  onChange={(e) => updateFormData('station', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Station 12"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rank</label>
                <select
                  value={formData.rank || ''}
                  onChange={(e) => updateFormData('rank', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Rank</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Firefighter">Firefighter</option>
                  <option value="Driver/Operator">Driver/Operator</option>
                  <option value="Lieutenant">Lieutenant</option>
                  <option value="Captain">Captain</option>
                  <option value="Battalion Chief">Battalion Chief</option>
                  <option value="Deputy Chief">Deputy Chief</option>
                  <option value="Fire Chief">Fire Chief</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift *</label>
                <select
                  value={formData.shift || ''}
                  onChange={(e) => updateFormData('shift', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select Shift</option>
                  <option value="A">A Shift</option>
                  <option value="B">B Shift</option>
                  <option value="C">C Shift</option>
                  <option value="D">D Shift</option>
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Service</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsOfService || ''}
                  onChange={(e) => updateFormData('yearsOfService', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Years of service"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Level</label>
                <select
                  value={formData.fitnessLevel || ''}
                  onChange={(e) => updateFormData('fitnessLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Fitness Level</option>
                  <option value="poor">Poor</option>
                  <option value="fair">Fair</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">📊 Baseline Measurements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Baseline Heart Rate (bpm)</label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  value={formData.baselineHeartRate || ''}
                  onChange={(e) => updateFormData('baselineHeartRate', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Baseline Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  min="35"
                  max="38"
                  value={formData.baselineTemperature || ''}
                  onChange={(e) => updateFormData('baselineTemperature', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="37.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HRV (ms)</label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={formData.baselineHRV || ''}
                  onChange={(e) => updateFormData('baselineHRV', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="40"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">🛡️ Equipment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SCBA Model</label>
                <input
                  type="text"
                  value={formData.scbaModel || ''}
                  onChange={(e) => updateFormData('scbaModel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Scott X3 Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Helmet Type</label>
                <input
                  type="text"
                  value={formData.helmetType || ''}
                  onChange={(e) => updateFormData('helmetType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Traditional, Metro"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">✅ Review Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                <div><strong>Badge:</strong> {formData.badgeNumber}</div>
                <div><strong>Department:</strong> {formData.department}</div>
                <div><strong>Station:</strong> {formData.station}</div>
                <div><strong>Shift:</strong> {formData.shift}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Phone:</strong> {formData.phone}</div>
                <div><strong>Rank:</strong> {formData.rank}</div>
              </div>
            </div>
          </div>
        )}

        {/* Continue with other steps... */}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createFirefighterMutation.isPending}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {createFirefighterMutation.isPending ? 'Creating...' : 'Complete Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingDashboard;
