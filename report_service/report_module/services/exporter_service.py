import json
import os
import csv
from datetime import datetime
from sqlalchemy.orm import Session
import openpyxl
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from ..models.report import ReportExport
from ..repositories.report_repo import report_instance

class ReportExporterService:
    @staticmethod
    def export_report(db: Session, instance_id: int, format: str, exported_by: str = "system"):
        instance = report_instance.get(db, instance_id)
        if not instance:
            raise ValueError(f"Report Instance {instance_id} not found")
        
        results = json.loads(instance.result_summary) if instance.result_summary else {"data": []}
        data = results.get("data", [])
        
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        export_dir = "exports"
        os.makedirs(export_dir, exist_ok=True)
        file_path = ""
        file_name = f"report_{instance_id}_{timestamp}.{format}"
        
        if format == 'xlsx':
            file_path = os.path.join(export_dir, file_name)
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Report Data"
            
            if data and len(data) > 0:
                headers = list(data[0].keys())
                ws.append(headers)
                for row_dict in data:
                    row = [str(row_dict.get(h, '')) for h in headers]
                    ws.append(row)
            wb.save(file_path)
            
        elif format == 'csv':
            file_path = os.path.join(export_dir, file_name)
            with open(file_path, mode='w', newline='', encoding='utf-8') as f:
                if data and len(data) > 0:
                    writer = csv.DictWriter(f, fieldnames=data[0].keys())
                    writer.writeheader()
                    for row in data:
                        flat_row = {k: str(v) for k,v in row.items()}
                        writer.writerow(flat_row)

        elif format == 'pdf':
            file_path = os.path.join(export_dir, file_name)
            c = canvas.Canvas(file_path, pagesize=A4)
            width, height = A4
            
            # Use basic fonts for now
            title = f"Report Result (Instance {instance_id})"
            c.setFont("Helvetica-Bold", 16)
            c.drawString(72, height - 72, title)
            
            c.setFont("Helvetica", 12)
            c.drawString(72, height - 90, f"Generated at: {timestamp}")
            
            y = height - 120
            for i, row in enumerate(data):
                c.drawString(72, y, str(row))
                y -= 25
                if y < 72:
                    c.showPage()
                    c.setFont("Helvetica", 12)
                    y = height - 72
            c.save()
        else:
            raise ValueError(f"Unsupported format {format}")

        export = ReportExport(
            instance_id=instance_id,
            format=format,
            file_name=file_name,
            file_path=os.path.abspath(file_path),
            exported_at=datetime.utcnow(),
            exported_by=exported_by
        )
        db.add(export)
        db.commit()
        db.refresh(export)
        
        return export
