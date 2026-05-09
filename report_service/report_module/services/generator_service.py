import json
import logging
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.report import ReportInstance
from ..repositories.report_repo import report_config

logger = logging.getLogger(__name__)

class ReportGeneratorService:
    @staticmethod
    def generate_report(db: Session, rpt_id: int, date_from: datetime = None, date_to: datetime = None, generated_by: str = "system"):
        config = report_config.get(db, rpt_id)
        if not config:
            raise ValueError(f"Report Config {rpt_id} not found")

        result_payload = {
            "report_id": rpt_id,
            "report_name": config.name,
            "metrics": {},
            "data": []
        }
        
        row_count = 0
        status = "IN_PROGRESS"
        try:
            for metric in config.metrics:
                ds = next((d for d in config.datasets if d.dataset_id == metric.dataset_id), None)
                if not ds:
                    continue
                
                # Mock calculated metric component
                val = 0.0
                agg_func = metric.aggregation.upper() if metric.aggregation else "COUNT"
                if agg_func == 'AVG':
                    val = 24.5
                elif agg_func == 'SUM':
                    val = 1500.0
                else:
                    val = 5

                # Thresholds
                color = metric.color_hex
                for cond in metric.conditions:
                    if cond.operator == '>' and val > (cond.value_from or 0):
                        color = cond.color_hex
                    elif cond.operator == '<' and val < (cond.value_from or 0):
                        color = cond.color_hex
                    elif cond.operator == 'BETWEEN':
                        if (cond.value_from or 0) <= val <= (cond.value_to or 0):
                            color = cond.color_hex

                result_payload["metrics"][metric.display_name] = {
                    "value": val,
                    "unit": metric.unit,
                    "color": color
                }
            
            row_count = 1
            # Add flat metric object as single-row simulated data grid
            flat_row = {}
            for k, v in result_payload["metrics"].items():
                flat_row[k] = f"{v['value']} {v.get('unit') or ''}"
            result_payload["data"].append(flat_row)
            
            status = "SUCCESS"
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            status = "FAILED"
            result_payload["error"] = str(e)

        instance_data = {
            "report_id": rpt_id,
            "date_from": date_from or config.date_from,
            "date_to": date_to or config.date_to,
            "result_summary": json.dumps(result_payload),
            "row_count": row_count,
            "status": status,
            "generated_at": datetime.utcnow(),
            "generated_by": generated_by
        }
        
        instance = ReportInstance(**instance_data)
        db.add(instance)
        db.commit()
        db.refresh(instance)
        return instance
