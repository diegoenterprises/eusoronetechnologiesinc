"""
Demand Forecasting Router — Darts + Prophet for load volume & rate prediction.
"""

import logging
from typing import Optional
from datetime import datetime, timedelta

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("ai-sidecar.forecast")
router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class TimeSeriesPoint(BaseModel):
    date: str  # ISO date
    value: float


class DemandForecastRequest(BaseModel):
    lane: str  # e.g. "TX-IL" or "Houston-Chicago"
    history: list[TimeSeriesPoint]  # historical weekly load volumes
    horizon_weeks: int = 4
    include_confidence: bool = True


class ForecastPoint(BaseModel):
    date: str
    predicted: float
    lower: float = 0.0
    upper: float = 0.0


class DemandForecastResponse(BaseModel):
    success: bool
    lane: str = ""
    forecast: list[ForecastPoint] = []
    trend: str = ""  # RISING | STABLE | DECLINING
    seasonal_factor: float = 1.0
    model_used: str = ""
    error: Optional[str] = None


class RateForecastRequest(BaseModel):
    lane: str
    history: list[TimeSeriesPoint]  # historical rate per mile data
    horizon_weeks: int = 4


class RateForecastResponse(BaseModel):
    success: bool
    lane: str = ""
    forecast: list[ForecastPoint] = []
    trend: str = ""
    volatility: float = 0.0
    model_used: str = ""
    error: Optional[str] = None


class SeasonalRequest(BaseModel):
    history: list[TimeSeriesPoint]
    period: int = 52  # weekly data → 52 = annual cycle


class SeasonalResponse(BaseModel):
    success: bool
    trend: list[float] = []
    seasonal: list[float] = []
    residual: list[float] = []
    seasonal_strength: float = 0.0
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Forecasting engines (lazy loaded)
# ---------------------------------------------------------------------------

_darts_available = None
_prophet_available = None


def check_darts():
    global _darts_available
    if _darts_available is None:
        try:
            import darts
            _darts_available = True
        except ImportError:
            _darts_available = False
    return _darts_available


def check_prophet():
    global _prophet_available
    if _prophet_available is None:
        try:
            from prophet import Prophet
            _prophet_available = True
        except ImportError:
            _prophet_available = False
    return _prophet_available


def forecast_with_darts(dates: list[str], values: list[float], horizon: int) -> tuple[list[ForecastPoint], str]:
    """Use Darts ExponentialSmoothing for quick, reliable forecasting."""
    from darts import TimeSeries
    from darts.models import ExponentialSmoothing
    import pandas as pd

    df = pd.DataFrame({"date": pd.to_datetime(dates), "value": values})
    df = df.sort_values("date").reset_index(drop=True)
    ts = TimeSeries.from_dataframe(df, time_col="date", value_cols="value", freq="W")

    model = ExponentialSmoothing()
    model.fit(ts)
    pred = model.predict(horizon, num_samples=100)

    forecast_points = []
    pred_values = pred.values().flatten()
    # Confidence intervals from quantiles
    try:
        lo = pred.quantile(0.1).values().flatten()
        hi = pred.quantile(0.9).values().flatten()
    except Exception:
        lo = pred_values * 0.8
        hi = pred_values * 1.2

    last_date = pd.to_datetime(dates[-1])
    for i in range(horizon):
        fc_date = last_date + timedelta(weeks=i + 1)
        forecast_points.append(ForecastPoint(
            date=fc_date.strftime("%Y-%m-%d"),
            predicted=round(float(pred_values[i]), 2),
            lower=round(float(lo[i]), 2),
            upper=round(float(hi[i]), 2),
        ))

    return forecast_points, "darts-exponential-smoothing"


def forecast_with_prophet(dates: list[str], values: list[float], horizon: int) -> tuple[list[ForecastPoint], str]:
    """Use Prophet for forecasting with seasonality detection."""
    from prophet import Prophet
    import pandas as pd

    df = pd.DataFrame({"ds": pd.to_datetime(dates), "y": values})
    df = df.sort_values("ds").reset_index(drop=True)

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
    )
    model.fit(df)

    future = model.make_future_dataframe(periods=horizon, freq="W")
    pred = model.predict(future)
    forecast_df = pred.tail(horizon)

    forecast_points = []
    for _, row in forecast_df.iterrows():
        forecast_points.append(ForecastPoint(
            date=row["ds"].strftime("%Y-%m-%d"),
            predicted=round(float(row["yhat"]), 2),
            lower=round(float(row["yhat_lower"]), 2),
            upper=round(float(row["yhat_upper"]), 2),
        ))

    return forecast_points, "prophet"


def compute_trend(values: list[float]) -> str:
    """Simple trend detection from recent values."""
    if len(values) < 4:
        return "STABLE"
    recent = values[-4:]
    older = values[-8:-4] if len(values) >= 8 else values[:4]
    avg_recent = sum(recent) / len(recent)
    avg_older = sum(older) / len(older)
    pct_change = (avg_recent - avg_older) / max(avg_older, 0.01)
    if pct_change > 0.05:
        return "RISING"
    elif pct_change < -0.05:
        return "DECLINING"
    return "STABLE"


def compute_seasonal_factor(values: list[float]) -> float:
    """Compute seasonal strength (ratio of seasonal variance to total)."""
    if len(values) < 10:
        return 0.0
    mean = sum(values) / len(values)
    total_var = sum((v - mean) ** 2 for v in values) / len(values)
    if total_var == 0:
        return 0.0
    # Simple: compare first/second half variance
    mid = len(values) // 2
    h1_mean = sum(values[:mid]) / mid
    h2_mean = sum(values[mid:]) / (len(values) - mid)
    seasonal_var = ((h1_mean - mean) ** 2 + (h2_mean - mean) ** 2) / 2
    return round(min(seasonal_var / total_var, 1.0), 3)


# ---------------------------------------------------------------------------
# Fallback: simple exponential smoothing in pure Python (no deps)
# ---------------------------------------------------------------------------

def forecast_simple(values: list[float], horizon: int) -> list[ForecastPoint]:
    """Holt-Winters-like exponential smoothing, zero external deps."""
    alpha = 0.3
    level = values[0]
    trend_val = 0.0
    beta = 0.1

    for v in values:
        prev_level = level
        level = alpha * v + (1 - alpha) * (level + trend_val)
        trend_val = beta * (level - prev_level) + (1 - beta) * trend_val

    std_dev = (sum((v - sum(values) / len(values)) ** 2 for v in values) / len(values)) ** 0.5
    points = []
    for i in range(horizon):
        pred = level + trend_val * (i + 1)
        points.append(ForecastPoint(
            date=(datetime.now() + timedelta(weeks=i + 1)).strftime("%Y-%m-%d"),
            predicted=round(pred, 2),
            lower=round(pred - 1.645 * std_dev, 2),
            upper=round(pred + 1.645 * std_dev, 2),
        ))
    return points


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/demand", response_model=DemandForecastResponse)
async def forecast_demand(req: DemandForecastRequest):
    """
    Forecast weekly load volume for a lane.
    Uses Darts → Prophet → simple exponential smoothing (fallback chain).
    """
    if len(req.history) < 4:
        raise HTTPException(400, "Need at least 4 historical data points")

    dates = [p.date for p in req.history]
    values = [p.value for p in req.history]
    trend = compute_trend(values)
    seasonal = compute_seasonal_factor(values)

    try:
        # Try Darts first
        if check_darts():
            forecast, model = forecast_with_darts(dates, values, req.horizon_weeks)
            return DemandForecastResponse(
                success=True, lane=req.lane, forecast=forecast,
                trend=trend, seasonal_factor=seasonal, model_used=model,
            )

        # Try Prophet
        if check_prophet():
            forecast, model = forecast_with_prophet(dates, values, req.horizon_weeks)
            return DemandForecastResponse(
                success=True, lane=req.lane, forecast=forecast,
                trend=trend, seasonal_factor=seasonal, model_used=model,
            )

        # Pure Python fallback
        forecast = forecast_simple(values, req.horizon_weeks)
        return DemandForecastResponse(
            success=True, lane=req.lane, forecast=forecast,
            trend=trend, seasonal_factor=seasonal, model_used="exponential-smoothing-builtin",
        )
    except Exception as e:
        logger.error(f"Demand forecast error: {e}")
        # Always fall back to simple
        try:
            forecast = forecast_simple(values, req.horizon_weeks)
            return DemandForecastResponse(
                success=True, lane=req.lane, forecast=forecast,
                trend=trend, seasonal_factor=seasonal, model_used="exponential-smoothing-fallback",
            )
        except Exception as e2:
            return DemandForecastResponse(success=False, lane=req.lane, error=str(e2))


@router.post("/rates", response_model=RateForecastResponse)
async def forecast_rates(req: RateForecastRequest):
    """
    Forecast rate-per-mile trends for a lane.
    Same engine chain as demand forecasting.
    """
    if len(req.history) < 4:
        raise HTTPException(400, "Need at least 4 historical data points")

    dates = [p.date for p in req.history]
    values = [p.value for p in req.history]
    trend = compute_trend(values)
    volatility = round(float(np.std(values) / max(np.mean(values), 0.01)), 4) if values else 0.0

    try:
        if check_darts():
            forecast, model = forecast_with_darts(dates, values, req.horizon_weeks)
        elif check_prophet():
            forecast, model = forecast_with_prophet(dates, values, req.horizon_weeks)
        else:
            forecast = forecast_simple(values, req.horizon_weeks)
            model = "exponential-smoothing-builtin"

        return RateForecastResponse(
            success=True, lane=req.lane, forecast=forecast,
            trend=trend, volatility=volatility, model_used=model,
        )
    except Exception as e:
        logger.error(f"Rate forecast error: {e}")
        forecast = forecast_simple(values, req.horizon_weeks)
        return RateForecastResponse(
            success=True, lane=req.lane, forecast=forecast,
            trend=trend, volatility=volatility, model_used="exponential-smoothing-fallback",
        )


@router.post("/seasonal", response_model=SeasonalResponse)
async def decompose_seasonal(req: SeasonalRequest):
    """
    Decompose a time series into trend, seasonal, and residual components.
    """
    if len(req.history) < req.period:
        raise HTTPException(400, f"Need at least {req.period} data points for seasonal decomposition")

    values = [p.value for p in req.history]

    try:
        import pandas as pd
        from statsmodels.tsa.seasonal import seasonal_decompose

        series = pd.Series(values)
        result = seasonal_decompose(series, model="additive", period=min(req.period, len(values) // 2))

        trend_vals = [round(float(v), 2) if not np.isnan(v) else 0.0 for v in result.trend]
        seasonal_vals = [round(float(v), 2) for v in result.seasonal]
        residual_vals = [round(float(v), 2) if not np.isnan(v) else 0.0 for v in result.resid]

        seasonal_strength = compute_seasonal_factor(values)

        return SeasonalResponse(
            success=True, trend=trend_vals, seasonal=seasonal_vals,
            residual=residual_vals, seasonal_strength=seasonal_strength,
        )
    except ImportError:
        # Manual decomposition: simple moving average
        period = min(req.period, len(values) // 2)
        trend_vals = []
        half = period // 2
        for i in range(len(values)):
            start = max(0, i - half)
            end = min(len(values), i + half + 1)
            trend_vals.append(round(sum(values[start:end]) / (end - start), 2))

        seasonal_vals = [round(values[i] - trend_vals[i], 2) for i in range(len(values))]
        residual_vals = [0.0] * len(values)

        return SeasonalResponse(
            success=True, trend=trend_vals, seasonal=seasonal_vals,
            residual=residual_vals, seasonal_strength=compute_seasonal_factor(values),
        )
    except Exception as e:
        logger.error(f"Seasonal decomposition error: {e}")
        return SeasonalResponse(success=False, error=str(e))
