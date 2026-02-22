
import re
import json

def parse_test_cases(q_content):
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
             print("Found examples in hidden div")
             return test_cases
        except:
             pass

    # Fallback to HTML Table parsing
    print("Falling back to table parsing")
    
    # Find table
    table_match = re.search(r"<table[^>]*>(.*?)</table>", q_content, re.DOTALL | re.IGNORECASE)
    if table_match:
        table_content = table_match.group(1)
        
        # Find headers to identify columns
        headers = re.findall(r"<th[^>]*>(.*?)</th>", table_content, re.DOTALL | re.IGNORECASE)
        headers = [h.strip().lower() for h in headers]
        
        input_idx = -1
        output_idx = -1
        
        for i, h in enumerate(headers):
            if "input" in h: input_idx = i
            if "output" in h: output_idx = i
            
        if input_idx != -1 and output_idx != -1:
            # Find rows
            rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_content, re.DOTALL | re.IGNORECASE)
            for row in rows:
                cols = re.findall(r"<td[^>]*>(.*?)</td>", row, re.DOTALL | re.IGNORECASE)
                if len(cols) > max(input_idx, output_idx):
                    inp = cols[input_idx].strip()
                    out = cols[output_idx].strip()
                    
                    # Basic cleanup - remove HTML tags if any inside cells? 
                    # For now assume plain text or simple formatting. 
                    # Maybe unescape HTML entities?
                    
                    test_cases.append({
                        "input": inp,
                        "output": out, # Maps to 'output' in test case structure
                        "explanation": "",
                        "isHidden": False
                    })
    
    return test_cases

# Test Scenarios
html_with_div = """
<p>Description</p>
<div id="example_cases_data">[{"input": "1 2", "output": "3", "explanation": "1+2=3"}]</div>
"""

html_with_table = """
<h3>Problem</h3>
<p>Add two numbers</p>
<table border="1">
    <tr>
        <th>Input</th>
        <th>Output</th>
        <th>Explanation</th>
    </tr>
    <tr>
        <td>5 10</td>
        <td>15</td>
        <td>5+10=15</td>
    </tr>
    <tr>
        <td>-1 1</td>
        <td>0</td>
        <td></td>
    </tr>
</table>
"""

html_mixed = """
<table border="1">
    <thead>
        <tr><th>Example Input</th><th>Expected Output</th></tr>
    </thead>
    <tbody>
        <tr><td>10</td><td>100</td></tr>
    </tbody>
</table>
"""

print("--- Test 1: Hidden Div ---")
print(json.dumps(parse_test_cases(html_with_div), indent=2))

print("\n--- Test 2: HTML Table Standard ---")
print(json.dumps(parse_test_cases(html_with_table), indent=2))

print("\n--- Test 3: HTML Table Mixed Headers ---")
print(json.dumps(parse_test_cases(html_mixed), indent=2))
