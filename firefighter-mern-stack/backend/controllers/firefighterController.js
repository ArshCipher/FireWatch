/**
 * 🔥 Firefighter Controller - MVC Pattern
 * 
 * Handles all firefighter-related operations including registration,
 * profile management, activation/deactivation, and baseline measurements
 * 
 * Implements evidence-based monitoring with comprehensive validation
 */

import Firefighter from '../models/Firefighter.js';
import SensorData from '../models/SensorData.js';
import Alert from '../models/Alert.js';
import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

/**
 * Get all firefighters with filtering, search, and pagination
 */
export const getAllFirefighters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      station,
      rank,
      isActive,
      onDuty,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { firefighterId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) query.department = department;
    if (station) query.station = station;
    if (rank) query.rank = rank;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (onDuty !== undefined) query.onDuty = onDuty === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with population
    const [firefighters, total] = await Promise.all([
      Firefighter.find(query)
        .select('-medicalHistory -emergencyContacts') // Exclude sensitive data
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Firefighter.countDocuments(query)
    ]);

    // Get latest sensor data for each firefighter
    const firefightersWithData = await Promise.all(
      firefighters.map(async (ff) => {
        const latestData = await SensorData.findOne({ 
          firefighterId: ff._id 
        }).sort({ timestamp: -1 }).lean();

        const activeAlerts = await Alert.countDocuments({
          firefighterId: ff._id,
          status: { $in: ['active', 'acknowledged'] }
        });

        return {
          ...ff,
          latestSensorData: latestData,
          activeAlertsCount: activeAlerts,
          status: latestData?.riskLevel || 'unknown',
          lastUpdate: latestData?.timestamp || ff.lastSeen
        };
      })
    );

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        firefighters: firefightersWithData,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          limit: parseInt(limit),
          totalRecords: total
        }
      },
      message: `Retrieved ${firefighters.length} firefighters`
    });

  } catch (error) {
    console.error('Error fetching firefighters:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to fetch firefighters',
      message: error.message
    });
  }
};

/**
 * Get firefighter by ID with full details
 */
export const getFirefighterById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeHistory = false } = req.query;

    const firefighter = await Firefighter.findById(id);
    
    if (!firefighter) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Firefighter not found'
      });
    }

    // Get recent sensor data
    const recentData = await SensorData.find({ firefighterId: id })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // Get active alerts
    const activeAlerts = await Alert.find({
      firefighterId: id,
      status: { $in: ['active', 'acknowledged'] }
    }).sort({ triggeredAt: -1 });

    // Get historical data if requested
    let historicalData = null;
    if (includeHistory === 'true') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      historicalData = await SensorData.getAggregatedData(id, '1h');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        firefighter,
        recentSensorData: recentData,
        activeAlerts,
        historicalData,
        heartRateZones: firefighter.calculateHeartRateZones()
      }
    });

  } catch (error) {
    console.error('Error fetching firefighter:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to fetch firefighter details',
      message: error.message
    });
  }
};

/**
 * Create new firefighter profile
 */
export const createFirefighter = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Generate unique firefighter ID
    const firefighterId = await Firefighter.generateFirefighterId();

    // Create firefighter with generated ID
    const firefighterData = {
      ...req.body,
      firefighterId,
      createdBy: req.user?.id || req.body.createdBy
    };

    const firefighter = new Firefighter(firefighterData);
    await firefighter.save();

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: firefighter,
      message: `Firefighter ${firefighter.fullName} created successfully`
    });

  } catch (error) {
    console.error('Error creating firefighter:', error);
    
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: 'Firefighter with this email or ID already exists'
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to create firefighter',
      message: error.message
    });
  }
};

/**
 * Update firefighter profile
 */
export const updateFirefighter = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user?.id
    };

    const firefighter = await Firefighter.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!firefighter) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Firefighter not found'
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: firefighter,
      message: `Firefighter ${firefighter.fullName} updated successfully`
    });

  } catch (error) {
    console.error('Error updating firefighter:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to update firefighter',
      message: error.message
    });
  }
};

/**
 * Activate firefighter for duty
 */
export const activateFirefighter = async (req, res) => {
  try {
    const { id } = req.params;
    const { incidentId } = req.body;

    const firefighter = await Firefighter.findById(id);
    
    if (!firefighter) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Firefighter not found'
      });
    }

    if (!firefighter.isActive) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Firefighter is not active in the system'
      });
    }

    await firefighter.activateForDuty(incidentId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: firefighter,
      message: `${firefighter.fullName} activated for duty`
    });

  } catch (error) {
    console.error('Error activating firefighter:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to activate firefighter',
      message: error.message
    });
  }
};

/**
 * Deactivate firefighter from duty
 */
export const deactivateFirefighter = async (req, res) => {
  try {
    const { id } = req.params;

    const firefighter = await Firefighter.findById(id);
    
    if (!firefighter) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Firefighter not found'
      });
    }

    await firefighter.deactivateFromDuty();

    // Resolve any active alerts for this firefighter
    await Alert.updateMany(
      { 
        firefighterId: id,
        status: { $in: ['active', 'acknowledged'] }
      },
      {
        status: 'resolved',
        resolvedAt: new Date(),
        'resolution.outcome': 'firefighter_relieved',
        'resolution.description': 'Firefighter deactivated from duty'
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: firefighter,
      message: `${firefighter.fullName} deactivated from duty`
    });

  } catch (error) {
    console.error('Error deactivating firefighter:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to deactivate firefighter',
      message: error.message
    });
  }
};

/**
 * Update firefighter baseline measurements
 */
export const updateBaselines = async (req, res) => {
  try {
    const { id } = req.params;
    const baselineData = req.body;

    const firefighter = await Firefighter.findById(id);
    
    if (!firefighter) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Firefighter not found'
      });
    }

    await firefighter.updateBaselines(baselineData);

    res.status(StatusCodes.OK).json({
      success: true,
      data: firefighter,
      message: `Baseline measurements updated for ${firefighter.fullName}`
    });

  } catch (error) {
    console.error('Error updating baselines:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to update baseline measurements',
      message: error.message
    });
  }
};

/**
 * Get active firefighters only
 */
export const getActiveFirefighters = async (req, res) => {
  try {
    const activeFirefighters = await Firefighter.findActiveFirefighters()
      .select('-medicalHistory -emergencyContacts')
      .lean();

    // Get recent sensor data for each
    const firefightersWithData = await Promise.all(
      activeFirefighters.map(async (ff) => {
        const recentData = await SensorData.findOne({ 
          firefighterId: ff._id 
        }).sort({ timestamp: -1 }).lean();

        return {
          ...ff,
          latestSensorData: recentData,
          status: recentData?.riskLevel || 'unknown'
        };
      })
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: firefightersWithData,
      count: firefightersWithData.length
    });

  } catch (error) {
    console.error('Error fetching active firefighters:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to fetch active firefighters',
      message: error.message
    });
  }
};

/**
 * Get firefighters by department
 */
export const getFirefightersByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const firefighters = await Firefighter.findByDepartment(department)
      .select('-medicalHistory')
      .lean();

    res.status(StatusCodes.OK).json({
      success: true,
      data: firefighters,
      department,
      count: firefighters.length
    });

  } catch (error) {
    console.error('Error fetching firefighters by department:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to fetch firefighters by department',
      message: error.message
    });
  }
};

/**
 * Delete firefighter (soft delete - deactivate)
 */
export const deleteFirefighter = async (req, res) => {
  try {
    const { id } = req.params;

    const firefighter = await Firefighter.findById(id);
    
    if (!firefighter) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: 'Firefighter not found'
      });
    }

    // Soft delete - deactivate instead of removing
    firefighter.isActive = false;
    firefighter.onDuty = false;
    firefighter.lastUpdatedBy = req.user?.id;
    await firefighter.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Firefighter ${firefighter.fullName} deactivated successfully`
    });

  } catch (error) {
    console.error('Error deleting firefighter:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to delete firefighter',
      message: error.message
    });
  }
};

/**
 * Get firefighter statistics
 */
export const getFirefighterStats = async (req, res) => {
  try {
    const [
      totalCount,
      activeCount,
      onDutyCount,
      departmentStats,
      rankStats
    ] = await Promise.all([
      Firefighter.countDocuments(),
      Firefighter.countDocuments({ isActive: true }),
      Firefighter.countDocuments({ onDuty: true }),
      Firefighter.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Firefighter.aggregate([
        { $group: { _id: '$rank', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        overview: {
          total: totalCount,
          active: activeCount,
          onDuty: onDutyCount,
          offDuty: activeCount - onDutyCount
        },
        byDepartment: departmentStats,
        byRank: rankStats
      }
    });

  } catch (error) {
    console.error('Error fetching firefighter stats:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Failed to fetch firefighter statistics',
      message: error.message
    });
  }
};
