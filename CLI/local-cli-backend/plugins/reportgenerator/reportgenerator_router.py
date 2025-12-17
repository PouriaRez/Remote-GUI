from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os

# Create the API router FIRST - this ensures it's always available even if imports fail
api_router = APIRouter(prefix="/reportgenerator", tags=["Report Generator"])
print("✅ Report Generator router created with prefix:", api_router.prefix)

# Try to import dependencies - these might not be available in all environments
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    pd = None

# Import reportgenerator functions - try both relative and absolute imports
HAS_REPORTGENERATOR = False
try:
    from .reportgenerator import (
        check_data,
        get_monitor_ids,
        select_power_plant,
        select_tap_value,
        generate_report,
        image_download,
        _update_timestamp
    )
    HAS_REPORTGENERATOR = True
    print("✅ Successfully imported reportgenerator functions")
except ImportError as e1:
    print(f"⚠️  Relative import failed: {e1}")
    try:
        # Try absolute import as fallback
        from plugins.reportgenerator.reportgenerator import (
            check_data,
            get_monitor_ids,
            select_power_plant,
            select_tap_value,
            generate_report,
            image_download,
            _update_timestamp
        )
        HAS_REPORTGENERATOR = True
        print("✅ Successfully imported reportgenerator functions (absolute import)")
    except ImportError as e2:
        HAS_REPORTGENERATOR = False
        print(f"❌ Could not import reportgenerator functions:")
        print(f"   Relative import error: {e1}")
        print(f"   Absolute import error: {e2}")
        print(f"   This usually means missing dependencies: pandas, openpyxl, reportlab, requests")
        # Create dummy functions to prevent errors
        def check_data(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Report generator module not available - missing dependencies")
        def get_monitor_ids(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Report generator module not available - missing dependencies")
        def select_power_plant(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Report generator module not available - missing dependencies")
        def select_tap_value(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Report generator module not available - missing dependencies")
        def generate_report(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Report generator module not available - missing dependencies")
        def image_download(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Report generator module not available - missing dependencies")
        def _update_timestamp(*args, **kwargs):
            raise HTTPException(status_code=500, detail="Report generator module not available - missing dependencies")

# Request/Response models
class CheckDataRequest(BaseModel):
    connection: str
    dbms: str

class MonitorIdsRequest(BaseModel):
    connection: str
    dbms: str

class PowerPlantRequest(BaseModel):
    connection: str
    dbms: str
    increment_unit: str
    increment_value: int
    time_column: str
    start_time: str
    end_time: str
    monitor_id: str

class TapValueRequest(BaseModel):
    connection: str
    dbms: str
    increment_unit: str
    increment_value: int
    time_column: str
    start_time: str
    end_time: str

class GenerateReportRequest(BaseModel):
    connection: str
    dbms: str
    increment_unit: str
    increment_value: int
    time_column: str
    start_time: str
    end_time: str
    monitor_id: str
    logo_path: Optional[str] = None
    output_dir: Optional[str] = "outputs"
    output_filename: Optional[str] = "power_monitoring_report"

# API endpoints
@api_router.get("/")
async def reportgenerator_info():
    """Get report generator information"""
    return {
        "name": "Power Monitoring Report Generator Plugin",
        "version": "1.0.0",
        "description": "Generates Excel and PDF reports from AnyLog power meter and tap position data",
        "endpoints": [
            "/check-data - Validate database and tables",
            "/monitor-ids - Get available monitor IDs",
            "/power-plant-data - Get power plant meter data",
            "/tap-value-data - Get PV tap position data",
            "/generate-report - Generate complete PDF report"
        ]
    }

@api_router.post("/check-data")
async def validate_data(request: CheckDataRequest):
    """Validate database and tables exist"""
    try:
        result = check_data(conn=request.connection, dbms=request.dbms)
        return {
            "success": True,
            "data_exists": result,
            "message": "Data validation completed" if result else "One or more tables not found"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check data: {str(e)}")

@api_router.post("/monitor-ids")
async def list_monitor_ids(request: MonitorIdsRequest):
    """Get available monitor IDs from the database"""
    try:
        if not HAS_REPORTGENERATOR:
            raise HTTPException(
                status_code=500, 
                detail="Report generator module not available. Please install required dependencies: pandas, openpyxl, reportlab, requests"
            )
        print(f"Calling get_monitor_ids with conn={request.connection}, dbms={request.dbms}")
        monitor_ids = get_monitor_ids(conn=request.connection, dbms=request.dbms)
        print(f"Successfully got {len(monitor_ids)} monitor IDs")
        return {
            "success": True,
            "monitor_ids": monitor_ids,
            "count": len(monitor_ids)
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Failed to get monitor IDs: {str(e)}\nTraceback: {traceback.format_exc()}"
        print(f"❌ ERROR in list_monitor_ids: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Failed to get monitor IDs: {str(e)}")

@api_router.post("/power-plant-data")
async def get_power_plant_data(request: PowerPlantRequest):
    """Get power plant meter data"""
    try:
        data = select_power_plant(
            conn=request.connection,
            dbms=request.dbms,
            increment_unit=request.increment_unit,
            increment_value=request.increment_value,
            time_column=request.time_column,
            start_time=request.start_time,
            end_time=request.end_time,
            monitor_id=request.monitor_id
        )
        return {
            "success": True,
            "data": data,
            "count": len(data) if data else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get power plant data: {str(e)}")

@api_router.post("/tap-value-data")
async def get_tap_value_data(request: TapValueRequest):
    """Get PV tap position data"""
    try:
        data = select_tap_value(
            conn=request.connection,
            dbms=request.dbms,
            increment_unit=request.increment_unit,
            increment_value=request.increment_value,
            time_column=request.time_column,
            start_time=request.start_time,
            end_time=request.end_time
        )
        return {
            "success": True,
            "data": data,
            "count": len(data) if data else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get tap value data: {str(e)}")

@api_router.post("/generate-report")
async def create_report(request: GenerateReportRequest):
    """Generate complete PDF report from power monitoring data"""
    try:
        if not HAS_PANDAS:
            raise HTTPException(status_code=500, detail="pandas is required but not installed")
        if not HAS_REPORTGENERATOR:
            raise HTTPException(status_code=500, detail="Report generator module not available")
        
        # Validate data exists
        if not check_data(conn=request.connection, dbms=request.dbms):
            raise HTTPException(
                status_code=400,
                detail="Failed to locate one or more associated tables in the database"
            )

        # Update end timestamp (add 1 hour)
        end_time = _update_timestamp(request.end_time)

        # Get power plant data
        pp_data = select_power_plant(
            conn=request.connection,
            dbms=request.dbms,
            increment_value=request.increment_value,
            increment_unit=request.increment_unit,
            time_column=request.time_column,
            start_time=request.start_time,
            end_time=end_time,
            monitor_id=request.monitor_id
        )

        # Get tap value data
        tap_data = select_tap_value(
            conn=request.connection,
            dbms=request.dbms,
            increment_value=request.increment_value,
            increment_unit=request.increment_unit,
            time_column=request.time_column,
            start_time=request.start_time,
            end_time=end_time
        )

        # Create dataframes
        pp_df = pd.DataFrame(pp_data)
        tap_df = pd.DataFrame(tap_data)

        # Extract hour from timestamps for joining
        pp_df['hour'] = pd.to_datetime(pp_df['min_ts']).dt.floor('h')
        tap_df['hour'] = pd.to_datetime(tap_df['min_ts']).dt.floor('h')

        # Merge data on hour
        merged_df = pd.merge(pp_df, tap_df[['hour', 'tap']], on='hour', how='left')

        # Prepare config
        config = {
            'start_time': request.start_time,
            'end_time': end_time,
            'monitor_id': request.monitor_id,
            'increment_unit': request.increment_unit,
            'increment_value': request.increment_value,
            'logo_path': request.logo_path or "https://tse1.mm.bing.net/th/id/OIP.7bJT74xSx81aYJgz-rl-TwAAAA?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3",
            'output_dir': request.output_dir,
            'output_filename': request.output_filename
        }

        # Create output directory if it doesn't exist
        if not os.path.isdir(config['output_dir']):
            os.makedirs(config['output_dir'])

        # Download logo if URL provided
        if config['logo_path']:
            config['logo_path'] = image_download(config['logo_path'])

        # Generate report
        pdf_path = generate_report(merged_df, config)

        # Return the PDF file for inline viewing (can be downloaded via button)
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail="Generated PDF file not found")
        
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"{config['output_filename']}.pdf",
            headers={"Content-Disposition": f"inline; filename={config['output_filename']}.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

