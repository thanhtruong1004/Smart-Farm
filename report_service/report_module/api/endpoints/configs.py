from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .dependencies import get_db
from ..schemas.report_config import *
from ..repositories.report_repo import (
    report_config, report_dataset, report_filter,
    report_metric, report_metric_condition, report_layout
)

router = APIRouter()

# --- Report Config ---
@router.post("/reports", response_model=ReportConfigResponse, status_code=status.HTTP_201_CREATED)
def create_report(report_in: ReportConfigCreate, db: Session = Depends(get_db)):
    return report_config.create(db, obj_in=report_in)

@router.get("/reports", response_model=List[ReportConfigResponse])
def get_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return report_config.get_multi(db, skip=skip, limit=limit)

@router.get("/reports/{report_id}", response_model=ReportConfigResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    rpt = report_config.get(db, id=report_id)
    if not rpt:
        raise HTTPException(status_code=404, detail="Report not found")
    return rpt

@router.put("/reports/{report_id}", response_model=ReportConfigResponse)
def update_report(report_id: int, report_in: ReportConfigUpdate, db: Session = Depends(get_db)):
    rpt = report_config.get(db, id=report_id)
    if not rpt:
        raise HTTPException(status_code=404, detail="Report not found")
    return report_config.update(db, db_obj=rpt, obj_in=report_in)

@router.delete("/reports/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    rpt = report_config.get(db, id=report_id)
    if not rpt:
        raise HTTPException(status_code=404, detail="Report not found")
    report_config.remove(db, id=report_id)
    return {"msg": "Report deleted successfully"}

# --- Datasets ---
@router.post("/reports/{report_id}/datasets", response_model=ReportDatasetResponse)
def create_dataset(report_id: int, dataset_in: ReportDatasetCreate, db: Session = Depends(get_db)):
    # To keep repo simple, we inject report_id into the dict representation
    ds_dict = dataset_in.model_dump()
    ds_dict["report_id"] = report_id
    from ..models.report import ReportDataset
    db_obj = ReportDataset(**ds_dict)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- Metrics ---
@router.post("/reports/{report_id}/metrics", response_model=ReportMetricResponse)
def create_metric(report_id: int, metric_in: ReportMetricCreate, db: Session = Depends(get_db)):
    m_dict = metric_in.model_dump()
    m_dict["report_id"] = report_id
    from ..models.report import ReportMetric
    db_obj = ReportMetric(**m_dict)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# Note: Similarly full CRUD for filters, metrics, conditions, layouts would follow this pattern.
