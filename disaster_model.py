import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from typing import Dict, List, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DisasterFundModel:
    def __init__(self):
        
        try:
            self.sectors = ['Healthcare', 'Education', 'Defence', 'Infrastructure', 'Agriculture', 'Environment']
            self.severity_weights = {
                1: 0.1, 2: 0.2, 3: 0.3, 4: 0.4, 5: 0.5,
                6: 0.6, 7: 0.7, 8: 0.8, 9: 0.9, 10: 1.0
            }
            self.is_trained = False
            logger.info("DisasterFundModel initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing DisasterFundModel: {str(e)}")
            raise

    def train_models(self, disaster_data: pd.DataFrame) -> None:
        """
        Train models using historical disaster data.
        
        Args:
            disaster_data: DataFrame containing historical disaster information
        """
        try:
            # Calculate average damage and allocation ratios
            self.avg_damage_ratio = disaster_data['Budget_Allocated_Cr'].mean() / disaster_data['Estimated_Damage_Cr'].mean()
            self.severity_allocation_ratio = disaster_data['Budget_Allocated_Cr'].mean() / disaster_data['Severity(1-10)'].mean()
            
            self.is_trained = True
            logger.info("Disaster fund allocation model trained successfully")
            
        except Exception as e:
            logger.error(f"Error in train_models: {str(e)}")
            raise

    def calculate_disaster_fund(self, severity: int, estimated_damage: float) -> float:
        """
        Calculate required disaster fund based on severity and estimated damage.
        
        Args:
            severity: Severity level (1-10)
            estimated_damage: Estimated damage in crores
            
        Returns:
            float: Required disaster fund in crores
        """
        try:
            if not self.is_trained:
                raise RuntimeError("Model must be trained before making predictions")
            
            # Calculate base allocation
            base_allocation = estimated_damage * self.avg_damage_ratio
            
            # Adjust based on severity
            severity_factor = self.severity_weights.get(severity, 0.5)
            final_allocation = base_allocation * severity_factor
            
            return float(final_allocation)
            
        except Exception as e:
            logger.error(f"Error in calculate_disaster_fund: {str(e)}")
            raise

    def adjust_sector_budgets(self, total_budget: float, disaster_fund: float) -> Tuple[Dict[str, float], Dict[str, float]]:
        """
        Calculate budget adjustments for each sector to accommodate disaster fund.
        
        Args:
            total_budget: Total available budget in crores
            disaster_fund: Required disaster fund in crores
            
        Returns:
            Tuple[Dict[str, float], Dict[str, float]]: Original and adjusted sector budgets
        """
        try:
            if not self.is_trained:
                raise RuntimeError("Model must be trained before making predictions")
            
            # Calculate base proportions (can be adjusted based on sector priorities)
            base_proportions = {
                'Healthcare': 0.15,
                'Education': 0.20,
                'Defence': 0.25,
                'Infrastructure': 0.20,
                'Agriculture': 0.10,
                'Environment': 0.10
            }
            
            # Calculate original sector budgets
            original_budgets = {
                sector: total_budget * proportion
                for sector, proportion in base_proportions.items()
            }
            
            # Calculate proportional cuts
            total_cut = disaster_fund
            adjusted_budgets = {}
            
            for sector in self.sectors:
                # Calculate proportional cut based on sector budget
                sector_cut = (original_budgets[sector] / total_budget) * total_cut
                adjusted_budgets[sector] = original_budgets[sector] - sector_cut
            
            return original_budgets, adjusted_budgets
            
        except Exception as e:
            logger.error(f"Error in adjust_sector_budgets: {str(e)}")
            raise 