# Optional: run the dashboard or pipeline in a container (e.g. on a small VPS).
#   docker build -t zenith-briefing .
#   docker run --env-file .env -v $PWD/data:/app/data -p 8000:8000 zenith-briefing            # dashboard
#   docker run --env-file .env -v $PWD/data:/app/data zenith-briefing python -m app --run      # one run
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
# Binding to 0.0.0.0 requires DASHBOARD_USERNAME/DASHBOARD_PASSWORD (enforced by the app).
CMD ["python", "-m", "app", "--dashboard", "--host", "0.0.0.0", "--port", "8000"]
