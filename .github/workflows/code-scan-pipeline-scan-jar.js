# name: Veracode Auto-Packaging and Pipeline Scan

#This script will auto pkg, run pipeline scan, upload the results to code scanning alerts 

on:
  push:
    branches:
      - main
  pull_request:

permissions: 
    security-events: write

jobs:
  veracode-scan:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3

      - name: Install Veracode CLI and Package Application
        run: |
          curl -fsS https://tools.veracode.com/veracode-cli/install | sh
          ./veracode package -vas . --output verascan

          # Check if the verascan directory exists
          if [ ! -d "verascan" ]; then
            echo "Error: verascan directory not found."
            exit 1
          fi

      - name: Veracode Pipeline Scan
        continue-on-error: true
        env:
          VERACODE_API_KEY_ID: ${{ secrets.VID }}
          VERACODE_API_KEY_SECRET: ${{ secrets.VKEY }}
        run: |
          ./veracode policy get "Al-Test" --format json # Optional: replace with your actual policy
          for file in verascan/*; do
            if [ -f "$file" ]; then
              echo "Scanning $file..."
              curl -O https://downloads.veracode.com/securityscan/pipeline-scan-LATEST.zip
              unzip pipeline-scan-LATEST.zip pipeline-scan.jar
              java -jar pipeline-scan.jar --veracode_api_id "${VERACODE_API_KEY_ID}" --veracode_api_key "${VERACODE_API_KEY_SECRET}" --file "$file" --fail_on_severity "Very High, High" || true
            fi
          done

      - name: Upload filtered scan results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: scan-results
          path: results.json
          
      - name: Convert pipeline scan output to SARIF format
        id: convert
        uses: veracode/veracode-pipeline-scan-results-to-sarif@v2.0.4
        with:
          pipeline-results-json: results.json
      - uses: github/codeql-action/upload-sarif@v3
        with:
          # Path to SARIF file relative to the root of the repository
          sarif_file: veracode-results.sarif

# che