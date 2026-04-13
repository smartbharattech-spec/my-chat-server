
import re

def find_tag_mismatches(filepath, tag_name='Box'):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    stack = []
    
    # Regex to find <Tag ... > or </Tag>
    # Note: Handles self-closing <Tag ... />
    tag_pattern = re.compile(f'<(/?{tag_name}[\\s>/])')
    
    for line_no, line in enumerate(lines, 1):
        for match in tag_pattern.finditer(line):
            tag_text = match.group(1)
            
            # Check if it's self-closing on the same line
            # This is a bit naive but works for standard <Box ... />
            is_self_closing = match.string[match.start():].split('>', 1)[0].endswith('/')
            
            if is_self_closing:
                # print(f"Self-closing {tag_name} at line {line_no}")
                continue
            
            if tag_text.startswith('/'):
                if not stack:
                    print(f"Extra close </{tag_name}> at line {line_no}")
                else:
                    stack.pop()
            else:
                stack.append(line_no)
                
    for start_line in stack:
        print(f"Unclosed <{tag_name}> opened at line {start_line}")

if __name__ == "__main__":
    find_tag_mismatches(r'c:\xampp\htdocs\myvastutools\src\components\ToolModules.jsx', 'Box')
    print("--- Checking Accordion ---")
    find_tag_mismatches(r'c:\xampp\htdocs\myvastutools\src\components\ToolModules.jsx', 'Accordion')
    print("--- Checking Dialog ---")
    find_tag_mismatches(r'c:\xampp\htdocs\myvastutools\src\components\ToolModules.jsx', 'Dialog')
