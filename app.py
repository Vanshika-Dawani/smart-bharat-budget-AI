from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import pandas as pd
import numpy as np
from disaster_model import DisasterFundModel
from tax_model import TaxOptimizationModel
from budget_forecast_model import BudgetForecastModel

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Initialize the disaster model with sample training data
def initialize_disaster_model():
    model = DisasterFundModel()
    
    # Sample historical data for training
    sample_data = {
        'Severity(1-10)': [3, 5, 7, 9, 4, 6, 8, 2],
        'Estimated_Damage_Cr': [500, 1000, 2000, 5000, 700, 1500, 3000, 300],
        'Budget_Allocated_Cr': [200, 600, 1500, 4500, 350, 1000, 2500, 100],
    }
    
    df = pd.DataFrame(sample_data)
    model.train_models(df)
    return model

# Initialize the tax model with sample training data
def initialize_tax_model():
    model = TaxOptimizationModel()
    
    # Sample historical tax data for training
    sample_data = {
        'Tax_Type': ['Income Tax', 'Corporate Tax', 'GST', 'Property Tax', 'Customs Duty', 'Excise Duty'],
        'Tax_Rate_Percent': [30, 25, 18, 10, 15, 12],
        'Revenue_Generated_Cr': [50000, 30000, 45000, 15000, 20000, 18000],
        'Collection_Efficiency_Percent': [85, 90, 92, 75, 88, 80]
    }
    
    df = pd.DataFrame(sample_data)
    model.train_models(df)
    return model

# Initialize the budget forecast model with sample training data
def initialize_budget_forecast_model():
    model = BudgetForecastModel()
    
    # Sample historical budget data for training (5 years of data)
    sample_data = {
        'Year': [2019, 2020, 2021, 2022, 2023],
        'Healthcare': [40000, 43000, 47000, 48500, 50000],
        'Education': [35000, 37000, 38500, 39000, 40000],
        'Defence': [30000, 32000, 33500, 34000, 35000],
        'Infrastructure': [38000, 40000, 42000, 44000, 45000],
        'Agriculture': [25000, 26500, 28000, 29000, 30000],
        'Environment': [20000, 21000, 22500, 24000, 25000]
    }
    
    df = pd.DataFrame(sample_data)
    model.train_models(df)
    return model

# Initialize the models
disaster_model = initialize_disaster_model()
tax_model = initialize_tax_model()
budget_forecast_model = initialize_budget_forecast_model()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/calculate-disaster-fund', methods=['POST'])
def calculate_disaster_fund():
    try:
        data = request.json
        severity = int(data.get('severity', 5))
        estimated_damage = float(data.get('estimatedDamage', 1000))
        
        # Calculate required fund
        required_fund = disaster_model.calculate_disaster_fund(severity, estimated_damage)
        
        # Get total budget from the request or use default
        total_budget = float(data.get('totalBudget', 225000))
        
        # Calculate budget adjustments
        original_budgets, adjusted_budgets = disaster_model.adjust_sector_budgets(total_budget, required_fund)
        
        # Format the response
        sector_adjustments = []
        for sector in disaster_model.sectors:
            if sector in original_budgets and sector in adjusted_budgets:
                sector_adjustments.append({
                    'sector': sector,
                    'originalBudget': round(original_budgets[sector]),
                    'adjustedBudget': round(adjusted_budgets[sector]),
                    'difference': round(adjusted_budgets[sector] - original_budgets[sector])
                })
        
        return jsonify({
            'requiredFund': round(required_fund),
            'sectorAdjustments': sector_adjustments
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/optimize-taxes', methods=['POST'])
def optimize_taxes():
    try:
        data = request.json
        economic_condition = data.get('economicCondition', 'stable')  # 'recession', 'stable', 'growth'
        revenue_target = float(data.get('revenueTarget', 200000))
        
        # Get tax optimization recommendations
        recommendations = tax_model.optimize_taxes(economic_condition, revenue_target)
        
        # Prepare tax adjustments for revenue projection
        tax_adjustments = {rec['tax_type']: float(rec['amount'].replace('%', '')) for rec in recommendations}
        
        # Project revenue with the recommended adjustments
        revenue_projections = tax_model.project_revenue(tax_adjustments, revenue_target)
        
        return jsonify({
            'recommendations': recommendations,
            'totalProjectedRevenue': revenue_projections.get('Total', 0),
            'economicCondition': economic_condition.capitalize()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/forecast-budget', methods=['POST'])
def forecast_budget():
    try:
        data = request.json
        forecast_year = int(data.get('year', 2024))
        total_budget = float(data.get('totalBudget', 225000))
        
        # Get budget distribution for the specified year
        budget_distribution = budget_forecast_model.distribute_budget(total_budget, forecast_year)
        
        # Format the response with percentages
        sectors_data = []
        for sector, amount in budget_distribution.items():
            percentage = (amount / total_budget) * 100
            sectors_data.append({
                'sector': sector,
                'amount': round(amount),
                'percentage': round(percentage, 2)
            })
        
        # Sort by amount descending
        sectors_data.sort(key=lambda x: x['amount'], reverse=True)
        
        return jsonify({
            'year': forecast_year,
            'totalBudget': round(total_budget),
            'sectors': sectors_data,
            'message': f"AI-powered budget forecast for {forecast_year}"
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/historical-budget', methods=['POST'])
def historical_budget():
    try:
        data = request.json
        year = int(data.get('year', 2023))
        
        # Historical budget data (using the same data from model initialization)
        historical_data = {
            2019: {
                'total': 188000,
                'sectors': {
                    'Healthcare': 40000,
                    'Education': 35000,
                    'Defence': 30000,
                    'Infrastructure': 38000,
                    'Agriculture': 25000,
                    'Environment': 20000
                }
            },
            2020: {
                'total': 195000,
                'sectors': {
                    'Healthcare': 43000,
                    'Education': 37000,
                    'Defence': 32000,
                    'Infrastructure': 40000,
                    'Agriculture': 26500,
                    'Environment': 21000
                }
            },
            2021: {
                'total': 210000,
                'sectors': {
                    'Healthcare': 47000,
                    'Education': 38500,
                    'Defence': 33500,
                    'Infrastructure': 42000,
                    'Agriculture': 28000,
                    'Environment': 22500
                }
            },
            2022: {
                'total': 217000,
                'sectors': {
                    'Healthcare': 48500,
                    'Education': 39000,
                    'Defence': 34000,
                    'Infrastructure': 44000,
                    'Agriculture': 29000,
                    'Environment': 24000
                }
            },
            2023: {
                'total': 225000,
                'sectors': {
                    'Healthcare': 50000,
                    'Education': 40000,
                    'Defence': 35000,
                    'Infrastructure': 45000,
                    'Agriculture': 30000,
                    'Environment': 25000
                }
            }
        }
        
        if year not in historical_data:
            return jsonify({'error': f'No data available for year {year}'}), 404
        
        year_data = historical_data[year]
        
        # Format the response with percentages
        sectors_data = []
        for sector, amount in year_data['sectors'].items():
            percentage = (amount / year_data['total']) * 100
            sectors_data.append({
                'sector': sector,
                'amount': amount,
                'percentage': round(percentage, 2)
            })
        
        # Sort by amount descending
        sectors_data.sort(key=lambda x: x['amount'], reverse=True)
        
        return jsonify({
            'year': year,
            'totalBudget': year_data['total'],
            'sectors': sectors_data
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/distribute-custom-budget', methods=['POST'])
def distribute_custom_budget():
    try:
        data = request.json
        total_budget = float(data.get('totalBudget', 225000))
        
        if total_budget <= 0:
            return jsonify({'error': 'Budget amount must be greater than 0'}), 400
        
        # Use current year as reference
        current_year = 2023
        
        # Get budget distribution based on most recent patterns
        budget_distribution = budget_forecast_model.distribute_budget(total_budget, current_year)
        
        # Format the response with percentages
        sectors_data = []
        for sector, amount in budget_distribution.items():
            percentage = (amount / total_budget) * 100
            sectors_data.append({
                'sector': sector,
                'amount': round(amount),
                'percentage': round(percentage, 2)
            })
        
        # Sort by amount descending
        sectors_data.sort(key=lambda x: x['amount'], reverse=True)
        
        return jsonify({
            'totalBudget': round(total_budget),
            'sectors': sectors_data,
            'message': f"AI-optimized distribution of ₹{round(total_budget):,} Crores"
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("\n" + "="*50)
    print("Budget Allocation System with AI Models")
    print("="*50)
    print("\nServer is running on http://localhost:5000")
    print("Open this URL in your browser to access the application.")
    print("\nAll AI Models are loaded and ready to use!")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=port, debug=True) 