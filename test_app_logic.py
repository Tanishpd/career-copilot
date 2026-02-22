
import re
import json
import html

# Mocking the logic added to app.py
def process_q_content(q_content):
    test_cases = []
    
    # Try to find example_cases_data div (class or id)
    match_ex = re.search(r"(?:class|id)=['\"]example_cases_data['\"][^>]*>(.*?)</div>", q_content)
    if match_ex:
        try:
             json_str = match_ex.group(1)
             examples = json.loads(json_str)
             for case in examples:
                 case['isHidden'] = False
             test_cases.extend(examples)
        except:
             pass

    # Try to find hidden_cases_data div (class or id)
    match_hd = re.search(r"(?:class|id)=['\"]hidden_cases_data['\"][^>]*>(.*?)</div>", q_content)
    if match_hd:
        try:
             json_str = match_hd.group(1)
             hidden = json.loads(json_str) 
             for case in hidden:
                 case['isHidden'] = True
             test_cases.extend(hidden)
        except:
             pass
    
    # Validation Logic Added
    has_examples = any(not tc.get('isHidden', False) for tc in test_cases)
    
    if not has_examples:
        # Tables usually have "Input" and "Output" headers
        # Regex to find table
        table_matches = re.finditer(r"<table[^>]*>(.*?)</table>", q_content, re.DOTALL | re.IGNORECASE)
        
        for table_match in table_matches:
            table_content = table_match.group(1)
            
            # Find headers - simplified regex
            headers = re.findall(r"<th[^>]*>(.*?)</th>", table_content, re.DOTALL | re.IGNORECASE)
            headers = [h.strip().lower() for h in headers] # clean and lower
            
            # Identify columns
            input_idx = -1
            output_idx = -1
            
            for i, h in enumerate(headers):
                if "input" in h: input_idx = i
                if "output" in h: output_idx = i
            
            if input_idx != -1 and output_idx != -1:
                # Found a valid table, parse rows
                rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_content, re.DOTALL | re.IGNORECASE)
                for row in rows:
                    if "<th" in row.lower(): continue # Skip header row if re-found
                    
                    cols = re.findall(r"<td[^>]*>(.*?)</td>", row, re.DOTALL | re.IGNORECASE)
                    
                    # Ensure we have enough columns
                    if len(cols) > max(input_idx, output_idx):
                        # Use simple regex substitution to handle <br> and <p> as newlines
                        
                        def clean_html(raw_html):
                            # Replace <br>, <br/>, <br />, <p>, </div> with newlines
                            text = re.sub(r'(?i)<br\s*/?>', '\n', raw_html)
                            text = re.sub(r'(?i)</p>', '\n', text)
                            text = re.sub(r'(?i)</div>', '\n', text)
                            # Remove other tags
                            text = re.sub(r'<[^>]+>', '', text)
                            # Unescape entities
                            text = html.unescape(text)
                            return text.strip()

                        inp = clean_html(cols[input_idx])
                        out = clean_html(cols[output_idx])
                        
                        if inp or out: # Avoid empty rows
                            test_cases.append({
                                "input": inp,
                                "output": out, 
                                "isHidden": False
                            })
                # If we found cases in a table, break (assuming only one example table)
                if any(not tc.get('isHidden', False) for tc in test_cases):
                     break
                     
    return test_cases

multiline_table = """
<table border="1">
    <tr><th>Input</th><th>Output</th></tr>
    <tr><td>3 4<br>A B C E<br>S F C S</td><td>true</td></tr>
</table>
"""

print("--- Test Multiline ---")
res = process_q_content(multiline_table)
print(json.dumps(res, indent=2))
