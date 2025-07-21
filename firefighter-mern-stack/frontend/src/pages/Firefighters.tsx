/**
 * 🔥 Firefighters Page
 * 
 * Manage and view all firefighters in the system
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Firefighter {
  _id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
  department: string;
  station: string;
  rank: string;
  email: string;
  phone: string;
  status?: 'active' | 'inactive' | 'on-leave'; // Optional for display
  isActive?: boolean; // Backend field
  onDuty?: boolean; // Backend field
  dateOfBirth?: string;
  yearsExperience?: number;
}

const Firefighters: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedFirefighter, setSelectedFirefighter] = useState<Firefighter | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch firefighters from API
  const { data: apiResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['firefighters'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3004/api/firefighters');
      if (!response.ok) throw new Error('Failed to fetch firefighters');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Extract firefighters array from API response
  const firefighters = Array.isArray(apiResponse) 
    ? apiResponse 
    : apiResponse?.success && apiResponse?.data 
      ? (Array.isArray(apiResponse.data) ? apiResponse.data : apiResponse.data.firefighters || [])
      : [];

  // Helper function to get display status from backend data
  const getDisplayStatus = (firefighter: any): 'active' | 'inactive' | 'on-leave' => {
    // If backend has explicit status field, use it
    if (firefighter.status) {
      return firefighter.status;
    }
    // Otherwise, derive from isActive and onDuty fields
    if (firefighter.isActive === false) {
      return 'inactive';
    }
    return firefighter.onDuty ? 'active' : 'inactive';
  };

  // Helper function to get backend format from form status
  const getBackendStatus = (status: string) => {
    return {
      isActive: status !== 'inactive',
      onDuty: status === 'active'
    };
  };

  // Debug logging
  console.log('🔍 Firefighters API Response:', apiResponse);
  console.log('📊 Processed firefighters array:', firefighters);

  // Filter firefighters based on search term and status
  const filteredFirefighters = Array.isArray(firefighters) 
    ? firefighters.filter((firefighter: Firefighter) => {
        // Search filter
        const matchesSearch = `${firefighter.firstName} ${firefighter.lastName} ${firefighter.badgeNumber} ${firefighter.department}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        
        // Status filter
        const firefighterStatus = getDisplayStatus(firefighter);
        const matchesStatus = statusFilter === 'all' || firefighterStatus === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'on-leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    return age;
  };

  // Handle viewing firefighter details
  const handleViewDetails = (firefighter: Firefighter) => {
    console.log('👁️ Viewing details for:', firefighter.firstName, firefighter.lastName);
    setSelectedFirefighter(firefighter);
    setIsEditMode(false);
    setShowDetailsModal(true);
  };

  // Handle editing firefighter profile
  const handleEditProfile = (firefighter: Firefighter) => {
    console.log('✏️ Editing profile for:', firefighter.firstName, firefighter.lastName);
    setSelectedFirefighter(firefighter);
    setIsEditMode(true);
    setShowDetailsModal(true);
  };

  // Close modal
  const closeModal = () => {
    setSelectedFirefighter(null);
    setIsEditMode(false);
    setShowDetailsModal(false);
  };

  // Handle saving profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFirefighter) return;

    console.log('💾 Saving profile changes for:', selectedFirefighter.firstName, selectedFirefighter.lastName);
    
    try {
      // Extract form data
      const formData = new FormData(e.target as HTMLFormElement);
      const statusValue = formData.get('status') as string;
      const backendStatusFields = getBackendStatus(statusValue);
      
      const updatedData = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        badgeNumber: formData.get('badgeNumber') as string,
        rank: formData.get('rank') as string,
        department: formData.get('department') as string,
        station: formData.get('station') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        ...backendStatusFields, // Add isActive and onDuty fields
      };

      console.log('📤 Sending update data:', updatedData);

      const response = await fetch(`http://localhost:3004/api/firefighters/${selectedFirefighter._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Profile updated successfully:', result);
        
        // Close modal and refresh data
        closeModal();
        
        // Trigger a refetch of firefighters data
        await refetch();
        
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to update profile:', response.status, errorData);
        alert(`Failed to update profile: ${errorData.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Network error while updating profile. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firefighters</h1>
          <p className="text-gray-600 mt-1">Manage firefighter profiles and assignments</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Connection Error</h3>
            <p className="text-red-700 mb-4">Failed to connect to the backend server.</p>
            <p className="text-sm text-red-600">Make sure the backend is running on port 3004</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔥 Firefighters</h1>
        <p className="text-gray-600 mt-1">Manage firefighter profiles and assignments</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search firefighters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">Loading firefighter data...</p>
          </div>
        </div>
      ) : (
        /* Firefighters Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFirefighters.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Firefighters Found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'No firefighters match your search criteria.' : 'No firefighters registered yet.'}
                </p>
              </div>
            </div>
          ) : (
            filteredFirefighters.map((firefighter: Firefighter) => (
              <div
                key={firefighter._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {firefighter.firstName || 'Unknown'} {firefighter.lastName || 'Firefighter'}
                    </h3>
                    <p className="text-sm text-gray-600">Badge #{firefighter.badgeNumber || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getDisplayStatus(firefighter))}`}>
                    {getDisplayStatus(firefighter).toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{firefighter.department || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Station:</span>
                    <span className="font-medium">{firefighter.station}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rank:</span>
                    <span className="font-medium">{firefighter.rank}</span>
                  </div>
                  {firefighter.yearsExperience && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{firefighter.yearsExperience} years</span>
                    </div>
                  )}
                  {firefighter.dateOfBirth && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{calculateAge(firefighter.dateOfBirth)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    <p>📧 {firefighter.email}</p>
                    <p>📞 {firefighter.phone}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleViewDetails(firefighter)}
                    className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleEditProfile(firefighter)}
                    className="flex-1 px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && filteredFirefighters.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total: {filteredFirefighters.length} firefighters</span>
            <span>
              Active: {filteredFirefighters.filter((f: Firefighter) => getDisplayStatus(f) === 'active').length}
            </span>
          </div>
        </div>
      )}

      {/* Details/Edit Modal */}
      {showDetailsModal && selectedFirefighter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditMode ? '✏️ Edit Firefighter Profile' : '👁️ Firefighter Details'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {isEditMode ? (
                // Edit Mode Form
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        defaultValue={selectedFirefighter.firstName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        defaultValue={selectedFirefighter.lastName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Badge Number</label>
                      <input
                        type="text"
                        name="badgeNumber"
                        defaultValue={selectedFirefighter.badgeNumber}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                      <select
                        name="rank"
                        defaultValue={selectedFirefighter.rank}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        name="department"
                        defaultValue={selectedFirefighter.department}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                      <input
                        type="text"
                        name="station"
                        defaultValue={selectedFirefighter.station}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={selectedFirefighter.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={selectedFirefighter.phone}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        name="status"
                        defaultValue={getDisplayStatus(selectedFirefighter)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on-leave">On Leave</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                // View Mode Details
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Full Name:</span>
                          <p className="text-sm text-gray-900">{selectedFirefighter.firstName} {selectedFirefighter.lastName}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Badge Number:</span>
                          <p className="text-sm text-gray-900">{selectedFirefighter.badgeNumber}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                          <p className="text-sm text-gray-900">
                            {selectedFirefighter.dateOfBirth 
                              ? new Date(selectedFirefighter.dateOfBirth).toLocaleDateString()
                              : 'Not specified'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Age:</span>
                          <p className="text-sm text-gray-900">
                            {selectedFirefighter.dateOfBirth 
                              ? calculateAge(selectedFirefighter.dateOfBirth)
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Years of Experience:</span>
                          <p className="text-sm text-gray-900">
                            {selectedFirefighter.yearsExperience || 'Not specified'} years
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Rank:</span>
                          <p className="text-sm text-gray-900">{selectedFirefighter.rank}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Department:</span>
                          <p className="text-sm text-gray-900">{selectedFirefighter.department}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Station:</span>
                          <p className="text-sm text-gray-900">{selectedFirefighter.station}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Status:</span>
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getDisplayStatus(selectedFirefighter))}`}>
                            {getDisplayStatus(selectedFirefighter).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-sm text-gray-900">
                          <a href={`mailto:${selectedFirefighter.email}`} className="text-blue-600 hover:text-blue-800">
                            {selectedFirefighter.email}
                          </a>
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone:</span>
                        <p className="text-sm text-gray-900">
                          <a href={`tel:${selectedFirefighter.phone}`} className="text-blue-600 hover:text-blue-800">
                            {selectedFirefighter.phone}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      ✏️ Edit Profile
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Firefighters;
