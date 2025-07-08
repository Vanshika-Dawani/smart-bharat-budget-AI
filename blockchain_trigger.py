from web3 import Web3
from hfc.fabric import Client
import json
import logging
from datetime import datetime
from typing import Dict, Any

class BlockchainTrigger:
    def __init__(self, ethereum_rpc_url: str, fabric_config_path: str):
        self.web3 = Web3(Web3.HTTPProvider(ethereum_rpc_url))
        self.fabric_client = Client(net_profile=fabric_config_path)
        
        # Load contract ABI and address
        with open('contracts/BudgetVoting.json', 'r') as f:
            contract_data = json.load(f)
            self.voting_contract = self.web3.eth.contract(
                address=contract_data['address'],
                abi=contract_data['abi']
            )
        
        # Initialize logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    async def handle_ai_prediction(self, prediction_data: Dict[str, Any]):
        """
        Handle AI predictions and trigger appropriate blockchain actions
        """
        try:
            if prediction_data['type'] == 'emergency_fund':
                await self._handle_emergency_fund(prediction_data)
            elif prediction_data['type'] == 'fraud_detection':
                await self._handle_fraud_detection(prediction_data)
            elif prediction_data['type'] == 'budget_forecast':
                await self._handle_budget_forecast(prediction_data)
        except Exception as e:
            self.logger.error(f"Error handling AI prediction: {str(e)}")

    async def _handle_emergency_fund(self, data: Dict[str, Any]):
        """
        Handle emergency fund allocation based on AI prediction
        """
        try:
            # Trigger Ethereum smart contract for public voting
            tx_hash = self.voting_contract.functions.castVote(
                data['sector'],
                int(data['amount'] * 1e18)  # Convert to wei
            ).transact({'from': self.web3.eth.accounts[0]})
            
            self.logger.info(f"Emergency fund voting triggered: {tx_hash.hex()}")

            # Record in Hyperledger
            await self._record_fund_transfer(
                from_department="emergency_reserve",
                to_department=data['sector'],
                amount=data['amount'],
                purpose=f"Emergency allocation based on AI prediction: {data['reason']}"
            )
        except Exception as e:
            self.logger.error(f"Error handling emergency fund: {str(e)}")

    async def _handle_fraud_detection(self, data: Dict[str, Any]):
        """
        Handle fraud detection alerts
        """
        try:
            # Record suspicious activity in Hyperledger
            await self._record_fraud_alert(
                department=data['department'],
                amount=data['amount'],
                pattern=data['pattern'],
                confidence=data['confidence']
            )
        except Exception as e:
            self.logger.error(f"Error handling fraud detection: {str(e)}")

    async def _handle_budget_forecast(self, data: Dict[str, Any]):
        """
        Handle budget forecasting predictions
        """
        try:
            # Update budget allocations in Hyperledger
            for sector, amount in data['forecast'].items():
                await self._update_budget_allocation(
                    department=sector,
                    new_amount=amount,
                    reason="AI forecast adjustment"
                )
        except Exception as e:
            self.logger.error(f"Error handling budget forecast: {str(e)}")

    async def _record_fund_transfer(self, from_department: str, to_department: str, 
                                  amount: float, purpose: str):
        """
        Record fund transfer in Hyperledger
        """
        try:
            # Get the channel and chaincode
            channel = self.fabric_client.new_channel('mychannel')
            chaincode = channel.get_chaincode('budget_tracking')

            # Submit transaction
            response = await chaincode.invoke(
                'TransferFunds',
                [from_department, to_department, str(amount), purpose]
            )
            
            self.logger.info(f"Fund transfer recorded: {response}")
        except Exception as e:
            self.logger.error(f"Error recording fund transfer: {str(e)}")

    async def _record_fraud_alert(self, department: str, amount: float, 
                                pattern: str, confidence: float):
        """
        Record fraud alert in Hyperledger
        """
        try:
            # Get the channel and chaincode
            channel = self.fabric_client.new_channel('mychannel')
            chaincode = channel.get_chaincode('budget_tracking')

            # Submit transaction
            response = await chaincode.invoke(
                'RecordFraudAlert',
                [department, str(amount), pattern, str(confidence)]
            )
            
            self.logger.info(f"Fraud alert recorded: {response}")
        except Exception as e:
            self.logger.error(f"Error recording fraud alert: {str(e)}")

    async def _update_budget_allocation(self, department: str, new_amount: float, 
                                      reason: str):
        """
        Update budget allocation in Hyperledger
        """
        try:
            # Get the channel and chaincode
            channel = self.fabric_client.new_channel('mychannel')
            chaincode = channel.get_chaincode('budget_tracking')

            # Submit transaction
            response = await chaincode.invoke(
                'UpdateBudget',
                [department, str(new_amount), reason]
            )
            
            self.logger.info(f"Budget allocation updated: {response}")
        except Exception as e:
            self.logger.error(f"Error updating budget allocation: {str(e)}") 