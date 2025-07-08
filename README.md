
# Here are your Instructions

## Development

Run the FastAPI backend:

```bash
cd backend
python server.py
```

The server reads the `PORT` environment variable and defaults to **8001**.

# Sition Project Setup

This repository contains a FastAPI backend and a React frontend. Follow the steps below to install the required dependencies and run both services locally.

## Requirements

- **Python** 3.10 or higher
- **Node.js** 20 or higher
- **MongoDB** running locally or accessible remotely

## Backend

1. Enter the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment and install the dependencies:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Configure the environment variables. Create a `.env` file in the `backend` folder with at least the following keys:

   ```env
   MONGO_URL="mongodb://localhost:27017"
   DB_NAME="sition"
   ```

   Adjust the values to match your MongoDB setup.

4. Start the FastAPI server:

   ```bash
   uvicorn server:app --reload
   ```

   The API will be available at `http://localhost:8000` by default.

## Frontend

1. From the project root, install the frontend dependencies (requires Node ≥ 20):

   ```bash
   cd frontend
   yarn install
   ```

2. Edit the `frontend/.env` file so that `REACT_APP_BACKEND_URL` points to the backend URL (e.g. `http://localhost:8000`).

3. Start the development server:

   ```bash
   yarn start
   ```

   The application will be available at `http://localhost:3000`.

