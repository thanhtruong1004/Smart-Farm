from sqlalchemy.orm import Session
from .base_repo import CRUDBase
from ..models.report import (
    ReportConfig, ReportDataset, ReportFilter,
    ReportMetric, ReportMetricCondition, ReportLayout,
    ReportInstance, ReportExport
)
from ..schemas.report_config import (
    ReportConfigCreate, ReportConfigUpdate,
    ReportDatasetCreate, ReportDatasetUpdate,
    ReportFilterCreate, ReportFilterUpdate,
    ReportMetricCreate, ReportMetricUpdate,
    ReportMetricConditionCreate, ReportMetricConditionUpdate,
    ReportLayoutCreate, ReportLayoutUpdate
)

class CRUDReportConfig(CRUDBase[ReportConfig, ReportConfigCreate, ReportConfigUpdate]):
    pass

class CRUDReportDataset(CRUDBase[ReportDataset, ReportDatasetCreate, ReportDatasetUpdate]):
    pass

class CRUDReportFilter(CRUDBase[ReportFilter, ReportFilterCreate, ReportFilterUpdate]):
    pass

class CRUDReportMetric(CRUDBase[ReportMetric, ReportMetricCreate, ReportMetricUpdate]):
    pass

class CRUDReportMetricCondition(CRUDBase[ReportMetricCondition, ReportMetricConditionCreate, ReportMetricConditionUpdate]):
    pass

class CRUDReportLayout(CRUDBase[ReportLayout, ReportLayoutCreate, ReportLayoutUpdate]):
    pass

# We use generic Pydantic BaseModel types or dict for standard models if we lack explicit Create schemas here
class DummySchema(ReportConfigCreate):
    pass

class CRUDReportInstance(CRUDBase[ReportInstance, dict, dict]):
    pass

class CRUDReportExport(CRUDBase[ReportExport, dict, dict]):
    pass

report_config = CRUDReportConfig(ReportConfig)
report_dataset = CRUDReportDataset(ReportDataset)
report_filter = CRUDReportFilter(ReportFilter)
report_metric = CRUDReportMetric(ReportMetric)
report_metric_condition = CRUDReportMetricCondition(ReportMetricCondition)
report_layout = CRUDReportLayout(ReportLayout)
report_instance = CRUDReportInstance(ReportInstance)
report_export = CRUDReportExport(ReportExport)
