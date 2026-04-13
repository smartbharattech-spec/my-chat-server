
import sys

def check_delimiters(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    stack = []
    pairs = {'(': ')', '{': '}', '[': ']'}
    
    lines = content.splitlines()
    for line_no, line in enumerate(lines, 1):
        for char_no, char in enumerate(line, 1):
            if char in pairs:
                stack.append((char, line_no, char_no))
            elif char in pairs.values():
                if not stack:
                    print(f"Extra close {char} at line {line_no}, col {char_no}")
                    continue
                top, l, c = stack.pop()
                if pairs[top] != char:
                    print(f"Mismatch: opened {top} at line {l}, col {c}; closed {char} at line {line_no}, col {char_no}")

    while stack:
        char, l, c = stack.pop()
        print(f"Unclosed {char} at line {l}, col {c}")

if __name__ == "__main__":
    check_delimiters(r'c:\xampp\htdocs\myvastutools\src\components\ToolModules.jsx')
