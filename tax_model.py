import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from typing import Dict, List, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaxOptimizationModel:
    def __init__(self):
        try:
            self.tax_types = ['Income Tax', 'Corporate Tax', 'GST', 'Property Tax', 'Customs Duty', 'Excise Duty']
            self.impact_weights = {
                'low': 0.3,
                'medium': 0.6,
                'high': 0.9
            }
            self.is_trained = False
            logger.info("TaxOptimizationModel initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing TaxOptimizationModel: {str(e)}")
            raise

    def train_models(self, tax_data: pd.DataFrame) -> None:
        """
        Train models using historical tax data.
        
        Args:
            tax_data: DataFrame containing historical tax information
        """
        try:
            # Calculate average tax collection and revenue impacts
            self.avg_revenue_impact = tax_data['Revenue_Generated_Cr'].mean() / tax_data['Tax_Rate_Percent'].mean()
            self.avg_collection_efficiency = tax_data['Collection_Efficiency_Percent'].mean() / 100
            
            self.is_trained = True
            logger.info("Tax optimization model trained successfully")
            
        except Exception as e:
            logger.error(f"Error in train_models: {str(e)}")
            raise

    def optimize_taxes(self, economic_condition: str, revenue_target: float) -> List[Dict]:
        """
        Generate tax optimization recommendations based on economic condition and revenue target.
        
        Args:
            economic_condition: Current economic condition ('recession', 'stable', 'growth')
            revenue_target: Target revenue in crores
            
        Returns:
            List[Dict]: List of tax optimization recommendations
        """
        try:
            if not self.is_trained:
                raise RuntimeError("Model must be trained before making recommendations")
            
            # Adjust recommendations based on economic conditions
            adjustments = {
                'recession': {
                    'Income Tax': {'action': 'decrease', 'amount': 2, 'impact': 'medium'},
                    'Corporate Tax': {'action': 'decrease', 'amount': 3, 'impact': 'high'},
                    'GST': {'action': 'decrease', 'amount': 1, 'impact': 'medium'},
                    'Property Tax': {'action': 'maintain', 'amount': 0, 'impact': 'low'},
                    'Customs Duty': {'action': 'decrease', 'amount': 2, 'impact': 'medium'},
                    'Excise Duty': {'action': 'increase', 'amount': 1, 'impact': 'high'}
                },
                'stable': {
                    'Income Tax': {'action': 'maintain', 'amount': 0, 'impact': 'low'},
                    'Corporate Tax': {'action': 'maintain', 'amount': 0, 'impact': 'medium'},
                    'GST': {'action': 'maintain', 'amount': 0, 'impact': 'medium'},
                    'Property Tax': {'action': 'increase', 'amount': 1, 'impact': 'medium'},
                    'Customs Duty': {'action': 'maintain', 'amount': 0, 'impact': 'low'},
                    'Excise Duty': {'action': 'increase', 'amount': 1, 'impact': 'medium'}
                },
                'growth': {
                    'Income Tax': {'action': 'increase', 'amount': 1, 'impact': 'high'},
                    'Corporate Tax': {'action': 'increase', 'amount': 2, 'impact': 'high'},
                    'GST': {'action': 'increase', 'amount': 1, 'impact': 'high'},
                    'Property Tax': {'action': 'increase', 'amount': 2, 'impact': 'medium'},
                    'Customs Duty': {'action': 'decrease', 'amount': 1, 'impact': 'medium'},
                    'Excise Duty': {'action': 'increase', 'amount': 2, 'impact': 'high'}
                }
            }
            
            # Get adjustments for current economic condition
            current_adjustments = adjustments.get(economic_condition, adjustments['stable'])
            
            # Calculate revenue impact
            recommendations = []
            total_projected_revenue = 0
            
            for tax_type, adjustment in current_adjustments.items():
                impact_factor = self.impact_weights.get(adjustment['impact'], 0.5)
                
                # Estimate revenue impact based on action and amount
                if adjustment['action'] == 'increase':
                    revenue_impact = adjustment['amount'] * impact_factor * self.avg_revenue_impact
                    implementation = 'Next Quarter'
                elif adjustment['action'] == 'decrease':
                    revenue_impact = -adjustment['amount'] * impact_factor * self.avg_revenue_impact
                    implementation = 'Immediate'
                else:
                    revenue_impact = 0
                    implementation = 'No Change Required'
                
                total_projected_revenue += revenue_impact
                
                # Create recommendation
                recommendations.append({
                    'tax_type': tax_type,
                    'action': adjustment['action'].capitalize(),
                    'amount': f"{adjustment['amount']}%",
                    'impact': adjustment['impact'].capitalize(),
                    'revenue_impact': round(revenue_impact),
                    'implementation': implementation
                })
            
            # Sort recommendations by impact
            recommendations.sort(key=lambda x: self.impact_weights.get(x['impact'].lower(), 0), reverse=True)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in optimize_taxes: {str(e)}")
            raise

    def project_revenue(self, tax_adjustments: Dict[str, float], base_revenue: float) -> Dict[str, float]:
        """
        Project revenue based on tax adjustments.
        
        Args:
            tax_adjustments: Dictionary of tax type and adjustment percentage
            base_revenue: Base revenue in crores
            
        Returns:
            Dict[str, float]: Projected revenue by tax type
        """
        try:
            if not self.is_trained:
                raise RuntimeError("Model must be trained before making projections")
            
            # Project revenue for each tax type
            projections = {}
            total_projected = 0
            
            for tax_type, adjustment in tax_adjustments.items():
                # Calculate revenue impact
                impact = adjustment * self.avg_revenue_impact * self.avg_collection_efficiency
                projected = base_revenue * (1 + impact/100)
                
                projections[tax_type] = round(projected)
                total_projected += projected
            
            projections['Total'] = round(total_projected)
            
            return projections
            
        except Exception as e:
            logger.error(f"Error in project_revenue: {str(e)}")
            raise 