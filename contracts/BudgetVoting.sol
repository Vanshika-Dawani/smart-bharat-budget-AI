// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BudgetVoting {
    struct Vote {
        address voter;
        string sector;
        uint256 timestamp;
    }

    struct SectorVotes {
        uint256 totalVotes;
        uint256 totalAmount;
        mapping(address => bool) hasVoted;
    }

    address public owner;
    mapping(string => SectorVotes) public sectorVotes;
    Vote[] public votes;
    uint256 public votingStartTime;
    uint256 public votingEndTime;
    uint256 public totalBudget;
    bool public votingActive;

    event VoteCast(address indexed voter, string sector, uint256 amount);
    event VotingThresholdReached(string sector, uint256 votes);
    event VotingPeriodEnded(uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier votingPeriodActive() {
        require(votingActive, "Voting period is not active");
        require(block.timestamp >= votingStartTime && block.timestamp <= votingEndTime, "Outside voting period");
        _;
    }

    constructor(uint256 _totalBudget, uint256 _votingDuration) {
        owner = msg.sender;
        totalBudget = _totalBudget;
        votingStartTime = block.timestamp;
        votingEndTime = block.timestamp + _votingDuration;
        votingActive = true;
    }

    function castVote(string memory _sector, uint256 _amount) public votingPeriodActive {
        require(_amount > 0, "Amount must be greater than 0");
        require(!sectorVotes[_sector].hasVoted[msg.sender], "Already voted for this sector");
        
        sectorVotes[_sector].totalVotes++;
        sectorVotes[_sector].totalAmount += _amount;
        sectorVotes[_sector].hasVoted[msg.sender] = true;
        
        votes.push(Vote({
            voter: msg.sender,
            sector: _sector,
            timestamp: block.timestamp
        }));

        emit VoteCast(msg.sender, _sector, _amount);

        // Check if threshold reached (e.g., 1000 votes)
        if (sectorVotes[_sector].totalVotes >= 1000) {
            emit VotingThresholdReached(_sector, sectorVotes[_sector].totalVotes);
        }
    }

    function getSectorVotes(string memory _sector) public view returns (uint256, uint256) {
        return (sectorVotes[_sector].totalVotes, sectorVotes[_sector].totalAmount);
    }

    function hasVoted(string memory _sector, address _voter) public view returns (bool) {
        return sectorVotes[_sector].hasVoted[_voter];
    }

    function endVoting() public onlyOwner {
        require(votingActive, "Voting already ended");
        votingActive = false;
        emit VotingPeriodEnded(block.timestamp);
    }

    function getVotingResults() public view returns (string[] memory, uint256[] memory, uint256[] memory) {
        string[] memory sectors = new string[](6);
        uint256[] memory voteCounts = new uint256[](6);
        uint256[] memory amounts = new uint256[](6);
        
        sectors[0] = "healthcare";
        sectors[1] = "education";
        sectors[2] = "infrastructure";
        sectors[3] = "agriculture";
        sectors[4] = "defense";
        sectors[5] = "socialWelfare";
        
        for (uint256 i = 0; i < 6; i++) {
            voteCounts[i] = sectorVotes[sectors[i]].totalVotes;
            amounts[i] = sectorVotes[sectors[i]].totalAmount;
        }
        
        return (sectors, voteCounts, amounts);
    }
} 