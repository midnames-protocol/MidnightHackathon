#!/bin/bash
# Script to generate self-signed SSL certificates for local development

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate a private key
openssl genrsa -out ssl/server.key 2048

# Generate a Certificate Signing Request (CSR)
openssl req -new -key ssl/server.key -out ssl/server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate a self-signed certificate valid for 365 days
openssl x509 -req -days 365 -in ssl/server.csr -signkey ssl/server.key -out ssl/server.crt

# Clean up CSR file
rm ssl/server.csr

echo "Self-signed SSL certificates have been generated in the ssl directory."
echo "  - server.key: Private key"
echo "  - server.crt: Self-signed certificate"