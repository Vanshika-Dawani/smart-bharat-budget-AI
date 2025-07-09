# smart-bharat-budget-AI
# Budget Allocation with Disaster Fund Predictor

This project includes a budget allocation dashboard with an AI-powered disaster fund predictor.

## Setup Instructions

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start the Python Flask Server
```bash
python app.py
```
This will start the server at http://localhost:5000

### Step 3: Open the Application
After starting the server, open http://localhost:5000 in your browser.

## Features
- Budget allocation dashboard
- AI-powered disaster fund prediction
- Budget adjustment calculations
- Tax optimization recommendations
- Voting analysis

## Disaster Fund Predictor
The disaster fund predictor uses a machine learning model to estimate required funds based on:
1. Disaster severity (scale of 1-10)
2. Estimated damage (in ₹ Crores)

The model then calculates budget adjustments across different sectors to accommodate the disaster response.

## Technical Details
- Frontend: HTML, CSS, JavaScript
- Backend: Python, Flask
- AI Model: DisasterFundModel from disaster_model.py 
