#!/bin/bash
# Generate PNG icons from SVG

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Installing..."
    sudo dnf install -y ImageMagick
fi

# Generate icons
cd "$(dirname "$0")"
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png

echo "Icons generated: icon16.png, icon48.png, icon128.png"
