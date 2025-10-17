# Building 3.13-slim image, due to it being a smaller size (faster deployment) and having easy dependency installs
FROM python:3.13-slim

# Set working directory
WORKDIR /back-end

# Copy requirements first
COPY requirements.txt .

# Install system dependencies for psycopg2 build
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Upgrades pip then installs requirements
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy into working directory
COPY app.py . 

# Run app.py
CMD ["python","app.py"]