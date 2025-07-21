/**
 * 🔥 Comprehensive Firefighter Onboarding Dashboard
 * 
 * Scientific evidence-based registration system with personalized thresholds
 * Based on Zhang et al. (2021) research and NIOSH/NFPA guidelines
 */

import React, { useState } from 'react';

interface FirefighterProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  badgeNumber: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  
  // Professional Information
  department: string;
  station: string;
  rank: string;
  yearsExperience: number;
  
  // Physical/Health Information (Evidence-based)
  height: number; // cm
  weight: number; // kg
  restingHeartRate: number;
  maxHeartRate: number; // calculated: 208 - 0.7 × age
  baselineTemperature: number; // °C
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
  medicalConditions: string;
  medications: string;
  allergies: string;
  lastPhysicalExam: string;
  fitnessLevel: 'poor' | 'fair' | 'good' | 'excellent' | 'elite';
}

const ComprehensiveOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<FirefighterProfile>({
    firstName: '',
    lastName: '',
    badgeNumber: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    age: 0,
    department: '',
    station: '',
    rank: '',
    yearsExperience: 0,
    height: 0,
    weight: 0,
    restingHeartRate: 60,
    maxHeartRate: 0,
    baselineTemperature: 37.0,
    bloodPressure: { systolic: 120, diastolic: 80 },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    medicalConditions: '',
    medications: '',
    allergies: '',
    lastPhysicalExam: '',
    fitnessLevel: 'good'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Calculate age and max heart rate (Evidence-based formula)
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const updateProfile = (field: string, value: any) => {
    const newProfile = { ...profile, [field]: value };
    
    // Auto-calculate age and max heart rate when date of birth changes
    if (field === 'dateOfBirth' && value) {
      const age = calculateAge(value);
      newProfile.age = age;
      newProfile.maxHeartRate = Math.round(208 - 0.7 * age); // Zhang et al. formula
    }
    
    setProfile(newProfile);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: any = {};
    
    switch (step) {
      case 1: // Personal Information
        if (!profile.firstName) newErrors.firstName = 'First name is required';
        if (!profile.lastName) newErrors.lastName = 'Last name is required';
        if (!profile.badgeNumber) newErrors.badgeNumber = 'Badge number is required';
        if (!profile.email) newErrors.email = 'Email is required';
        if (!profile.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        break;
        
      case 2: // Professional Information
        if (!profile.department) newErrors.department = 'Department is required';
        if (!profile.rank) newErrors.rank = 'Rank is required';
        if (profile.yearsExperience < 0) newErrors.yearsExperience = 'Experience cannot be negative';
        break;
        
      case 3: // Health Information
        if (profile.height < 100 || profile.height > 250) newErrors.height = 'Height must be between 100-250 cm';
        if (profile.weight < 40 || profile.weight > 200) newErrors.weight = 'Weight must be between 40-200 kg';
        if (profile.restingHeartRate < 40 || profile.restingHeartRate > 120) {
          newErrors.restingHeartRate = 'Resting heart rate must be between 40-120 bpm';
        }
        break;
        
      case 4: // Emergency Contact
        if (!profile.emergencyContact.name) newErrors.emergencyContactName = 'Emergency contact name is required';
        if (!profile.emergencyContact.phone) newErrors.emergencyContactPhone = 'Emergency contact phone is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3003/api/firefighters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...profile,
          status: 'active',
          monitoringThresholds: {
            // Evidence-based thresholds from Zhang et al.
            heartRate: {
              normal: 150, // <150 bpm sustained <10 min
              moderate: 185, // 150-184 bpm sustained >10 min
              high: Math.round(profile.maxHeartRate * 0.9), // 90% max for >5 min
              critical: Math.round(profile.maxHeartRate * 0.95) // 95% max for >1 min
            },
            temperature: {
              normal: 38.0, // 37.5-38.0°C
              moderate: 38.4, // 38.0-38.4°C
              high: 38.9, // 38.5-38.9°C
              critical: 39.0 // ≥39.0°C
            },
            movement: {
              fallThreshold: 20, // >20g fall detection
              inactivityThreshold: 60 // >60s inactivity
            }
          }
        })
      });
      
      if (response.ok) {
        alert('Firefighter registered successfully with personalized thresholds!');
        setCurrentStep(6); // Success step
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => updateProfile('firstName', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => updateProfile('lastName', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Badge Number *</label>
                <input
                  type="text"
                  value={profile.badgeNumber}
                  onChange={(e) => updateProfile('badgeNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Enter badge number"
                />
                {errors.badgeNumber && <p className="text-red-500 text-sm">{errors.badgeNumber}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateProfile('email', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => updateProfile('phone', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                <input
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => updateProfile('dateOfBirth', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
                {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>}
              </div>
            </div>
            
            {profile.age > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">📊 Calculated Physiological Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700"><strong>Age:</strong> {profile.age} years</p>
                    <p className="text-blue-700"><strong>Max Heart Rate:</strong> {profile.maxHeartRate} bpm</p>
                  </div>
                  <div>
                    <p className="text-blue-700"><strong>Formula:</strong> 208 - 0.7 × age</p>
                    <p className="text-blue-600 text-xs">Evidence-based calculation (Zhang et al.)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department *</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => updateProfile('department', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="e.g., Fire Department"
                />
                {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Station</label>
                <input
                  type="text"
                  value={profile.station}
                  onChange={(e) => updateProfile('station', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="e.g., Station 12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Rank *</label>
                <select
                  value={profile.rank}
                  onChange={(e) => updateProfile('rank', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="">Select rank</option>
                  <option value="Probationary Firefighter">Probationary Firefighter</option>
                  <option value="Firefighter">Firefighter</option>
                  <option value="Driver/Engineer">Driver/Engineer</option>
                  <option value="Lieutenant">Lieutenant</option>
                  <option value="Captain">Captain</option>
                  <option value="Battalion Chief">Battalion Chief</option>
                  <option value="Assistant Chief">Assistant Chief</option>
                  <option value="Fire Chief">Fire Chief</option>
                </select>
                {errors.rank && <p className="text-red-500 text-sm">{errors.rank}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={profile.yearsExperience}
                  onChange={(e) => updateProfile('yearsExperience', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
                {errors.yearsExperience && <p className="text-red-500 text-sm">{errors.yearsExperience}</p>}
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Health & Physical Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Height (cm) *</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={profile.height}
                  onChange={(e) => updateProfile('height', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="e.g., 175"
                />
                {errors.height && <p className="text-red-500 text-sm">{errors.height}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight (kg) *</label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={profile.weight}
                  onChange={(e) => updateProfile('weight', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="e.g., 75"
                />
                {errors.weight && <p className="text-red-500 text-sm">{errors.weight}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Resting Heart Rate (bpm) *</label>
                <input
                  type="number"
                  min="40"
                  max="120"
                  value={profile.restingHeartRate}
                  onChange={(e) => updateProfile('restingHeartRate', parseInt(e.target.value) || 60)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="e.g., 65"
                />
                {errors.restingHeartRate && <p className="text-red-500 text-sm">{errors.restingHeartRate}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Baseline Temperature (°C)</label>
                <input
                  type="number"
                  min="35"
                  max="39"
                  step="0.1"
                  value={profile.baselineTemperature}
                  onChange={(e) => updateProfile('baselineTemperature', parseFloat(e.target.value) || 37.0)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="e.g., 37.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Pressure (Systolic)</label>
                <input
                  type="number"
                  min="80"
                  max="200"
                  value={profile.bloodPressure.systolic}
                  onChange={(e) => updateProfile('bloodPressure', {
                    ...profile.bloodPressure,
                    systolic: parseInt(e.target.value) || 120
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="e.g., 120"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Pressure (Diastolic)</label>
                <input
                  type="number"
                  min="40"
                  max="120"
                  value={profile.bloodPressure.diastolic}
                  onChange={(e) => updateProfile('bloodPressure', {
                    ...profile.bloodPressure,
                    diastolic: parseInt(e.target.value) || 80
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="e.g., 80"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Fitness Level</label>
                <select
                  value={profile.fitnessLevel}
                  onChange={(e) => updateProfile('fitnessLevel', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="poor">Poor</option>
                  <option value="fair">Fair</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">🔬 Evidence-Based Monitoring Thresholds</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <p><strong>Heart Rate Alerts:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Normal: &lt;150 bpm (&lt;10 min)</li>
                    <li>• High: {Math.round(profile.maxHeartRate * 0.9)} bpm (90% max, &gt;5 min)</li>
                    <li>• Critical: {Math.round(profile.maxHeartRate * 0.95)} bpm (95% max, &gt;1 min)</li>
                  </ul>
                </div>
                <div>
                  <p><strong>Temperature Alerts:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Normal: 37.5-38.0°C</li>
                    <li>• High: 38.5-38.9°C</li>
                    <li>• Critical: ≥39.0°C</li>
                  </ul>
                </div>
              </div>
              <p className="text-green-600 text-xs mt-2">
                Based on Zhang et al. (2021) and NIOSH/NFPA guidelines
              </p>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Emergency Contact & Medical</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Name *</label>
                <input
                  type="text"
                  value={profile.emergencyContact.name}
                  onChange={(e) => updateProfile('emergencyContact', {
                    ...profile.emergencyContact,
                    name: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Emergency contact name"
                />
                {errors.emergencyContactName && <p className="text-red-500 text-sm">{errors.emergencyContactName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                <select
                  value={profile.emergencyContact.relationship}
                  onChange={(e) => updateProfile('emergencyContact', {
                    ...profile.emergencyContact,
                    relationship: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="">Select relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Child</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                <input
                  type="tel"
                  value={profile.emergencyContact.phone}
                  onChange={(e) => updateProfile('emergencyContact', {
                    ...profile.emergencyContact,
                    phone: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Emergency contact phone"
                />
                {errors.emergencyContactPhone && <p className="text-red-500 text-sm">{errors.emergencyContactPhone}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
                <textarea
                  value={profile.medicalConditions}
                  onChange={(e) => updateProfile('medicalConditions', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Any medical conditions or allergies"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Medications</label>
                <textarea
                  value={profile.medications}
                  onChange={(e) => updateProfile('medications', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Current medications"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Physical Exam</label>
                <input
                  type="date"
                  value={profile.lastPhysicalExam}
                  onChange={(e) => updateProfile('lastPhysicalExam', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                    <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
                    <p><strong>Badge:</strong> {profile.badgeNumber}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Age:</strong> {profile.age} years</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Professional</h4>
                    <p><strong>Department:</strong> {profile.department}</p>
                    <p><strong>Rank:</strong> {profile.rank}</p>
                    <p><strong>Experience:</strong> {profile.yearsExperience} years</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Health Profile</h4>
                    <p><strong>Height:</strong> {profile.height} cm</p>
                    <p><strong>Weight:</strong> {profile.weight} kg</p>
                    <p><strong>Resting HR:</strong> {profile.restingHeartRate} bpm</p>
                    <p><strong>Max HR:</strong> {profile.maxHeartRate} bpm</p>
                    <p><strong>Fitness:</strong> {profile.fitnessLevel}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                    <p><strong>Name:</strong> {profile.emergencyContact.name}</p>
                    <p><strong>Phone:</strong> {profile.emergencyContact.phone}</p>
                    <p><strong>Relationship:</strong> {profile.emergencyContact.relationship}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">⚠️ Safety & Monitoring Agreement</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>✓ I understand my personalized monitoring thresholds are based on scientific evidence</li>
                <li>✓ I agree to wear monitoring equipment during all fire operations</li>
                <li>✓ I acknowledge that critical alerts will be sent to my emergency contact</li>
                <li>✓ I will report any equipment malfunctions immediately</li>
                <li>✓ I understand this system is designed to enhance my safety during operations</li>
              </ul>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="text-center space-y-6">
            <div className="text-green-500 text-6xl">✅</div>
            <h3 className="text-2xl font-bold text-gray-900">Registration Complete!</h3>
            <p className="text-gray-600 text-lg">
              Welcome to the Firefighter Monitoring System, {profile.firstName}!
            </p>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-left">
              <h4 className="font-medium text-green-800 mb-3">🎯 Your Personalized Safety Thresholds</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <p><strong>Heart Rate Monitoring:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• High Alert: {Math.round(profile.maxHeartRate * 0.9)} bpm</li>
                    <li>• Critical Alert: {Math.round(profile.maxHeartRate * 0.95)} bpm</li>
                  </ul>
                </div>
                <div>
                  <p><strong>Temperature Monitoring:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• High Alert: 38.5°C</li>
                    <li>• Critical Alert: 39.0°C</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/testing'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Test Equipment
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔥 Firefighter Onboarding</h1>
              <p className="text-gray-600 mt-1">Evidence-based registration for physiological monitoring system</p>
              <p className="text-sm text-blue-600 mt-1">Based on Zhang et al. (2021) research & NIOSH/NFPA guidelines</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Step {currentStep} of 6</p>
              <div className="w-32 bg-gray-200 rounded-full h-3 mt-2">
                <div 
                  className="bg-red-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            {[
              { step: 1, label: 'Personal Info', icon: '👤' },
              { step: 2, label: 'Professional', icon: '🚒' },
              { step: 3, label: 'Health Profile', icon: '❤️' },
              { step: 4, label: 'Emergency & Medical', icon: '📞' },
              { step: 5, label: 'Review', icon: '📋' },
              { step: 6, label: 'Complete', icon: '✅' }
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                  currentStep >= item.step
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > item.step ? '✓' : item.icon}
                </div>
                <span className={`text-xs mt-2 ${
                  currentStep >= item.step ? 'text-red-600 font-medium' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStep()}
          
          {/* Navigation Buttons */}
          {currentStep < 6 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              
              {currentStep < 5 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {loading ? '🔄 Registering...' : '✅ Complete Registration'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveOnboarding;
