!# /bin/bash

rm -rf build src
tree-sitter generate
tree-sitter build
npm install

echo "Grammar updated !"
