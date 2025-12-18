from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
import json
import json

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
        _update_timestamp,
        load_config,
        execute_config_query
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
            _update_timestamp,
            load_config,
            execute_config_query
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
    report_config_name: str  # Name of the report config file (without extension)
    increment_unit: str
    increment_value: int
    time_column: str
    start_time: str
    end_time: str
    monitor_id: str
    logo_path: Optional[str] = None
    output_dir: Optional[str] = "outputs"
    output_filename: Optional[str] = "power_monitoring_report"
    page_orientation: Optional[str] = "landscape"  # "landscape" or "portrait"

# API endpoints
@api_router.get("/")
async def reportgenerator_info():
    """Get report generator information"""
    return {
        "name": "Power Monitoring Report Generator Plugin",
        "version": "1.0.0",
        "description": "Generates Excel and PDF reports from AnyLog power meter and tap position data",
        "endpoints": [
            "/list-reports - List available report configurations",
            "/monitor-ids-by-report - Get monitor IDs for a specific report",
            "/generate-report - Generate complete PDF report"
        ]
    }

@api_router.get("/list-reports")
def list_reports():
    """List all available report configuration files"""
    try:
        templates_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'reportgenerator',
            'templates'
        )
        
        reports = []
        if os.path.exists(templates_dir):
            for filename in os.listdir(templates_dir):
                if filename.endswith('.json') or filename.endswith('.yaml') or filename.endswith('.yml'):
                    # Skip template file
                    if filename == 'report_config_template.json':
                        continue
                    
                    # Remove extension to get report name
                    report_name = os.path.splitext(filename)[0]
                    file_path = os.path.join(templates_dir, filename)
                    
                    try:
                        # Try to load config to get metadata
                        with open(file_path, 'r') as f:
                            if filename.endswith('.json'):
                                config = json.load(f)
                            else:
                                # Try YAML if available
                                try:
                                    import yaml
                                    config = yaml.safe_load(f)
                                except:
                                    config = {}
                        
                        reports.append({
                            "name": report_name,
                            "filename": filename,
                            "title": config.get("title", report_name),
                            "subtitle": config.get("subtitle", ""),
                            "db_name": config.get("db_name", "")
                        })
                    except Exception as e:
                        # If we can't parse, still include it but without metadata
                        reports.append({
                            "name": report_name,
                            "filename": filename,
                            "title": report_name,
                            "subtitle": "",
                            "db_name": ""
                        })
        
        # Also include the template as a default option
        template_path = os.path.join(templates_dir, 'report_config_template.json')
        if os.path.exists(template_path):
            try:
                with open(template_path, 'r') as f:
                    config = json.load(f)
                reports.insert(0, {
                    "name": "default",
                    "filename": "report_config_template.json",
                    "title": config.get("title", "Default Report"),
                    "subtitle": config.get("subtitle", ""),
                    "db_name": config.get("db_name", "")
                })
            except:
                pass
        
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {str(e)}")

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
    """Get available monitor IDs from the database (legacy endpoint)"""
    try:
        if not HAS_REPORTGENERATOR:
            raise HTTPException(
                status_code=500, 
                detail="Report generator module not available. Please install required dependencies: pandas, openpyxl, reportlab, requests"
            )
        monitor_ids = get_monitor_ids(conn=request.connection, dbms=request.dbms)
        return {
            "success": True,
            "monitor_ids": monitor_ids,
            "count": len(monitor_ids)
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback

@api_router.post("/monitor-ids-by-report")
async def list_monitor_ids_by_report(request: dict):
    """Get list of monitor IDs using report config's db_name"""
    try:
        if not HAS_REPORTGENERATOR:
            raise HTTPException(status_code=500, detail="Report generator module not available")
        
        connection = request.get("connection")
        report_config_name = request.get("report_config_name")
        
        if not connection or not report_config_name:
            raise HTTPException(status_code=400, detail="connection and report_config_name are required")
        
        # Load the report config
        templates_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'reportgenerator',
            'templates'
        )
        
        # Try to find the config file
        config_path = None
        if report_config_name == "default":
            config_path = os.path.join(templates_dir, 'report_config_template.json')
        else:
            for ext in ['.json', '.yaml', '.yml']:
                potential_path = os.path.join(templates_dir, f"{report_config_name}{ext}")
                if os.path.exists(potential_path):
                    config_path = potential_path
                    break
        
        if not config_path or not os.path.exists(config_path):
            raise HTTPException(status_code=404, detail=f"Report config '{report_config_name}' not found")
        
        report_config = load_config(config_path=config_path)
        dbms = report_config.get('db_name')
        
        if not dbms:
            raise HTTPException(status_code=400, detail="Report config missing 'db_name' field")
        
        monitor_ids = get_monitor_ids(conn=connection, dbms=dbms)
        return {
            "success": True,
            "monitor_ids": monitor_ids,
            "count": len(monitor_ids),
            "db_name": dbms
        }
    except HTTPException:
        raise
    except Exception as e:
        # error_detail = f"Failed to get monitor IDs: {str(e)}\nTraceback: {traceback.format_exc()}"
        error_detail = f"Failed to get monitor IDs: {str(e)}"
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
        
        # Load report configuration first to get db_name
        templates_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'reportgenerator',
            'templates'
        )
        
        # Find the config file
        config_path = None
        if request.report_config_name == "default":
            config_path = os.path.join(templates_dir, 'report_config_template.json')
        else:
            for ext in ['.json', '.yaml', '.yml']:
                potential_path = os.path.join(templates_dir, f"{request.report_config_name}{ext}")
                if os.path.exists(potential_path):
                    config_path = potential_path
                    break
        
        if not config_path or not os.path.exists(config_path):
            raise HTTPException(status_code=404, detail=f"Report config '{request.report_config_name}' not found")
        
        report_config = load_config(config_path=config_path)
        dbms = report_config.get('db_name')
        
        if not dbms:
            raise HTTPException(status_code=400, detail="Report config missing 'db_name' field")
        
        # Validate data exists
        if not check_data(conn=request.connection, dbms=dbms):
            raise HTTPException(
                status_code=400,
                detail="Failed to locate one or more associated tables in the database"
            )

        # report_config and dbms are already loaded above
        # Update end timestamp (add 1 hour)
        end_time = _update_timestamp(request.end_time)

        # Get all queries from config - these can be any queries, not hardcoded names
        queries_config = report_config.get('queries', {})
        
        if not queries_config:
            raise HTTPException(
                status_code=400,
                detail="No queries defined in report configuration"
            )
        
        # Determine which queries are needed from column definitions
        table_config = report_config.get('table_columns', {})
        column_definitions = table_config.get('column_definitions', [])
        
        # Extract unique query names from column definitions
        # Each column definition specifies which query provides its data via 'source_query'
        required_queries = set()
        for col_def in column_definitions:
            source_query = col_def.get('source_query')
            if source_query:
                required_queries.add(source_query)
        
        # If no column definitions, use all queries in config (fallback)
        if not required_queries and queries_config:
            required_queries = set(queries_config.keys())
        
        # Execute all required queries dynamically
        query_results = {}
        for query_name in required_queries:
            if query_name in queries_config:
                # Execute query from config
                query_template = queries_config[query_name]
                
                # Determine if monitor_id is needed (check if placeholder exists in query)
                needs_monitor_id = '{monitor_id}' in query_template
                monitor_id_param = request.monitor_id if needs_monitor_id else None
                
                try:
                    query_data = execute_config_query(
                        conn=request.connection,
                        dbms=dbms,
                        query_template=query_template,
                        increment_value=request.increment_value,
                        increment_unit=request.increment_unit,
                        time_column=request.time_column,
                        start_time=request.start_time,
                        end_time=end_time,
                        monitor_id=monitor_id_param
                    )
                    query_results[query_name] = query_data
                except Exception as e:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to execute query '{query_name}': {str(e)}"
                    )
            else:
                # Query not found in config - this is an error
                raise HTTPException(
                    status_code=400,
                    detail=f"Query '{query_name}' not found in config but required by column definitions"
                )
        
        # Convert query results to dataframes
        query_dataframes = {}
        for query_name, query_data in query_results.items():
            if query_data:
                query_dataframes[query_name] = pd.DataFrame(query_data)
            else:
                # Empty result - create empty dataframe with expected structure
                query_dataframes[query_name] = pd.DataFrame()

        # Get merging configuration from config
        merge_config = report_config.get('data_merging', {})
        join_key = merge_config.get('join_key', 'hour')
        join_method = merge_config.get('join_method', 'left')
        timestamp_field = merge_config.get('timestamp_field', 'min_ts')
        timestamp_floor = merge_config.get('timestamp_floor', 'h')
        primary_query = merge_config.get('primary_query')  # Primary query for merging (first one if not specified)
        
        # If no primary query specified, use the first query
        if not primary_query and query_dataframes:
            primary_query = list(query_dataframes.keys())[0]
        
        # Start with primary query dataframe
        if primary_query not in query_dataframes:
            raise HTTPException(
                status_code=400,
                detail=f"Primary query '{primary_query}' not found in query results"
            )
        
        merged_df = query_dataframes[primary_query].copy()
        
        # Extract join key from timestamp field for primary query
        if timestamp_field in merged_df.columns:
            merged_df[join_key] = pd.to_datetime(merged_df[timestamp_field]).dt.floor(timestamp_floor)
        
        # Merge all other queries into the primary one
        for query_name, query_df in query_dataframes.items():
            if query_name == primary_query:
                continue  # Skip primary query
            
            # Extract join key from timestamp field
            if timestamp_field in query_df.columns:
                query_df[join_key] = pd.to_datetime(query_df[timestamp_field]).dt.floor(timestamp_floor)
            
            # Determine which columns to merge from this query
            # Get all columns that might be needed from this query based on column definitions
            merge_columns = [join_key]
            for col_def in column_definitions:
                source_query = col_def.get('source_query')
                if source_query == query_name:
                    source = col_def.get('source')
                    if isinstance(source, str) and source in query_df.columns:
                        merge_columns.append(source)
                    elif isinstance(source, list):
                        for s in source:
                            if s in query_df.columns:
                                merge_columns.append(s)
            
            # Remove duplicates while preserving order
            merge_columns = list(dict.fromkeys(merge_columns))
            
            # Merge this query's data into the merged dataframe
            if merge_columns:
                merged_df = pd.merge(merged_df, query_df[merge_columns], on=join_key, how=join_method)

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

        # Get logo from config or request
        logo_url = report_config.get('logo_url') or request.logo_path
        if not logo_url:
            # Use default logo if none specified
            logo_url = "https://tse1.mm.bing.net/th/id/OIP.7bJT74xSx81aYJgz-rl-TwAAAA?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3"
        
        # Download logo if URL provided
        try:
            if logo_url:
                config['logo_path'] = image_download(logo_url)
            else:
                config['logo_path'] = None
        except Exception:
            config['logo_path'] = None
        
        # Generate report with config and orientation
        page_orientation = request.page_orientation or 'landscape'
        pdf_path = generate_report(merged_df, config, report_config=report_config, page_orientation=page_orientation)

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

