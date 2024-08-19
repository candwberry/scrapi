#!/bin/bash

# Create backups directory if it doesn't exist
mkdir -p /backups

# Get timestamp
timestamp=$(date +%Y-%m-%d_%H-%M-%S)

# Backup database
cp mydb.sqlite "backups/${timestamp}.sqlite"

# Remove extra backups if there are more than 10
ls -t backups/*.sqlite | tail -n +11 | xargs -I {} rm -- {}

# To run every 8 hours do this:

# chmod +x backup.sh
# crontab -e
# 0 */8 * * * /home/berry/backup.sh 
