# Things that need to be done

**Important** Keep documentation up to date then commit as each item is completed. Items are NOT considered complete until verified by the user. Only address one item at a time. 

Items are in order of priority and should be addressed in the order they are in.

## Items

### Item 1 - File size report  

Create a stand alone node.js script in the `scripts` directory named `size_report.js`.
The script should report the size of all files under the `src` directory. 
The output should be a markdown file named `size_report.md` that contains name, size in bytes, and size in tokens. 
Tokens can be computed as `size / 4` (assuming 4 bytes per token).
The list should be sorted by size in descending order.
