# ===== DOCKERFILE =====
# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory to /app
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application code into the container
COPY . .

# Expose the port the app runs on (e.g., 5000 for Flask)
EXPOSE 5000

# Run main.py when the container launches
CMD ["python", "main.py"]
