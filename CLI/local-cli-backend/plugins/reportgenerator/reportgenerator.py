#!/usr/bin/env python3
"""
Power Monitoring Report Generator
Generates Excel and PDF reports from AnyLog power meter and tap position data.

Usage:
    python generate_power_report.py

Requirements:
    pip install pandas openpyxl pillow reportlab

For PDF conversion, LibreOffice must be installed:
    libreoffice --headless --convert-to pdf --outdir <output_dir> <excel_file>
"""

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, Border, Side, PatternFill
from openpyxl.worksheet.page import PageMargins
from openpyxl.drawing.image import Image
from datetime import datetime, timedelta
import subprocess
import requests
import os

from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Image as RLImage, Paragraph, Spacer
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors


def _get_data(conn: str, command: str, destination: str = None):
    headers = {
        "command": command,
        "User-Agent": "AnyLog/1.23"
    }
    if destination:
        headers["destination"] = destination

    try:
        response = requests.get(url=f"http://{conn}", headers=headers)
        response.raise_for_status()
    except Exception as error:
        raise Exception(error)
    return response


def _update_timestamp(end_time) -> str:
    # update end timestamp
    end_time = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S")
    end_time += timedelta(hours=1)
    end_time = end_time.strftime("%Y-%m-%d %H:%M:%S")
    return end_time


def image_download(image_url):
    image_url_path = os.path.expandvars(os.path.expanduser(image_url))
    if os.path.isfile(image_url_path):
        return image_url_path
    try:
        content = requests.get(image_url_path).content
        with open('new_image.png', 'wb') as f:
            f.write(content)
    except Exception as error:
        raise Exception(error)
    return 'new_image.png'


# Validate database and tables
def check_data(conn: str, dbms: str):
    command = f"get data nodes where dbms={dbms} and table=%s and format=json"
    is_tables = True
    for table in ["pp_pm", "pv"]:
        response = _get_data(conn=conn, command=command % table)
        if not response.json():
            is_tables = False
    return is_tables


# monitor_ids
def get_monitor_ids(conn: str, dbms: str):
    output = []
    query = "SELECT distinct(monitor_id) AS monitor_id FROM pp_pm"
    command = f"sql {dbms} format=json and stat=false {query}"
    response = _get_data(conn=conn, command=command, destination="network")
    try:
        for monitor_id in response.json()['Query']:
            output.append(monitor_id['monitor_id'])
    except Exception as error:
        raise Exception(error)
    return output


# Power meter data from AnyLog query:
def select_power_plant(conn: str, dbms: str, increment_unit: str, increment_value: int, time_column: str,
                       start_time: str, end_time: str, monitor_id: str):
    query = f"""
    SELECT 
        increments({increment_unit}, {increment_value}, {time_column}), monitor_id, MIN(timestamp)::ljust(19) AS min_ts, 
        MAX(timestamp)::ljust(19) AS max_ts, AVG(realpower) AS kw, AVG(a_n_voltage) AS a_kv, 
        AVG(b_n_voltage) AS b_kv, AVG(c_n_voltage) AS c_kv, AVG(powerfactor) AS pf, 
        AVG(a_current) AS amp_1, AVG(b_current) AS amp_2, AVG(c_current) AS amp_3, 
        AVG(frequency) AS hz
    FROM 
        pp_pm 
    WHERE
        {time_column} >= '{start_time}' AND 
        {time_column} < '{end_time}' AND 
        monitor_id='{monitor_id}' 
    GROUP BY 
        monitor_id 
    ORDER BY 
        min_ts
    """

    command = f"sql {dbms} format=json and stat=false {query.replace('\n', '').strip()}"
    response = _get_data(conn=conn, command=command, destination="network")
    try:
        return response.json()['Query']
    except Exception as error:
        raise Exception(error)


# PV meter data from AnyLog query:
def select_tap_value(conn: str, dbms: str, increment_unit: str, increment_value: int, time_column: str, start_time: str,
                     end_time: str):
    query = f"""
    SELECT 
        increments({increment_unit}, {increment_value}, {time_column}), monitor_id, MIN(timestamp)::ljust(19) AS min_ts, 
        MAX(timestamp)::ljust(19) AS max_ts, AVG(value) AS tap
    FROM 
        pv 
    WHERE 
        {time_column} >= '{start_time}' AND {time_column} < '{end_time}'
    GROUP BY 
        monitor_id 
    ORDER BY 
        min_ts
    """
    command = f"sql {dbms} format=json and stat=false {query.replace('\n', '').strip()}"
    response = _get_data(conn=conn, command=command, destination="network")
    try:
        return response.json()['Query']
    except Exception as error:
        raise Exception(error)


def generate_report(merged_df, config):
    """Generate the Power Monitoring PDF report."""
    pdf_path = os.path.join(config['output_dir'], f"{config['output_filename']}.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=landscape(letter),
        leftMargin=20, rightMargin=20, topMargin=20, bottomMargin=20
    )

    elements = []
    styles = getSampleStyleSheet()

    # Create centered style for subtitle
    centered_style = ParagraphStyle(
        'Centered',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=11,
        spaceAfter=8
    )

    # Create custom title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=13,
        alignment=TA_CENTER,
        spaceAfter=6
    )

    # Timestamp and Logo on same line
    now = datetime.now()
    timestamp = f"{now.month}/{now.day}/{now.year} {now.strftime('%H:%M:%S')}"

    if os.path.exists(config["logo_path"]):
        # Create a table to align timestamp (left) and logo (right)
        logo = RLImage(config["logo_path"])
        logo.drawHeight = 40
        logo.drawWidth = 40

        header_table = Table([[Paragraph(timestamp, styles["Normal"]), logo]], colWidths=[700, 50])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(header_table)
    else:
        elements.append(Paragraph(timestamp, styles["Normal"]))

    elements.append(Spacer(1, 8))

    # Title (centered)
    elements.append(Paragraph(
        "<b>CITY OF SABETHA MUNICIPAL POWER PLANT</b>",
        title_style
    ))

    # Subtitle (centered)
    elements.append(Paragraph(
        "<b>EVERGY INTERCONNECTION</b>",
        centered_style
    ))
    elements.append(Spacer(1, 6))

    # Data Table - AMPS and VOLTAGE in row 0, other labels in row 1
    table_data = []

    # Row 0: Span all columns with labels, no empty cells
    table_data.append([
        "", "", "", "", "AMPS", "", "",
        "VOLTAGE", "", "", "", ""
    ])

    # Row 1: All column sub-headers
    table_data.append([
        "DATE/TIME", "kW", "KV", "PF", "1", "2", "3",
        "1", "2", "3", "Hz", "TAP"
    ])

    # Data rows
    for _, row in merged_df.iterrows():
        ts = pd.to_datetime(row["min_ts"]).floor("h")
        # Format date without leading zeros (cross-platform)
        datetime_str = f"{ts.month}/{ts.day}/{ts.year} {ts.strftime('%H:%M:%S')}"

        table_data.append([
            datetime_str,
            int(round(row["kw"])),
            int(round((row["a_kv"] + row["b_kv"] + row["c_kv"]) / 3)),
            round(row["pf"] / 100, 2),
            int(round(row["amp_1"])),
            int(round(row["amp_2"])),
            int(round(row["amp_3"])),
            round(row["a_kv"] / 100, 2),
            round(row["b_kv"] / 100, 2),
            round(row["c_kv"] / 100, 2),
            round(row["hz"] / 100, 2),
            int(round(row["tap"])) if pd.notna(row["tap"]) else ""
        ])

    # Create table with comfortable sizing
    table = Table(table_data, repeatRows=2)

    table_style = TableStyle([
        # Row 0: Labels spanning - gray background, no empty cells
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("SPAN", (0, 0), (0, 0)),  # DATE/TIME
        ("SPAN", (1, 0), (1, 0)),  # kW
        ("SPAN", (2, 0), (2, 0)),  # KV
        ("SPAN", (3, 0), (3, 0)),  # PF
        ("SPAN", (4, 0), (6, 0)),  # AMPS spans 3 columns
        ("SPAN", (7, 0), (9, 0)),  # VOLTAGE spans 3 columns
        ("SPAN", (10, 0), (10, 0)),  # Hz
        ("SPAN", (11, 0), (11, 0)),  # TAP
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),

        # Row 1: Sub-headers - gray background
        ("BACKGROUND", (0, 1), (-1, 1), colors.lightgrey),
        ("TEXTCOLOR", (0, 1), (-1, 1), colors.black),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, 1), 8),
        ("ALIGN", (0, 1), (-1, 1), "CENTER"),

        # Data rows styling
        ("ALIGN", (1, 2), (-1, -1), "CENTER"),
        ("ALIGN", (0, 2), (0, -1), "LEFT"),
        ("FONTSIZE", (0, 2), (-1, -1), 8),

        # Comfortable padding for all cells
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),

        # Grid and borders
        ("GRID", (0, 0), (-1, -1), 0.25, colors.black),
        ("BOX", (0, 0), (-1, -1), 1, colors.black),

        # THICKER LINE between row 1 and row 2 (between headers and data)
        ("LINEBELOW", (0, 1), (-1, 1), 2, colors.black),

        # THICKER LINE between column 0 and column 1 (DATE/TIME and kW)
        ("LINEAFTER", (0, 0), (0, -1), 2, colors.black),
    ])
    table.setStyle(table_style)
    table.hAlign = 'LEFT'  # Left-justify the table

    elements.append(table)

    # Footer section - 2 columns, 5 rows (2 blank lines above)
    elements.append(Spacer(1, 24))  # 2 blank lines

    footer_data = [
        ["DAILY READING", ""],
        ["KWH IN", ""],
        ["TOTAL GENERATION", ""],
        ["TOTAL KW", ""],
        ["KWH OUT", ""]
    ]

    footer_table = Table(footer_data, colWidths=[140, 140])
    footer_table_style = TableStyle([
        # First column (labels) - bold, left-aligned
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),

        # Second column (empty boxes) - centered
        ("ALIGN", (1, 0), (1, -1), "CENTER"),

        # All cells
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ])
    footer_table.setStyle(footer_table_style)
    footer_table.hAlign = 'LEFT'  # Left-justify the footer table

    elements.append(footer_table)

    doc.build(elements)

    print(f"PDF file created: {pdf_path}")
    return pdf_path


# def main():
#     """Main function to generate the report."""
#     conn = "23.239.12.151:32349"

#     # the following are user configurable
#     dbms = "cos"
#     increment_unit = "hour"
#     increment_value = 1
#     time_column = "timestamp"
#     start_time = "2025-12-03 00:00:00"
#     end_time = "2025-12-04 00:00:00"
#     monitor_id = "KPL"

#     if not check_data(conn=conn, dbms=dbms):
#         raise ValueError("Failed to locate one or more associated table in cos")

#     end_time = _update_timestamp(end_time=end_time)
#     pp_data = select_power_plant(conn=conn, dbms=dbms, increment_value=increment_value,
#                                  increment_unit=increment_unit, time_column=time_column, start_time=start_time,
#                                  end_time=end_time, monitor_id=monitor_id)
#     tap_data = select_tap_value(conn=conn, dbms=dbms, increment_value=increment_value,
#                                 increment_unit=increment_unit, time_column=time_column, start_time=start_time,
#                                 end_time=end_time)
#     # Create dataframes
#     pp_df = pd.DataFrame(pp_data)
#     tap_df = pd.DataFrame(tap_data)

#     # Extract hour from timestamps for joining
#     pp_df['hour'] = pd.to_datetime(pp_df['min_ts']).dt.floor('h')
#     tap_df['hour'] = pd.to_datetime(tap_df['min_ts']).dt.floor('h')

#     # Merge data on hour
#     merged_df = pd.merge(pp_df, tap_df[['hour', 'tap']], on='hour', how='left')

#     CONFIG = {
#         'start_time': start_time,
#         'end_time': end_time,
#         'monitor_id': monitor_id,
#         'increment_unit': increment_unit,
#         'increment_value': increment_value,
#         'logo_path': "https://tse1.mm.bing.net/th/id/OIP.7bJT74xSx81aYJgz-rl-TwAAAA?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3",
#         'output_dir': 'outputs',
#         'output_filename': 'power_monitoring_report'
#     }

#     if not os.path.isdir(CONFIG['output_dir']):
#         os.makedirs(CONFIG['output_dir'])

#     CONFIG['logo_path'] = image_download(CONFIG['logo_path'])

#     print("Generating Power Monitoring Report...")
#     print(f"Date Range: {CONFIG['start_time']} to {CONFIG['end_time']}")
#     print(f"Monitor ID: {CONFIG['monitor_id']}")
#     print("-" * 50)

#     # Convert to PDF
#     generate_report(merged_df, CONFIG)

#     print("-" * 50)
#     print("Report generation complete!")


# if __name__ == '__main__':
#     main()