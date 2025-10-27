#!/bin/bash
#
# EusoTrip Platform: Pre-Deployment AWS Resource Setup Script
#
# This script guides the user to create the minimum required AWS resources
# before deploying the EusoTrip Core Platform API to Elastic Beanstalk.
#
# NOTE: This script ASSUMES you have the AWS CLI installed and configured.
#

# --- Configuration ---
# Use a unique identifier for all resources
UNIQUE_ID="eusotrip-$(date +%s)"
REGION="us-east-1" # Change this to your desired AWS region

# --- 1. S3 Buckets ---
# The EB source bundle bucket is managed by EB. We focus on the assets bucket.
ASSETS_BUCKET="eusotrip-assets-${UNIQUE_ID}"

echo "--- 1. Creating S3 Bucket for Static Assets ---"
echo "Bucket Name: ${ASSETS_BUCKET}"
aws s3api create-bucket --bucket ${ASSETS_BUCKET} --region ${REGION}
if [ $? -eq 0 ]; then
    echo "S3 Bucket created successfully. Applying public read policy..."
    # Apply a policy for public read access to static assets (if needed)
    # NOTE: For production, a more restrictive policy or CloudFront is recommended.
    # aws s3api put-bucket-policy --bucket ${ASSETS_BUCKET} --policy file://s3-public-policy.json
else
    echo "Error creating S3 Bucket. Exiting."
    exit 1
fi

# --- 2. RDS Database (Placeholder for Connection Details) ---
# NOTE: Creating an RDS instance is complex and time-consuming. This section
# PROVIDES the details you need to configure an existing or newly created RDS instance.
#
# You MUST manually create a PostgreSQL RDS instance in the AWS console or using CloudFormation.
#
DB_HOST="eusotrip-prod-db.xxxxxxxxxx.rds.amazonaws.com"
DB_NAME="eusotripdb"
DB_USER="eusotripuser"
DB_PASSWORD="YOUR_SECURE_PASSWORD" # MUST replace this with your actual password

echo "--- 2. RDS Database Connection Details ---"
echo "Please ensure your PostgreSQL RDS instance is created with the following details:"
echo "  Host: ${DB_HOST} (Replace with your actual RDS endpoint)"
echo "  Database Name: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"

# --- 3. Final Environment Variables for Elastic Beanstalk ---
# These variables will be set in the Elastic Beanstalk environment configuration.
echo "--- 3. Environment Variables for EB Configuration ---"
echo "Set the following variables in your EB Environment Properties:"
echo "  ASSETS_BUCKET_NAME = ${ASSETS_BUCKET}"
echo "  DATABASE_URL = postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}"
echo "  SECRET_KEY = YOUR_FASTAPI_SECRET_KEY"

echo "--- Setup Script Complete ---"
echo "The S3 assets bucket has been created. Proceed to EB deployment."

