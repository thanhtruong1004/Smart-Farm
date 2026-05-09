from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReportDatasetBase(BaseModel):
    source_table: str
    sensor_metric_code: Optional[str] = None
    event_category: Optional[str] = None
    event_type: Optional[str] = None
    alias: Optional[str] = None

class ReportDatasetCreate(ReportDatasetBase):
    pass

class ReportDatasetUpdate(ReportDatasetBase):
    source_table: Optional[str] = None

class ReportDatasetResponse(ReportDatasetBase):
    dataset_id: int
    report_id: int
    model_config = ConfigDict(from_attributes=True)

class ReportFilterBase(BaseModel):
    dataset_id: Optional[int] = None
    filter_type: str
    field_name: str
    operator: str
    value_from: Optional[str] = None
    value_to: Optional[str] = None
    ref_id: Optional[int] = None

class ReportFilterCreate(ReportFilterBase):
    pass

class ReportFilterUpdate(ReportFilterBase):
    filter_type: Optional[str] = None
    field_name: Optional[str] = None
    operator: Optional[str] = None

class ReportFilterResponse(ReportFilterBase):
    filter_id: int
    report_id: int
    model_config = ConfigDict(from_attributes=True)

class ReportMetricConditionBase(BaseModel):
    condition_order: int = 0
    label: Optional[str] = None
    operator: Optional[str] = None
    value_from: Optional[float] = None
    value_to: Optional[float] = None
    color_hex: Optional[str] = None

class ReportMetricConditionCreate(ReportMetricConditionBase):
    pass

class ReportMetricConditionUpdate(ReportMetricConditionBase):
    pass

class ReportMetricConditionResponse(ReportMetricConditionBase):
    condition_id: int
    metric_id: int
    model_config = ConfigDict(from_attributes=True)

class ReportMetricBase(BaseModel):
    dataset_id: int
    display_name: str
    metric_code: str
    aggregation: str
    unit: Optional[str] = None
    color_hex: Optional[str] = None
    metric_order: int = 0

class ReportMetricCreate(ReportMetricBase):
    pass

class ReportMetricUpdate(ReportMetricBase):
    dataset_id: Optional[int] = None
    display_name: Optional[str] = None
    metric_code: Optional[str] = None
    aggregation: Optional[str] = None

class ReportMetricResponse(ReportMetricBase):
    metric_id: int
    report_id: int
    conditions: List[ReportMetricConditionResponse] = []
    model_config = ConfigDict(from_attributes=True)

class ReportLayoutBase(BaseModel):
    metric_id: Optional[int] = None
    chart_type: Optional[str] = None
    widget_x: Optional[int] = None
    widget_y: Optional[int] = None
    widget_w: Optional[int] = None
    widget_h: Optional[int] = None
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    show_legend: int = 1
    show_tooltip: int = 1
    show_data_label: int = 1

class ReportLayoutCreate(ReportLayoutBase):
    pass

class ReportLayoutUpdate(ReportLayoutBase):
    pass

class ReportLayoutResponse(ReportLayoutBase):
    layout_id: int
    report_id: int
    model_config = ConfigDict(from_attributes=True)

class ReportConfigBase(BaseModel):
    name: str
    description: Optional[str] = None
    report_category: Optional[str] = None
    group_by: Optional[str] = None
    date_range_type: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    created_by: Optional[str] = None

class ReportConfigCreate(ReportConfigBase):
    pass

class ReportConfigUpdate(ReportConfigBase):
    name: Optional[str] = None

class ReportConfigResponse(ReportConfigBase):
    report_id: int
    created_at: datetime
    updated_at: datetime
    
    datasets: List[ReportDatasetResponse] = []
    filters: List[ReportFilterResponse] = []
    metrics: List[ReportMetricResponse] = []
    layouts: List[ReportLayoutResponse] = []
    model_config = ConfigDict(from_attributes=True)
