#!/bin/bash

# Directory to store the extracted files
TARGET_DIR="./phishing_lst"

# Create the target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Download and extract ALL-phishing-domains.tar.gz
echo "Downloading and extracting ALL-phishing-domains.tar.gz..."
curl -sL https://phish.co.za/latest/ALL-phishing-domains.tar.gz | tar xz

# Download and extract ALL-phishing-links.tar.gz
echo "Downloading and extracting ALL-phishing-links.tar.gz..."
curl -sL https://phish.co.za/latest/ALL-phishing-links.tar.gz | tar xz

# Copy the .lst files to the target directory
echo "Copying .lst files to $TARGET_DIR..."
cp ALL-phishing-domains.lst "$TARGET_DIR/"
cp ALL-phishing-links.lst "$TARGET_DIR/"

echo "Update completed successfully!"