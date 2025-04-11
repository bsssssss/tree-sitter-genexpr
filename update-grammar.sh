!#/bin/bash

rm -rf build src
tree-sitter generate
npm install

echo "Grammar updated !"
