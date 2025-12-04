#!/bin/bash

arr=("page2" "page3")

for dir in "${arr[@]}" ; do
    mkdir -p dist/$dir/assets &&
    cp dist/assets/image.webp dist/$dir/assets/
done
