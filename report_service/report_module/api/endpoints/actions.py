from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .dependencies import get_db
from ..schemas.report_action import (
    ReportGenerateRequest, ReportExportRequest,
    ReportInstanceResponse, ReportExportResponse
)
from ..services.generator_service import ReportGeneratorService
from ..services.exporter_service import ReportExporterService
from ..repositories.report_repo import report_instance, report_export

router = APIRouter()

@router.post("/reports/{report_id}/generate", response_model=ReportInstanceResponse)
def generate_report(report_id: int, payload: ReportGenerateRequest, db: Session = Depends(get_db)):
    try:
        instance = ReportGeneratorService.generate_report(
            db=db,
            rpt_id=report_id,
            date_from=payload.date_from,
            date_to=payload.date_to
        )
        return instance
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/report-instances/{instance_id}/export", response_model=ReportExportResponse)
def export_report(instance_id: int, payload: ReportExportRequest, db: Session = Depends(get_db)):
    try:
        export = ReportExporterService.export_report(
            db=db,
            instance_id=instance_id,
            format=payload.format
        )
        return export
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/{report_id}/instances", response_model=list[ReportInstanceResponse])
def get_report_instances(report_id: int, db: Session = Depends(get_db)):
    # Quick filter (bypass base repo for custom filter or add it to repo)
    from ..models.report import ReportInstance
    instances = db.query(ReportInstance).filter(ReportInstance.report_id == report_id).all()
    return instances

@router.get("/report-instances/{instance_id}", response_model=ReportInstanceResponse)
def get_report_instance(instance_id: int, db: Session = Depends(get_db)):
    instance = report_instance.get(db, instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
    return instance
