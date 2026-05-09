from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class ReportGenerateRequest(BaseModel):
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class ReportExportRequest(BaseModel):
    format: str # 'csv' | 'xlsx' | 'pdf'

class ReportInstanceResponse(BaseModel):
    instance_id: int
    report_id: int
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    result_summary: Optional[str] = None
    row_count: int
    status: Optional[str] = None
    generated_at: datetime
    generated_by: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ReportExportResponse(BaseModel):
    export_id: int
    instance_id: int
    format: str
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    exported_at: datetime
    exported_by: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
