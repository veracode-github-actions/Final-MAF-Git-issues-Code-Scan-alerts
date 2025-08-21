#This pipeline will scan the entire source code
#Used for terraform scripts or Docker file

name: Veracode_container_scan
on:
  push:
    branches: [ main ]

jobs:
  veracode-scan:
    runs-on: ubuntu-latest
    name: Veracode Container/IaC/Secrets scan

    steps:
      - name: checkout
        uses: actions/checkout@v3

      - name: Veracode Container/IaC/Secrets action step
        uses: veracode/container_iac_secrets_scanning@v1.0.1
        with:
          vid: ${{ secrets.VID }}
          vkey: ${{ secrets.VKEY }}
          command: "scan" 
          type: "directory"
          source: "./"
          format: "json"
          debug: false
          fail_build: true