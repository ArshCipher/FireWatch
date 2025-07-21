# 🎯 Firefighter Monitoring System - Scenario Alert Mapping

## Alert System Overview
This system now generates **scenario-specific alerts** to prevent alert spam and ensure each simulation type creates only relevant alerts.

## Scenario to Alert Type Mapping

| Scenario ID | Scenario Name | Alert Type Generated | What You'll See |
|-------------|---------------|---------------------|-----------------|
| `routine_training` | 🔥 Routine Training Exercise | **ALL THRESHOLDS** | Mix of HR, temp, fall alerts for comprehensive training |
| `structure_fire` | 🏠 Structure Fire Response | **TEMPERATURE ONLY** | 🌡️ Temperature alerts (moderate/high/critical) |
| `heat_exhaustion` | 🌡️ Heat Exhaustion Risk Scenario | **HEART RATE ONLY** | 💓 Heart rate alerts (moderate/high/critical) |
| `fall_incident` | ⚠️ Fall Incident Response | **FALL ONLY** | ⬇️ Fall detection alerts (>20g acceleration) |
| `inactivity_scenario` | 😴 Firefighter Incapacitation Scenario | **INACTIVITY ONLY** | ⏸️ Inactivity detection alerts (<0.8g movement) |
| `wildfire_suppression` | 🔥 Wildfire Suppression | **TEMPERATURE ONLY** | 🌡️ Temperature alerts from extreme heat |
| `search_rescue` | 🔍 Search & Rescue Operations | **HEART RATE ONLY** | 💓 Heart rate alerts from physical exertion |
| `hazmat_response` | ☢️ Hazmat Response | **TEMPERATURE ONLY** | 🌡️ Temperature alerts from protective equipment |

## Testing Each Scenario

### 1. Fall Incident (✅ Fixed)
- **Simulation**: Fall Incident Response
- **Expected**: Only fall detection alerts (⬇️)
- **No More**: Heart rate, temperature alerts during fall simulation

### 2. Structure Fire
- **Simulation**: Structure Fire Response  
- **Expected**: Only temperature alerts (🌡️)
- **Thresholds**: 38.0°C (moderate) → 38.5°C (high) → 39.0°C (critical)

### 3. Heat Exhaustion
- **Simulation**: Heat Exhaustion Risk
- **Expected**: Only heart rate alerts (💓)
- **Thresholds**: 150 bpm (moderate) → 185 bpm (high) → 200 bpm (critical)

### 4. Search & Rescue
- **Simulation**: Search & Rescue Operations
- **Expected**: Only heart rate alerts (💓)
- **Focus**: Physical exertion-based HR elevation

### 5. Wildfire Suppression
- **Simulation**: Wildfire Suppression
- **Expected**: Only temperature alerts (🌡️)
- **Focus**: Extreme environmental heat exposure

### 6. Inactivity Scenario
- **Simulation**: Firefighter Incapacitation
- **Expected**: Only inactivity alerts (⏸️)
- **Focus**: Low movement detection

### 7. Routine Training
- **Simulation**: Routine Training Exercise
- **Expected**: All alert types (comprehensive training)
- **Purpose**: Test all monitoring systems

## Alert Deduplication System

### Database Level
- **Fall alerts**: No duplicates within 15 seconds
- **Heart rate alerts**: No duplicates within 30 seconds  
- **Temperature alerts**: No duplicates within 30 seconds
- **Inactivity alerts**: No duplicates within 60 seconds

### Frontend Level
- **Display limit**: Top 20 most important alerts
- **Deduplication**: One alert per type per firefighter (most recent)
- **Update frequency**: Every 1 second

## Debugging Logs

When running simulations, you'll see these console logs:

```
🎯 SCENARIO "⚠️ Fall Incident Response" (fall_incident) → Alert Type: FALL
🔍 Processing FALL scenario - checking acceleration: 23.4g (threshold: >20g)
⚠️ FALL DETECTED: 23.4g for Arshdeep Singh (fall_incident)
🚨 Generated FALL alert for firefighter Arshdeep Singh: 23.4g
```

## Expected Results by Scenario

### Fall Incident Simulation
- ✅ **Only fall alerts** (⬇️ FALL_DETECTED)
- ❌ **No heart rate alerts** 
- ❌ **No temperature alerts**
- ❌ **No inactivity alerts**

### Structure Fire Simulation  
- ✅ **Only temperature alerts** (🌡️ TEMPERATURE_*)
- ❌ **No heart rate alerts**
- ❌ **No fall alerts**

### Heat Exhaustion Simulation
- ✅ **Only heart rate alerts** (💓 HEART_RATE_*)
- ❌ **No temperature alerts** 
- ❌ **No fall alerts**

This ensures clean, scenario-specific monitoring without alert spam! 🎯
