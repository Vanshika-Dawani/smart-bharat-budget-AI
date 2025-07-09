import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
from typing import Dict, Union, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BudgetForecastModel:
    def __init__(self):
        try:
            self.sectors = ['Healthcare', 'Education', 'Defence', 'Infrastructure', 'Agriculture', 'Environment']
            self.models = {sector: {
                'linear': LinearRegression(),
                'xgb': xgb.XGBRegressor(
                    objective='reg:squarederror',
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=3
                )
            } for sector in self.sectors}
            self.scalers = {sector: StandardScaler() for sector in self.sectors}
            self.sector_proportions = {}  # Store historical proportions
            self.is_trained = False
            logger.info("BudgetForecastModel initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing BudgetForecastModel: {str(e)}")
            raise

    def calculate_sector_proportions(self, data: pd.DataFrame) -> None:
        """
        Calculate historical proportions for each sector.
        
        Args:
            data: DataFrame containing historical budget data
        """
        try:
            # Calculate total budget for each year
            data['Total'] = data[self.sectors].sum(axis=1)
            
            # Calculate proportion for each sector
            for sector in self.sectors:
                self.sector_proportions[sector] = {
                    'mean': data[sector].mean() / data['Total'].mean(),
                    'trend': self._calculate_trend(data[sector] / data['Total'])
                }
            
        except Exception as e:
            logger.error(f"Error calculating sector proportions: {str(e)}")
            raise

    def _calculate_trend(self, proportions: pd.Series) -> float:
        """
        Calculate the trend in sector proportions over time.
        
        Args:
            proportions: Series of historical proportions
            
        Returns:
            float: Trend coefficient
        """
        try:
            X = np.arange(len(proportions)).reshape(-1, 1)
            y = proportions.values
            model = LinearRegression()
            model.fit(X, y)
            return model.coef_[0]
        except Exception as e:
            logger.error(f"Error calculating trend: {str(e)}")
            raise

    def preprocess_data(self, data: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Preprocess input data for prediction.
        
        Args:
            data: DataFrame containing historical budget data
            
        Returns:
            Dict[str, np.ndarray]: Preprocessed features for each sector
        """
        try:
            processed_data = {}
            for sector in self.sectors:
                # Create features: year and previous year's budget
                X = data[['Year']].values
                processed_data[sector] = self.scalers[sector].fit_transform(X)
            return processed_data
            
        except Exception as e:
            logger.error(f"Error in preprocess_data: {str(e)}")
            raise

    def predict(self, year: int) -> Dict[str, float]:
        """
        Make predictions for all sectors for a given year.
        
        Args:
            year: The year to predict budgets for
            
        Returns:
            Dict[str, float]: Predicted budgets for each sector
        """
        try:
            if not self.is_trained:
                raise RuntimeError("Model must be trained before making predictions")
                
            predictions = {}
            for sector in self.sectors:
                # Prepare input data
                X = np.array([[year]])
                X_scaled = self.scalers[sector].transform(X)
                
                # Get predictions from both models
                linear_pred = self.models[sector]['linear'].predict(X_scaled)
                xgb_pred = self.models[sector]['xgb'].predict(X_scaled)
                
                # Combine predictions with weighted average
                final_prediction = (0.3 * linear_pred[0] + 0.7 * xgb_pred[0])
                predictions[sector] = float(final_prediction)
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error in predict: {str(e)}")
            raise

    def train_models(self, data: pd.DataFrame) -> None:
        """
        Train models and calculate sector proportions.
        
        Args:
            data: DataFrame containing historical budget data
        """
        try:
            # Calculate sector proportions
            self.calculate_sector_proportions(data)
            
            # Train prediction models
            for sector in self.sectors:
                X = data[['Year']].values
                y = data[sector].values
                X_scaled = self.scalers[sector].fit_transform(X)
                
                self.models[sector]['linear'].fit(X_scaled, y)
                self.models[sector]['xgb'].fit(X_scaled, y)
            
            self.is_trained = True
            logger.info("Models trained successfully for all sectors")
            
        except Exception as e:
            logger.error(f"Error in train_models: {str(e)}")
            raise

    def distribute_budget(self, total_budget: float, year: int) -> Dict[str, float]:
        """
        Distribute total budget across sectors based on historical proportions and trends.
        
        Args:
            total_budget: Total budget to distribute
            year: Year for which to make the distribution
            
        Returns:
            Dict[str, float]: Distributed budget for each sector
        """
        try:
            if not self.is_trained:
                raise RuntimeError("Model must be trained before making predictions")
            
            # Calculate base proportions with trend adjustment
            proportions = {}
            total_proportion = 0
            
            for sector in self.sectors:
                # Get base proportion and trend
                base_proportion = self.sector_proportions[sector]['mean']
                trend = self.sector_proportions[sector]['trend']
                
                # Adjust proportion based on trend
                years_from_base = year - 2023  # Assuming 2023 is the last year in training data
                adjusted_proportion = base_proportion + (trend * years_from_base)
                
                # Ensure proportion is not negative
                adjusted_proportion = max(0.01, adjusted_proportion)  # Minimum 1% allocation
                proportions[sector] = adjusted_proportion
                total_proportion += adjusted_proportion
            
            # Normalize proportions to sum to 1
            normalized_proportions = {
                sector: prop / total_proportion
                for sector, prop in proportions.items()
            }
            
            # Calculate final budget distribution
            distribution = {
                sector: total_budget * proportion
                for sector, proportion in normalized_proportions.items()
            }
            
            return distribution
            
        except Exception as e:
            logger.error(f"Error in distribute_budget: {str(e)}")
            raise

    def display_distribution(self, total_budget: float, year: int) -> None:
        """
        Display the budget distribution for a given year.
        
        Args:
            total_budget: Total budget to distribute
            year: Year for which to make the distribution
        """
        try:
            if not self.is_trained:
                raise RuntimeError("Model must be trained before displaying distribution")
            
            distribution = self.distribute_budget(total_budget, year)
            
            print(f"Budget Distribution for {year} (Total: ₹{total_budget:.2f}):")
            print("--------------------------------------------------")
            for sector, amount in distribution.items():
                print(f"{sector}: ₹{amount:.2f} ({amount / total_budget * 100:.1f}%)")
            print("--------------------------------------------------")
            
        except Exception as e:
            logger.error(f"Error in display_distribution: {str(e)}")
            raise 