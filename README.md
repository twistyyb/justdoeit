# Just Do It - Web App

A React frontend and Flask backend web application.

## Project Structure

```
justdoeit/
├── backend/           # Flask Python backend
│   ├── app.py        # Main Flask application
│   ├── requirements.txt
│   └── __init__.py
├── frontend/         # React JS frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Getting Started

### Backend (Flask)
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Run the Flask app: `python app.py`
4. Backend will be available at `http://localhost:5001`

### Frontend (React)
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Frontend will be available at `http://localhost:3000`

## Development

- Backend runs on port 5001
- Frontend runs on port 3000
- Both servers can run simultaneously for full-stack development
