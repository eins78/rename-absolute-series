# `rename-absolute-series`

small `node.js` script to rename series filenames
from absolute numbering to season numbering, 
according to tvdb data.

*Proof of Concept*, hardcoded to **'Tatort'**.

# usage

Read files and show new names:  
`node rename-tatort.js --src /path/to/Tatort/Season.01`

To actually do something, give a destination:
`--dest /path/to`

And use one of these flags:
- `--copy`: to *copy* the files.
- `--move`: to *move* the files. *Does not work across volumes* (use `--copy` instead).

# License

MIT