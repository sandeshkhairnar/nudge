import sys

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    line = 1
    col = 1
    
    in_string = False
    string_char = ''
    in_comment_line = False
    in_comment_block = False
    
    pairs = {'{': '}', '(': ')', '[': ']'}
    opens = pairs.keys()
    closes = pairs.values()
    
    i = 0
    while i < len(content):
        char = content[i]
        
        if in_comment_line:
            if char == '\n':
                in_comment_line = False
                line += 1
                col = 1
            else:
                col += 1
        elif in_comment_block:
            if char == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_comment_block = False
                i += 1
                col += 2
            elif char == '\n':
                line += 1
                col = 1
            else:
                col += 1
        elif in_string:
            if char == string_char:
                if i > 0 and content[i-1] != '\\':
                    in_string = False
            elif char == '\n':
                line += 1
                col = 1
            else:
                col += 1
        else:
            if char == '/' and i + 1 < len(content) and content[i+1] == '/':
                in_comment_line = True
                i += 1
            elif char == '/' and i + 1 < len(content) and content[i+1] == '*':
                in_comment_block = True
                i += 1
            elif char in ["'", '"', '`']:
                in_string = True
                string_char = char
            elif char in opens:
                stack.append((char, line, col))
            elif char in closes:
                if not stack:
                    print(f"Extra close {char} at {line}:{col}")
                else:
                    top_char, top_line, top_col = stack.pop()
                    if pairs[top_char] != char:
                        print(f"Mismatched {char} at {line}:{col} (expected {pairs[top_char]} for {top_char} at {top_line}:{top_col})")
            
            if char == '\n':
                line += 1
                col = 1
            else:
                col += 1
        i += 1
        
    for char, line, col in stack:
        print(f"Unclosed {char} at {line}:{col}")

if __name__ == "__main__":
    check_balance(sys.argv[1])
