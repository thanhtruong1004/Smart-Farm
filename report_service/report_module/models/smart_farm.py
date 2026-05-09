from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from .base import Base

class Farm(Base):
    __tablename__ = "farms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

class Area(Base):
    __tablename__ = "areas"
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    name = Column(String, nullable=False)

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("areas.id"))
    name = Column(String, nullable=False)

class Sensor(Base):
    __tablename__ = "sensors"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    name = Column(String, nullable=False)

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"
    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"))
    recorded_at = Column(DateTime, default=func.now())
    temperature = Column(Float)
    humidity_air = Column(Float)
    humidity_soil = Column(Float)
    light_intensity = Column(Float)

class IrrigationLog(Base):
    __tablename__ = "irrigation_logs"
    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("areas.id"))
    water_amount = Column(Float)
    irrigated_at = Column(DateTime, default=func.now())

class AlertLog(Base):
    __tablename__ = "alert_logs"
    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("areas.id"))
    alert_type = Column(String)
    severity = Column(String)
    created_at = Column(DateTime, default=func.now())

class HarvestLog(Base):
    __tablename__ = "harvest_logs"
    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("areas.id"))
    crop_type = Column(String)
    quantity = Column(Float)
    harvested_at = Column(DateTime, default=func.now())
