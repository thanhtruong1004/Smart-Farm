from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class ReportConfig(Base):
    __tablename__ = "report_config"
    report_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    report_category = Column(String)
    group_by = Column(String)
    date_range_type = Column(String)
    date_from = Column(DateTime)
    date_to = Column(DateTime)
    created_by = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    datasets = relationship("ReportDataset", back_populates="report", cascade="all, delete-orphan")
    filters = relationship("ReportFilter", back_populates="report", cascade="all, delete-orphan")
    metrics = relationship("ReportMetric", back_populates="report", cascade="all, delete-orphan")
    layouts = relationship("ReportLayout", back_populates="report", cascade="all, delete-orphan")
    instances = relationship("ReportInstance", back_populates="report", cascade="all, delete-orphan")

class ReportDataset(Base):
    __tablename__ = "report_dataset"
    dataset_id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("report_config.report_id", ondelete="CASCADE"))
    source_table = Column(String, nullable=False)
    sensor_metric_code = Column(String)
    event_category = Column(String)
    event_type = Column(String)
    alias = Column(String)

    report = relationship("ReportConfig", back_populates="datasets")
    metrics = relationship("ReportMetric", back_populates="dataset", cascade="all, delete-orphan")
    filters = relationship("ReportFilter", back_populates="dataset")

class ReportFilter(Base):
    __tablename__ = "report_filter"
    filter_id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("report_config.report_id", ondelete="CASCADE"))
    dataset_id = Column(Integer, ForeignKey("report_dataset.dataset_id", ondelete="CASCADE"), nullable=True)
    filter_type = Column(String, nullable=False)
    field_name = Column(String, nullable=False)
    operator = Column(String, nullable=False)
    value_from = Column(String)
    value_to = Column(String)
    ref_id = Column(Integer)

    report = relationship("ReportConfig", back_populates="filters")
    dataset = relationship("ReportDataset", back_populates="filters")

class ReportMetric(Base):
    __tablename__ = "report_metric"
    metric_id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("report_config.report_id", ondelete="CASCADE"))
    dataset_id = Column(Integer, ForeignKey("report_dataset.dataset_id", ondelete="CASCADE"))
    display_name = Column(String, nullable=False)
    metric_code = Column(String, nullable=False)
    aggregation = Column(String, nullable=False)
    unit = Column(String)
    color_hex = Column(String)
    metric_order = Column(Integer, default=0)

    report = relationship("ReportConfig", back_populates="metrics")
    dataset = relationship("ReportDataset", back_populates="metrics")
    conditions = relationship("ReportMetricCondition", back_populates="metric", cascade="all, delete-orphan")
    layouts = relationship("ReportLayout", back_populates="metric", cascade="all, delete-orphan")

class ReportMetricCondition(Base):
    __tablename__ = "report_metric_condition"
    condition_id = Column(Integer, primary_key=True, index=True)
    metric_id = Column(Integer, ForeignKey("report_metric.metric_id", ondelete="CASCADE"))
    condition_order = Column(Integer, default=0)
    label = Column(String)
    operator = Column(String)
    value_from = Column(Float)
    value_to = Column(Float)
    color_hex = Column(String)

    metric = relationship("ReportMetric", back_populates="conditions")

class ReportLayout(Base):
    __tablename__ = "report_layout"
    layout_id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("report_config.report_id", ondelete="CASCADE"))
    metric_id = Column(Integer, ForeignKey("report_metric.metric_id", ondelete="CASCADE"), nullable=True)
    chart_type = Column(String)
    widget_x = Column(Integer)
    widget_y = Column(Integer)
    widget_w = Column(Integer)
    widget_h = Column(Integer)
    x_axis = Column(String)
    y_axis = Column(String)
    show_legend = Column(Integer, default=1)
    show_tooltip = Column(Integer, default=1)
    show_data_label = Column(Integer, default=1)

    report = relationship("ReportConfig", back_populates="layouts")
    metric = relationship("ReportMetric", back_populates="layouts")

class ReportInstance(Base):
    __tablename__ = "report_instance"
    instance_id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("report_config.report_id", ondelete="CASCADE"))
    date_from = Column(DateTime)
    date_to = Column(DateTime)
    result_summary = Column(String) # JSON string
    row_count = Column(Integer, default=0)
    status = Column(String)
    generated_at = Column(DateTime, default=func.now())
    generated_by = Column(String)

    report = relationship("ReportConfig", back_populates="instances")
    exports = relationship("ReportExport", back_populates="instance", cascade="all, delete-orphan")

class ReportExport(Base):
    __tablename__ = "report_export"
    export_id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(Integer, ForeignKey("report_instance.instance_id", ondelete="CASCADE"))
    format = Column(String, nullable=False)
    file_name = Column(String)
    file_path = Column(String)
    exported_at = Column(DateTime, default=func.now())
    exported_by = Column(String)

    instance = relationship("ReportInstance", back_populates="exports")
