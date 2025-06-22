#!/usr/bin/env python3
"""Count console.log statements that are not behind DEBUG_CONFIG flags."""

import os
import re
from pathlib import Path

def is_console_log_behind_debug_config(lines, log_line_num):
    """Check if a console.log is inside a DEBUG_CONFIG if block."""
    # Look backwards from the console.log line to find if it's inside a DEBUG_CONFIG block
    brace_count = 0
    for i in range(log_line_num - 1, -1, -1):
        line = lines[i].strip()
        
        # Count braces to track nesting
        brace_count += line.count('}') - line.count('{')
        
        # If we find a DEBUG_CONFIG if statement and we're inside its block
        if 'if' in line and 'DEBUG_CONFIG' in line and brace_count < 0:
            return True
            
        # If we've exited all blocks, stop looking
        if brace_count >= 0 and i < log_line_num - 1:
            break
    
    return False

def analyze_file(file_path):
    """Analyze a TypeScript file for console.log statements."""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    results = {
        'total': 0,
        'behind_debug': 0,
        'not_behind_debug': 0,
        'not_behind_debug_lines': []
    }
    
    for i, line in enumerate(lines):
        if 'console.log' in line:
            results['total'] += 1
            if is_console_log_behind_debug_config(lines, i):
                results['behind_debug'] += 1
            else:
                results['not_behind_debug'] += 1
                results['not_behind_debug_lines'].append({
                    'line_num': i + 1,
                    'line': line.strip()
                })
    
    return results

def main():
    src_dir = Path('src')
    all_results = {
        'total': 0,
        'behind_debug': 0,
        'not_behind_debug': 0,
        'files_with_unguarded': {}
    }
    
    # Find all TypeScript files
    for file_path in src_dir.rglob('*.ts'):
        results = analyze_file(file_path)
        all_results['total'] += results['total']
        all_results['behind_debug'] += results['behind_debug']
        all_results['not_behind_debug'] += results['not_behind_debug']
        
        if results['not_behind_debug_lines']:
            all_results['files_with_unguarded'][str(file_path)] = results['not_behind_debug_lines']
    
    # Also check .tsx files
    for file_path in src_dir.rglob('*.tsx'):
        results = analyze_file(file_path)
        all_results['total'] += results['total']
        all_results['behind_debug'] += results['behind_debug']
        all_results['not_behind_debug'] += results['not_behind_debug']
        
        if results['not_behind_debug_lines']:
            all_results['files_with_unguarded'][str(file_path)] = results['not_behind_debug_lines']
    
    # Print summary
    print(f"Total console.log statements: {all_results['total']}")
    print(f"Behind DEBUG_CONFIG: {all_results['behind_debug']}")
    print(f"NOT behind DEBUG_CONFIG: {all_results['not_behind_debug']}")
    print(f"\nFiles with unguarded console.log statements: {len(all_results['files_with_unguarded'])}")
    
    # Print details for each file with unguarded logs
    for file_path, logs in sorted(all_results['files_with_unguarded'].items()):
        print(f"\n{file_path}: {len(logs)} unguarded console.log statements")
        for log in logs[:3]:  # Show first 3 as examples
            print(f"  Line {log['line_num']}: {log['line'][:80]}...")
        if len(logs) > 3:
            print(f"  ... and {len(logs) - 3} more")

if __name__ == '__main__':
    main()