# parsers.py
import json

def parse_table_fixed(text: str) -> tuple:
    """
    Parse a fixed-width table and return both table data and additional content.
    Handles multiple table sections with the same headers by merging them.
    Returns: (table_data, additional_content)
    """
    lines = text.strip().splitlines()

    if len(lines) < 2:
        print("Not enough lines for a table.")
        return [], ""

    # ========== MERGE TABLE CODE START ==========
    # Find all table sections
    table_sections = []
    current_section_start = -1
    
    for i, line in enumerate(lines):
        # Look for separator lines that indicate table headers
        if line and ('|' in line or '---' in line):
            # Check if the previous line looks like headers (has multiple words)
            if i > 0 and len(lines[i-1].split()) > 1:
                if current_section_start >= 0:
                    # End previous section
                    table_sections.append((current_section_start, i-1))
                # Start new section
                current_section_start = i-1
    
    # Add the last section if it exists
    if current_section_start >= 0:
        # Find where this section ends
        section_end = len(lines)
        for i in range(current_section_start + 2, len(lines)):
            # Look for empty lines or JSON content
            if lines[i].strip() == '':
                # Check if there's content after empty line
                remaining_lines = lines[i+1:]
                if remaining_lines and any(line.strip() for line in remaining_lines):
                    section_end = i
                    break
            elif lines[i].strip().startswith('{'):
                section_end = i
                break
        table_sections.append((current_section_start, section_end))

    print("Found table sections:", table_sections)
    
    if not table_sections:
        print("No table sections found.")
        return [], text

    # Parse the first section to get headers and boundaries
    first_section_start, first_section_end = table_sections[0]
    first_section_lines = lines[first_section_start:first_section_end]
    
    header_line = first_section_lines[0]
    separator_line = first_section_lines[1]
    
    print("Header Line", header_line)
    print("Separator Line", separator_line)

    boundaries = [i for i, ch in enumerate(separator_line) if ch == ' ']

    if boundaries and boundaries[0] != 0:
        boundaries = [0] + boundaries
    else:
        boundaries = [0] + boundaries

    split_boundaries = [len(i.strip())+1 for i in separator_line.split(' ')]
    split_boundaries.insert(0, 0)
    split_boundaries = [sum(split_boundaries[:i+1]) for i in range(len(split_boundaries))]
    split_boundaries.pop()

    headers = []
    for i in range(len(split_boundaries) - 1):
        start = split_boundaries[i]
        end = split_boundaries[i+1]
        new_header = header_line[start:end]
        headers.append(new_header.strip())

    # Remove any empty header entries (if any)
    headers = [h for h in headers if h]

    print("Headers", headers)

    # Process all table sections and merge the data
    data = []
    for section_start, section_end in table_sections:
        section_lines = lines[section_start:section_end]
        print(f"Processing section {section_start}-{section_end}: {len(section_lines)} lines")
        
        # Skip header and separator lines (first 2 lines of each section)
        for row in section_lines[2:]:
            parts = []
            for i in range(len(split_boundaries) - 1):
                start = split_boundaries[i]
                end = split_boundaries[i+1]
                new_row_item = row[start:end]
                parts.append(new_row_item.strip())

            if len(parts) == len(headers):
                new_row = dict(zip(headers, parts))
                data.append(new_row)

    # Find additional content (after the last table section)
    last_section_end = table_sections[-1][1] if table_sections else 0
    additional_lines = lines[last_section_end:]
    
    # Clean up additional content - remove empty lines at start
    while additional_lines and not additional_lines[0].strip():
        additional_lines.pop(0)
    
    additional_content = '\n'.join(additional_lines) if additional_lines else ""

    print("Merged data rows:", len(data))
    print("Additional content", additional_content)
    # ========== MERGE TABLE CODE END ==========
    
    return data, additional_content



def parse_table(text: str) -> tuple:
    """
    Parse a table-formatted text into a list of dictionaries and additional content.
    Handles multiple table sections with the same headers by merging them.
    Returns: (table_data, additional_content)
    """
    lines = text.strip().splitlines()
    if len(lines) < 2:
        print("Not enough lines for a table.")
        return [], ""

    # ========== MERGE TABLE CODE START ==========
    # Find all table sections (pipe-delimited tables)
    table_sections = []
    current_section_start = -1
    
    for i, line in enumerate(lines):
        # Look for separator lines that indicate table headers
        if line and '|' in line:
            # Check if the previous line looks like headers (has multiple words)
            if i > 0 and len(lines[i-1].split()) > 1:
                if current_section_start >= 0:
                    # End previous section
                    table_sections.append((current_section_start, i-1))
                # Start new section
                current_section_start = i-1
    
    # Add the last section if it exists
    if current_section_start >= 0:
        # Find where this section ends
        section_end = len(lines)
        for i in range(current_section_start + 2, len(lines)):
            # Look for empty lines or JSON content
            if lines[i].strip() == '':
                # Check if there's content after empty line
                remaining_lines = lines[i+1:]
                if remaining_lines and any(line.strip() for line in remaining_lines):
                    section_end = i
                    break
            elif lines[i].strip().startswith('{'):
                section_end = i
                break
        table_sections.append((current_section_start, section_end))

    print("Found pipe table sections:", table_sections)
    
    if not table_sections:
        print("No table sections found.")
        return [], text

    # Parse the first section to get headers
    first_section_start, first_section_end = table_sections[0]
    first_section_lines = lines[first_section_start:first_section_end]
    
    header_line = first_section_lines[0]
    separator_line = first_section_lines[1]
    
    print("Header Line", header_line)
    print("Separator Line", separator_line)
    
    # Extract headers from the first section
    headers = [h.strip() for h in header_line.split('|')]
    # Remove any empty header entries (if any)
    headers = [h for h in headers if h]
    
    print("Headers", headers)

    # Process all table sections and merge the data
    data = []
    for section_start, section_end in table_sections:
        section_lines = lines[section_start:section_end]
        print(f"Processing pipe section {section_start}-{section_end}: {len(section_lines)} lines")
        
        # Skip header and separator lines (first 2 lines of each section)
        for line in section_lines[2:]:
            # Skip if line is a separator line or empty
            if set(line.strip()) in [{'|'}]:
                continue
            # Remove borders if present and then split
            parts = [p.strip() for p in line.split('|')]
            # Remove empty parts at the end (common with trailing |)
            while parts and not parts[-1]:
                parts.pop()
            if len(parts) == len(headers):
                row = dict(zip(headers, parts))
                data.append(row)

    # Find additional content (after the last table section)
    last_section_end = table_sections[-1][1] if table_sections else 0
    additional_lines = lines[last_section_end:]
    
    # Clean up additional content - remove empty lines at start
    while additional_lines and not additional_lines[0].strip():
        additional_lines.pop(0)
    
    additional_content = '\n'.join(additional_lines) if additional_lines else ""

    print("Merged pipe table rows:", len(data))
    print("Additional content", additional_content)
    # ========== MERGE TABLE CODE END ==========
    
    return data, additional_content



def parse_json(text: str) -> dict:
    """
    Parse JSON text into a dictionary.
    """
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}

def parse_response(raw: str) -> dict:
    """
    Unified response parser.
    Checks if the response is JSON, table formatted, or a simple string,
    and returns a standardized JSON structure.
    """
    

    # Check if text resembles a table (e.g., has headers and delimiters)

    if isinstance(raw, dict) and 'blobs' in raw:
        return {"type": "blobs", "data": raw['blobs']['Query']}
        # return {"type": "table", "data": raw['blobs']['Query']}

    if isinstance(raw, bool):
        return {"type": "string", "data": str(raw).lower()}

    # ========== MERGE TABLE CODE START ==========
    if '|' in raw:
        print("FOUND TABLE")
        table_data, additional_content = parse_table(raw)
        if table_data:
            result = {"type": "table", "data": table_data}
            if additional_content:
                result["additional_content"] = additional_content
            return result
    elif '---' in raw:
        print("FOUND FIXED TABLE NO | DELIMITERS")
        table_data, additional_content = parse_table_fixed(raw)
        if table_data:
            result = {"type": "table", "data": table_data}
            if additional_content:
                result["additional_content"] = additional_content
            return result
    # ========== MERGE TABLE CODE END ==========
        
    if type(raw) is list:
        return {"type": "json", "data": raw}
    
    if type(raw) is dict:
        return {"type": "json", "data": raw}
        
    # Try to parse as JSON first
    # parsed = parse_json(raw_text)
    # if parsed:
    #     return {"type": "json", "data": parsed}
    
    if isinstance(raw, str):
        # Replace \r\n with \n and normalize line endings
        raw = raw.replace('\r\n', '\n').replace('\r', '\n')
        # Remove leading/trailing whitespace
        raw = raw.strip()
        
    # Otherwise, treat it as a simple message
    return {"type": "string", "data": raw}




    


# raw = '\r\n    Process         Status       Details                                                                     \r\n    ---------------|------------|---------------------------------------------------------------------------|\r\n    TCP            |Running     |Listening on: 10.10.1.31:32348, Threads Pool: 6                            |\r\n    REST           |Running     |Listening on: 23.239.12.151:32349, Threads Pool: 5, Timeout: 20, SSL: False|\r\n    Operator       |Not declared|                                                                           |\r\n    Blockchain Sync|Running     |Sync every 30 seconds with master using: 10.10.1.10:32048                  |\r\n    Scheduler      |Running     |Schedulers IDs in use: [0 (system)] [1 (user)]                             |\r\n    Blobs Archiver |Not declared|                                                                           |\r\n    MQTT           |Not declared|                                                                           |\r\n    Message Broker |Not declared|No active connection                                                       |\r\n    SMTP           |Not declared|                                                                           |\r\n    Streamer       |Not declared|                                                                           |\r\n    Query Pool     |Running     |Threads Pool: 3                                                            |\r\n    Kafka Consumer |Not declared|                                                                           |\r\n    gRPC           |Not declared|                                                                           |\r\n    OPC-UA Client  |Not declared|                                                                           |\r\n    Publisher      |Not declared|                                                                           |\r\n    Distributor    |Not declared|                                                                           |\r\n    Consumer       |Not declared|                                                                           |\r\n'

# if __name__ == "__main__":
#     print("Testing parse_table")
#     table_result = parse_response(raw)
#     print("Parsed Table Result:", table_result)