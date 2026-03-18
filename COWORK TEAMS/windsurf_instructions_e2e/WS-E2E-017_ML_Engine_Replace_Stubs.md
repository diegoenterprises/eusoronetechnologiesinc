# WS-E2E-017: ML Engine - Replace Stubs with Real Models

**Priority:** P2  
**Estimated Hours:** 40+  
**Status:** Not Started

## CONTEXT

The file `services/mlEngine.ts` (1536 lines) is 100% rule-based with hardcoded factors. It claims to do ML but only uses if/else rules. This means:
- Rate predictions are inaccurate and hardcoded
- No learning from historical data
- Demand forecasting doesn't adapt
- Carrier scoring doesn't improve
- Revenue optimization is missed

This is a multi-sprint effort. Start with Phase 1: rate prediction model.

## REQUIREMENTS

### Phase 1: Export Historical Load Data for Training (6 hours)

1. Create data export utility:
   ```typescript
   // services/mlEngine/dataExport.ts
   async function exportTrainingData(
     startDate: Date,
     endDate: Date,
     format: 'csv' | 'json' = 'csv'
   ) {
     const loads = await db.query.loads.findMany({
       where: and(
         gte(loads.createdAt, startDate),
         lt(loads.createdAt, endDate)
       ),
       with: { bids: true, settlement: true, ratings: true }
     });
     
     // Transform to ML-friendly format
     const data = loads.map(load => ({
       id: load.id,
       distance: load.distance,
       weight: load.weight,
       pickupCity: load.pickupCity,
       dropoffCity: load.dropoffCity,
       pickupDate: load.pickupDate,
       hazmat: load.hazmat,
       truckType: load.truckType,
       winningBidAmount: load.settlement?.totalAmount,
       bidCount: load.bids.length,
       carrierRating: load.carrierRating,
       daysToDelivery: calculateDays(load.pickupDate, load.deliveryDate),
       timeOfDay: getTimeOfDay(load.pickupDate),
       dayOfWeek: getDayOfWeek(load.pickupDate),
       season: getSeason(load.pickupDate)
     }));
     
     if (format === 'csv') {
       return convertToCSV(data);
     }
     return JSON.stringify(data, null, 2);
   }
   ```

2. Add export endpoint:
   ```typescript
   GET /api/ml/export-training-data
   Query: { startDate, endDate, format?, limit? }
   ```

3. Export 12+ months of historical data:
   - Target: 10,000+ loads minimum
   - Include all features: distance, weight, hazmat, etc.
   - Include target variable: winning bid amount
   - Format as CSV for sklearn/XGBoost

### Phase 2: Train XGBoost Model for Rate Prediction (12 hours)

1. Create Python training script:
   ```python
   # ml/train_rate_model.py
   import pandas as pd
   import numpy as np
   from xgboost import XGBRegressor
   from sklearn.model_selection import train_test_split
   from sklearn.preprocessing import LabelEncoder
   from sklearn.metrics import mean_squared_error, r2_score
   import joblib
   
   # Load data
   df = pd.read_csv('data/training_data.csv')
   
   # Feature engineering
   df['pickup_to_dropoff_days'] = (df['dropoff_date'] - df['pickup_date']).dt.days
   df['distance_per_day'] = df['distance'] / (df['pickup_to_dropoff_days'] + 1)
   df['weight_per_mile'] = df['weight'] / df['distance']
   
   # Encode categorical variables
   le_dict = {}
   for col in ['pickup_city', 'dropoff_city', 'truck_type']:
       le = LabelEncoder()
       df[col] = le.fit_transform(df[col])
       le_dict[col] = le
   
   # Split data
   X = df.drop('winning_bid_amount', axis=1)
   y = df['winning_bid_amount']
   X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
   
   # Train model
   model = XGBRegressor(
       n_estimators=200,
       max_depth=8,
       learning_rate=0.05,
       subsample=0.8,
       colsample_bytree=0.8,
       random_state=42
   )
   model.fit(X_train, y_train)
   
   # Evaluate
   y_pred = model.predict(X_test)
   mse = mean_squared_error(y_test, y_pred)
   r2 = r2_score(y_test, y_pred)
   print(f"MSE: {mse}, R2: {r2}")
   
   # Save model and encoders
   joblib.dump(model, 'ml/models/rate_model.pkl')
   joblib.dump(le_dict, 'ml/models/encoders.pkl')
   ```

2. Integrate model into backend:
   ```typescript
   // services/mlEngine/ratePredictor.ts
   import * as tf from '@tensorflow/tfjs';
   // Or use Python model via API if using sklearn
   
   async function predictRate(
     distance: number,
     weight: number,
     pickupCity: string,
     dropoffCity: string,
     truckType: string,
     hazmat: boolean
   ): Promise<number> {
     const features = {
       distance,
       weight,
       pickupCity,
       dropoffCity,
       truckType,
       hazmat,
       dayOfWeek: new Date().getDay(),
       season: getSeason(new Date()),
       distance_per_weight: distance / weight
     };
     
     const prediction = await model.predict(features);
     // Apply confidence interval
     return adjustForConfidence(prediction, 0.85);
   }
   ```

3. Create model serving API:
   ```typescript
   POST /api/ml/predict-rate
   Body: {
     distance: number,
     weight: number,
     pickupCity: string,
     dropoffCity: string,
     truckType: string,
     hazmat: boolean,
     includeConfidence?: boolean
   }
   Response: {
     predictedRate: number,
     confidence: number,
     range: { min, max }
   }
   ```

4. A/B test new predictions:
   - Run model predictions in parallel with legacy rules
   - Log both predictions and actual results
   - Compare accuracy (model should be > 85% accurate)

### Phase 3: Time-Series Demand Forecasting (10 hours)

1. Create demand forecasting model:
   ```python
   # ml/train_demand_model.py
   from statsmodels.tsa.seasonal import seasonal_decompose
   from statsmodels.tsa.arima.model import ARIMA
   from sklearn.preprocessing import StandardScaler
   
   # Aggregate loads by day and region
   demand_by_day = df.groupby(['date', 'region']).size()
   
   # Decompose time series
   decomposition = seasonal_decompose(demand_by_day, model='additive', period=7)
   
   # Fit ARIMA model
   model = ARIMA(demand_by_day, order=(5,1,2))
   results = model.fit()
   
   # Forecast 30 days ahead
   forecast = results.get_forecast(steps=30)
   ```

2. Implement demand endpoint:
   ```typescript
   GET /api/ml/forecast-demand
   Query: { region, days?: 30 }
   Response: [
     { date, forecastedLoads, confidence },
     ...
   ]
   ```

3. Use demand forecast for:
   - Suggesting optimal pricing
   - Predicting carrier availability
   - Planning capacity

### Phase 4: Carrier Scoring from Delivery History (12 hours)

1. Build carrier scoring model:
   ```python
   # ml/train_carrier_model.py
   features = {
       'on_time_rate': carrier.on_time_deliveries / carrier.total_deliveries,
       'avg_rating': carrier.average_rating,
       'compliance_score': carrier.compliance_checks_passed / total_checks,
       'years_in_business': carrier.years_active,
       'fleet_size': carrier.truck_count,
       'accident_rate': carrier.incidents / carrier.total_loads,
       'hazmat_certified': carrier.hazmat_certified,
       'loads_per_month': carrier.total_loads / carrier.months_active
   }
   
   # Train classification model (predict reliability)
   model = XGBClassifier()
   model.fit(X_train, y_train)  # y = reliable (1/0)
   ```

2. Create carrier scoring endpoint:
   ```typescript
   GET /api/ml/carrier/:carrierId/score
   Response: {
     reliabilityScore: 0.92,
     riskLevel: 'LOW',
     recommendedRate: 1.0,
     factors: {
       onTimeRate: 0.95,
       avgRating: 4.8,
       complianceScore: 0.98
     }
   }
   ```

### Phase 5: Model Serving Infrastructure (continuous)

1. Set up model versioning:
   ```typescript
   // ml/modelRegistry.ts
   interface ModelVersion {
     modelId: string;
     version: string;
     trainedAt: Date;
     accuracy: number;
     status: 'TRAINING' | 'STAGING' | 'PRODUCTION' | 'DEPRECATED';
     features: string[];
   }
   ```

2. Implement model retraining schedule:
   - Retrain rate model monthly
   - Retrain demand model weekly
   - Retrain carrier model bi-weekly

3. Add monitoring:
   - Track prediction accuracy vs actual
   - Alert if accuracy drops below threshold
   - Compare model vs legacy rules

## FILES TO MODIFY

- `services/mlEngine.ts` (rewrite stub implementations)
- `services/mlEngine/dataExport.ts` (new file)
- `services/mlEngine/ratePredictor.ts` (new file)
- `services/mlEngine/demandForecasting.ts` (new file)
- `services/mlEngine/carrierScoring.ts` (new file)
- `ml/` directory (new Python models and scripts)
- `routers/ml.ts` (new API endpoints)

## VERIFICATION

1. Export training data:
   ```bash
   curl "http://localhost:3000/api/ml/export-training-data?startDate=2024-01-01&endDate=2026-03-05&format=csv"
   wc -l training_data.csv  # Should be 10,000+
   ```

2. Train model:
   ```bash
   python ml/train_rate_model.py
   # Should show R2 > 0.85
   ```

3. Test rate prediction:
   ```bash
   curl -X POST http://localhost:3000/api/ml/predict-rate \
     -H "Content-Type: application/json" \
     -d '{
       "distance": 500,
       "weight": 20000,
       "pickupCity": "Los Angeles",
       "dropoffCity": "Las Vegas",
       "truckType": "FLATBED",
       "hazmat": false
     }'
   # Should return predicted rate with confidence
   ```

4. Compare model vs legacy:
   - Run both predictions for 100+ loads
   - Compare accuracy
   - Log in database

5. Monitor accuracy:
   - Check model performance dashboard
   - Verify model accuracy > 85%
   - Alert if drops below 80%

## DO NOT

- Train model with future data (data leakage)
- Use raw features without scaling (StandardScaler)
- Forget to split train/test properly (80/20)
- Train on incomplete loads (use only DELIVERED)
- Hardcode model thresholds (make configurable)
- Deploy model without testing (A/B test first)
- Forget to version models (track all versions)
- Leave legacy rules in place (gradually phase out)
- Train without enough data (minimum 5,000 samples)
- Ignore model drift (retrain regularly)

