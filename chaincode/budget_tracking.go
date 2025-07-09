package main

import (
    "encoding/json"
    "fmt"
    "strconv"
    "time"

    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type BudgetTracking struct {
    contractapi.Contract
}

type FundTransfer struct {
    ID            string    `json:"id"`
    FromDepartment string   `json:"fromDepartment"`
    ToDepartment   string   `json:"toDepartment"`
    Amount         float64   `json:"amount"`
    Purpose        string    `json:"purpose"`
    Timestamp      time.Time `json:"timestamp"`
    Status         string    `json:"status"`
    Milestone      string    `json:"milestone"`
}

type Department struct {
    ID            string    `json:"id"`
    Name          string    `json:"name"`
    TotalBudget   float64   `json:"totalBudget"`
    UsedBudget    float64   `json:"usedBudget"`
    LastUpdated   time.Time `json:"lastUpdated"`
}

func (s *BudgetTracking) InitLedger(ctx contractapi.TransactionContextInterface) error {
    departments := []Department{
        {ID: "D1", Name: "Healthcare", TotalBudget: 50000, UsedBudget: 0},
        {ID: "D2", Name: "Education", TotalBudget: 40000, UsedBudget: 0},
        {ID: "D3", Name: "Infrastructure", TotalBudget: 45000, UsedBudget: 0},
        {ID: "D4", Name: "Agriculture", TotalBudget: 30000, UsedBudget: 0},
        {ID: "D5", Name: "Defense", TotalBudget: 35000, UsedBudget: 0},
        {ID: "D6", Name: "Social Welfare", TotalBudget: 25000, UsedBudget: 0},
    }

    for _, department := range departments {
        departmentJSON, err := json.Marshal(department)
        if err != nil {
            return err
        }

        err = ctx.GetStub().PutState(department.ID, departmentJSON)
        if err != nil {
            return fmt.Errorf("failed to put to world state. %v", err)
        }
    }

    return nil
}

func (s *BudgetTracking) TransferFunds(ctx contractapi.TransactionContextInterface, 
    fromDepartmentID string, toDepartmentID string, amount float64, purpose string) error {
    
    // Get departments
    fromDepartment, err := s.GetDepartment(ctx, fromDepartmentID)
    if err != nil {
        return err
    }

    toDepartment, err := s.GetDepartment(ctx, toDepartmentID)
    if err != nil {
        return err
    }

    // Check if transfer is possible
    if fromDepartment.UsedBudget+amount > fromDepartment.TotalBudget {
        return fmt.Errorf("insufficient funds in department %s", fromDepartmentID)
    }

    // Update departments
    fromDepartment.UsedBudget += amount
    toDepartment.UsedBudget += amount
    fromDepartment.LastUpdated = time.Now()
    toDepartment.LastUpdated = time.Now()

    // Save updated departments
    fromDepartmentJSON, err := json.Marshal(fromDepartment)
    if err != nil {
        return err
    }
    err = ctx.GetStub().PutState(fromDepartmentID, fromDepartmentJSON)
    if err != nil {
        return err
    }

    toDepartmentJSON, err := json.Marshal(toDepartment)
    if err != nil {
        return err
    }
    err = ctx.GetStub().PutState(toDepartmentID, toDepartmentJSON)
    if err != nil {
        return err
    }

    // Create and save transfer record
    transfer := FundTransfer{
        ID:            fmt.Sprintf("TRANSFER%d", time.Now().UnixNano()),
        FromDepartment: fromDepartmentID,
        ToDepartment:   toDepartmentID,
        Amount:         amount,
        Purpose:        purpose,
        Timestamp:      time.Now(),
        Status:         "COMPLETED",
    }

    transferJSON, err := json.Marshal(transfer)
    if err != nil {
        return err
    }

    return ctx.GetStub().PutState(transfer.ID, transferJSON)
}

func (s *BudgetTracking) GetDepartment(ctx contractapi.TransactionContextInterface, id string) (*Department, error) {
    departmentJSON, err := ctx.GetStub().GetState(id)
    if err != nil {
        return nil, fmt.Errorf("failed to read from world state: %v", err)
    }
    if departmentJSON == nil {
        return nil, fmt.Errorf("department %s does not exist", id)
    }

    var department Department
    err = json.Unmarshal(departmentJSON, &department)
    if err != nil {
        return nil, err
    }

    return &department, nil
}

func (s *BudgetTracking) GetTransfer(ctx contractapi.TransactionContextInterface, id string) (*FundTransfer, error) {
    transferJSON, err := ctx.GetStub().GetState(id)
    if err != nil {
        return nil, fmt.Errorf("failed to read from world state: %v", err)
    }
    if transferJSON == nil {
        return nil, fmt.Errorf("transfer %s does not exist", id)
    }

    var transfer FundTransfer
    err = json.Unmarshal(transferJSON, &transfer)
    if err != nil {
        return nil, err
    }

    return &transfer, nil
}

func (s *BudgetTracking) GetAllDepartments(ctx contractapi.TransactionContextInterface) ([]*Department, error) {
    resultsIterator, err := ctx.GetStub().GetStateByRange("D1", "D6")
    if err != nil {
        return nil, err
    }
    defer resultsIterator.Close()

    var departments []*Department
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, err
        }

        var department Department
        err = json.Unmarshal(queryResponse.Value, &department)
        if err != nil {
            return nil, err
        }
        departments = append(departments, &department)
    }

    return departments, nil
}

func main() {
    chaincode, err := contractapi.NewChaincode(&BudgetTracking{})
    if err != nil {
        fmt.Printf("Error creating budget tracking chaincode: %s", err.Error())
        return
    }

    if err := chaincode.Start(); err != nil {
        fmt.Printf("Error starting budget tracking chaincode: %s", err.Error())
    }
} 