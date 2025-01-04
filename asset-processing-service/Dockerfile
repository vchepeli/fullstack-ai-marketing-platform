# Use an official Python runtime as a parent image
FROM python:3.9-slim

RUN apt-get update && apt-get install -y ffmpeg 

# Set the working directory in the container
WORKDIR /app

# Copy pyproject.toml and poetry.lock first for dependency caching
COPY pyproject.toml poetry.lock* /app/

# Install Poetry and dependencies
RUN pip install poetry \
    && poetry install --no-root

# Copy the entire project into the container
COPY . /app

# Run the service when the container launches
CMD ["poetry", "run", "asset-processing-service"]
