from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from web3 import Web3
from hfc.fabric import Client
import json
from .serializers import (
    VoteSerializer,
    FundTransferSerializer,
    DepartmentSerializer,
    FraudAlertSerializer
)
from .models import Vote, FundTransfer, Department, FraudAlert, Feedback
import os

class BlockchainViewSet(viewsets.ViewSet):
    def __init__(self):
        self.web3 = Web3(Web3.HTTPProvider(settings.ETHEREUM_RPC_URL))
        self.fabric_client = Client(net_profile=settings.FABRIC_CONFIG_PATH)
        
        # Load contract ABI and address
        with open('contracts/BudgetVoting.json', 'r') as f:
            contract_data = json.load(f)
            self.voting_contract = self.web3.eth.contract(
                address=contract_data['address'],
                abi=contract_data['abi']
            )

    @action(detail=False, methods=['post'])
    def cast_vote(self, request):
        serializer = VoteSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Submit vote to Ethereum
                tx_hash = self.voting_contract.functions.castVote(
                    serializer.validated_data['sector'],
                    int(serializer.validated_data['amount'] * 1e18)
                ).transact({'from': self.web3.eth.accounts[0]})
                
                # Save vote record
                vote = serializer.save()
                vote.tx_hash = tx_hash.hex()
                vote.save()
                
                return Response({
                    'status': 'success',
                    'tx_hash': tx_hash.hex()
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def get_voting_results(self, request):
        try:
            results = self.voting_contract.functions.getVotingResults().call()
            return Response({
                'sectors': results[0],
                'vote_counts': results[1],
                'amounts': results[2]
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def transfer_funds(self, request):
        serializer = FundTransferSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Submit transfer to Hyperledger
                channel = self.fabric_client.new_channel('mychannel')
                chaincode = channel.get_chaincode('budget_tracking')
                
                response = chaincode.invoke(
                    'TransferFunds',
                    [
                        serializer.validated_data['from_department'],
                        serializer.validated_data['to_department'],
                        str(serializer.validated_data['amount']),
                        serializer.validated_data['purpose']
                    ]
                )
                
                # Save transfer record
                transfer = serializer.save()
                transfer.tx_id = response['tx_id']
                transfer.save()
                
                return Response({
                    'status': 'success',
                    'tx_id': response['tx_id']
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def get_departments(self, request):
        try:
            channel = self.fabric_client.new_channel('mychannel')
            chaincode = channel.get_chaincode('budget_tracking')
            
            response = chaincode.query('GetAllDepartments', [])
            departments = json.loads(response)
            
            return Response(departments)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def report_fraud(self, request):
        serializer = FraudAlertSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Submit fraud alert to Hyperledger
                channel = self.fabric_client.new_channel('mychannel')
                chaincode = channel.get_chaincode('budget_tracking')
                
                response = chaincode.invoke(
                    'RecordFraudAlert',
                    [
                        serializer.validated_data['department'],
                        str(serializer.validated_data['amount']),
                        serializer.validated_data['pattern'],
                        str(serializer.validated_data['confidence'])
                    ]
                )
                
                # Save fraud alert
                alert = serializer.save()
                alert.tx_id = response['tx_id']
                alert.save()
                
                return Response({
                    'status': 'success',
                    'tx_id': response['tx_id']
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def get_audit_logs(self, request):
        try:
            channel = self.fabric_client.new_channel('mychannel')
            chaincode = channel.get_chaincode('budget_tracking')
            
            response = chaincode.query('GetAuditLogs', [])
            logs = json.loads(response)
            
            return Response(logs)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class VoteListCreateView(generics.ListCreateAPIView):
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Update votes.json
        self.update_votes_json(serializer.validated_data)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update_votes_json(self, vote_data):
        json_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'votes.json')
        
        try:
            with open(json_file_path, 'r') as f:
                data = json.load(f)
        except FileNotFoundError:
            data = {
                'votes': [],
                'totalVotes': 0,
                'sectorVotes': {
                    'healthcare': 0,
                    'education': 0,
                    'infrastructure': 0,
                    'agriculture': 0,
                    'defense': 0,
                    'social_welfare': 0
                },
                'feedback': []
            }

        # Update votes array
        data['votes'].append({
            'sector': vote_data['sector'],
            'amount': vote_data['amount'],
            'timestamp': vote_data['timestamp'].isoformat()
        })

        # Update total votes
        data['totalVotes'] += 1

        # Update sector votes
        sector = vote_data['sector'].lower().replace(' ', '_')
        if sector in data['sectorVotes']:
            data['sectorVotes'][sector] += 1

        with open(json_file_path, 'w') as f:
            json.dump(data, f, indent=4)

class VoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vote.objects.all()
    serializer_class = VoteSerializer

class FeedbackListCreateView(generics.ListCreateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Update votes.json
        self.update_feedback_json(serializer.validated_data)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update_feedback_json(self, feedback_data):
        json_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'votes.json')
        
        try:
            with open(json_file_path, 'r') as f:
                data = json.load(f)
        except FileNotFoundError:
            data = {
                'votes': [],
                'totalVotes': 0,
                'sectorVotes': {
                    'healthcare': 0,
                    'education': 0,
                    'infrastructure': 0,
                    'agriculture': 0,
                    'defense': 0,
                    'social_welfare': 0
                },
                'feedback': []
            }

        # Update feedback array
        data['feedback'].append({
            'name': feedback_data['name'],
            'email': feedback_data['email'],
            'message': feedback_data['message'],
            'timestamp': feedback_data['timestamp'].isoformat()
        })

        with open(json_file_path, 'w') as f:
            json.dump(data, f, indent=4)

class FeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

class SectorVotesView(APIView):
    def get(self, request):
        json_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'votes.json')
        
        try:
            with open(json_file_path, 'r') as f:
                data = json.load(f)
                return Response(data['sectorVotes'])
        except FileNotFoundError:
            return Response({
                'healthcare': 0,
                'education': 0,
                'infrastructure': 0,
                'agriculture': 0,
                'defense': 0,
                'social_welfare': 0
            })

class TotalVotesView(APIView):
    def get(self, request):
        json_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'votes.json')
        
        try:
            with open(json_file_path, 'r') as f:
                data = json.load(f)
                return Response({'totalVotes': data['totalVotes']})
        except FileNotFoundError:
            return Response({'totalVotes': 0}) 