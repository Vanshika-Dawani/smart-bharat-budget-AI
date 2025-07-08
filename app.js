// Public Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the public dashboard page
    const publicDashboard = document.getElementById('public-dashboard');
    if (!publicDashboard) return;

    // Load budget data from local storage or default data
    loadPublicDashboardData();

    // Set up event listeners
    setupPublicDashboardEvents();
    
    // Listen for budget distribution events from government dashboard
    window.addEventListener('budgetDistributed', function(e) {
        if (e.detail && e.detail.sectors) {
            updatePublicDashboardWithNewData(e.detail.totalBudget, e.detail.sectors);
        }
    });
});

function loadPublicDashboardData() {
    // Get budget data - either from the main dashboard or use default data
    let budgetData = JSON.parse(localStorage.getItem('budgetData')) || getDefaultBudgetData();
    let totalBudget = calculateTotalBudget(budgetData);
    
    // Display total budget
    displayTotalNationalBudget(totalBudget);
    
    // Display sector cards
    displayPublicSectorCards(budgetData, totalBudget);
    
    // Display key budget facts
    displayKeyBudgetFacts(budgetData, totalBudget);
    
    // Initialize charts
    initializePublicCharts(budgetData, totalBudget);
    
    // Initialize comparison table
    initializeComparisonTable(budgetData);
}

function getDefaultBudgetData() {
    return {
        'Education': 150000,
        'Healthcare': 120000,
        'Infrastructure': 100000,
        'Defense': 90000,
        'Agriculture': 70000,
        'Technology': 60000,
        'Social Welfare': 50000,
        'Environment': 40000,
        'Public Safety': 30000,
        'Administrative': 20000
    };
}

function calculateTotalBudget(budgetData) {
    return Object.values(budgetData).reduce((sum, amount) => sum + amount, 0);
}

function displayTotalNationalBudget(totalBudget) {
    const totalBudgetElement = document.getElementById('total-national-budget');
    if (totalBudgetElement) {
        totalBudgetElement.textContent = '₹ ' + formatNumber(totalBudget) + ' Crores';
    }
}

function displayPublicSectorCards(budgetData, totalBudget) {
    const sectorCardsContainer = document.getElementById('public-sector-cards');
    if (!sectorCardsContainer) return;
    
    sectorCardsContainer.innerHTML = '';
    
    // Define sector icons
    const sectorIcons = {
        'Education': 'fa-graduation-cap',
        'Healthcare': 'fa-hospital',
        'Infrastructure': 'fa-road',
        'Defense': 'fa-shield-alt',
        'Agriculture': 'fa-tractor',
        'Technology': 'fa-microchip',
        'Social Welfare': 'fa-hands-helping',
        'Environment': 'fa-leaf',
        'Public Safety': 'fa-user-shield',
        'Administrative': 'fa-building'
    };
    
    // Create a card for each sector
    Object.entries(budgetData).forEach(([sector, amount]) => {
        const percentage = ((amount / totalBudget) * 100).toFixed(2);
        const icon = sectorIcons[sector] || 'fa-money-bill-wave';
        
        const card = document.createElement('div');
        card.className = 'public-sector-card';
        card.innerHTML = `
            <i class="fas ${icon}"></i>
            <h4>${sector}</h4>
            <div class="public-sector-amount">₹ ${formatNumber(amount)} Crores</div>
            <div class="public-sector-percentage">${percentage}% of total budget</div>
            <div class="public-sector-bar">
                <div class="public-sector-progress" style="width: ${percentage}%"></div>
            </div>
        `;
        
        sectorCardsContainer.appendChild(card);
    });
}

function displayKeyBudgetFacts(budgetData, totalBudget) {
    const factsContainer = document.getElementById('facts-container');
    if (!factsContainer) return;
    
    // Calculate some key facts
    const topSector = Object.entries(budgetData).sort((a, b) => b[1] - a[1])[0];
    const socialSpending = (budgetData['Education'] || 0) + (budgetData['Healthcare'] || 0) + (budgetData['Social Welfare'] || 0);
    const socialPercentage = ((socialSpending / totalBudget) * 100).toFixed(2);
    const economicSectors = (budgetData['Agriculture'] || 0) + (budgetData['Infrastructure'] || 0) + (budgetData['Technology'] || 0);
    const economicPercentage = ((economicSectors / totalBudget) * 100).toFixed(2);
    
    // Update fact cards
    factsContainer.innerHTML = `
        <div class="fact-card">
            <i class="fas fa-award"></i>
            <h4>Top Funded Sector</h4>
            <p>${topSector[0]}</p>
        </div>
        <div class="fact-card">
            <i class="fas fa-hands-helping"></i>
            <h4>Social Sector Allocation</h4>
            <p>${socialPercentage}%</p>
        </div>
        <div class="fact-card">
            <i class="fas fa-industry"></i>
            <h4>Economic Sector Allocation</h4>
            <p>${economicPercentage}%</p>
        </div>
        <div class="fact-card">
            <i class="fas fa-rupee-sign"></i>
            <h4>Per Capita Allocation</h4>
            <p>₹ ${formatNumber((totalBudget / 140).toFixed(2))}</p>
        </div>
    `;
}

function initializePublicCharts(budgetData, totalBudget) {
    // Create pie chart for sector allocation
    createSectorPieChart(budgetData);
    
    // Create bar chart for sector comparison
    createSectorBarChart(budgetData);
}

function createSectorPieChart(budgetData) {
    const pieChartCanvas = document.getElementById('sector-pie-chart');
    if (!pieChartCanvas) return;
    
    const ctx = pieChartCanvas.getContext('2d');
    
    // Prepare data for pie chart
    const labels = Object.keys(budgetData);
    const data = Object.values(budgetData);
    
    // Generate random colors for each sector
    const backgroundColors = labels.map(() => getRandomColor());
    
    // Create pie chart
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = ((value / data.reduce((a, b) => a + b, 0)) * 100).toFixed(2);
                            return `${label}: ₹ ${formatNumber(value)} Crores (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createSectorBarChart(budgetData) {
    const barChartCanvas = document.getElementById('sector-bar-chart');
    if (!barChartCanvas) return;
    
    const ctx = barChartCanvas.getContext('2d');
    
    // Prepare data for bar chart
    const sortedSectors = Object.entries(budgetData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const labels = sortedSectors.map(sector => sector[0]);
    const data = sortedSectors.map(sector => sector[1]);
    
    // Create bar chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Budget Allocation (₹ Crores)',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹ ' + formatNumber(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '₹ ' + formatNumber(context.raw) + ' Crores';
                        }
                    }
                }
            }
        }
    });
}

function initializeComparisonTable(budgetData) {
    const comparisonTableBody = document.querySelector('#comparison-table tbody');
    if (!comparisonTableBody) return;
    
    // Get previous year data (using slightly modified current data for demonstration)
    const previousYearData = {};
    Object.entries(budgetData).forEach(([sector, amount]) => {
        // Create random variation for previous year (between -10% and +5%)
        const randomFactor = 0.9 + (Math.random() * 0.15);
        previousYearData[sector] = Math.round(amount * randomFactor);
    });
    
    // Clear table
    comparisonTableBody.innerHTML = '';
    
    // Populate table
    Object.entries(budgetData).forEach(([sector, amount]) => {
        const prevAmount = previousYearData[sector] || 0;
        const difference = amount - prevAmount;
        const percentChange = ((difference / prevAmount) * 100).toFixed(2);
        
        let changeClass = 'no-change';
        if (difference > 0) changeClass = 'positive-change';
        else if (difference < 0) changeClass = 'negative-change';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sector}</td>
            <td>₹ ${formatNumber(prevAmount)} Cr</td>
            <td>₹ ${formatNumber(amount)} Cr</td>
            <td class="${changeClass}">₹ ${formatNumber(difference)} Cr (${percentChange}%)</td>
        `;
        
        comparisonTableBody.appendChild(row);
    });
    
    // Add year selection event handler
    const yearSelect = document.getElementById('comparison-year');
    if (yearSelect) {
        yearSelect.addEventListener('change', function() {
            // In a real application, you would fetch different historical data
            // For demonstration, we'll just refresh the current comparison
            initializeComparisonTable(budgetData);
        });
    }
}

function setupPublicDashboardEvents() {
    // Handle feedback form submission
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
    const feedbackForm = document.querySelector('.feedback-form');
    const feedbackConfirmation = document.getElementById('public-feedback-confirmation');
    const feedbackResults = document.getElementById('public-feedback-results');
    
    if (submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener('click', function() {
            const topic = document.getElementById('feedback-topic').value;
            const feedbackText = document.getElementById('feedback-text').value;
            const satisfaction = document.getElementById('feedback-satisfaction').value;
            
            if (!feedbackText || feedbackText.trim() === '') {
                alert('Please enter your feedback before submitting');
                return;
            }
            
            // Disable the button during submission
            submitFeedbackBtn.disabled = true;
            submitFeedbackBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            // Simulate processing delay
            setTimeout(() => {
                // Process the feedback and update both dashboards using global feedbackDatabase
                updatePublicFeedbackMetrics(topic, feedbackText, parseInt(satisfaction));
                
                // Show confirmation message
                if (feedbackForm) feedbackForm.classList.add('hidden');
                if (feedbackConfirmation) feedbackConfirmation.classList.remove('hidden');
                
                // Show feedback results
                if (feedbackResults) {
                    setTimeout(() => {
                        feedbackResults.classList.remove('hidden');
                    }, 2000);
                }
                
                // Reset form after a delay
                setTimeout(() => {
                    if (feedbackForm) {
                        document.getElementById('feedback-text').value = '';
                        document.getElementById('feedback-satisfaction').value = '5';
                        feedbackForm.classList.remove('hidden');
                    }
                    if (feedbackConfirmation) feedbackConfirmation.classList.add('hidden');
                }, 3000);
                
                // Re-enable the button
                submitFeedbackBtn.disabled = false;
                submitFeedbackBtn.innerHTML = 'Submit Feedback';
            }, 1500);
        });
    }
    
    // Set up public dashboard navigation
    const navLinks = document.querySelectorAll('.sidebar li');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const sectionId = this.getAttribute('onclick').match(/showPublicSection\('(.+?)'\)/)[1];
            showPublicSection(sectionId);
        });
    });
}

function showPublicSection(sectionId) {
    console.log('Showing public section:', sectionId);
    
    // Hide all sections
    const sections = document.querySelectorAll('#public-dashboard .section');
    console.log('Found sections:', sections.length);
    
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    console.log('Selected section found:', selectedSection ? 'Yes' : 'No');
    
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
        console.log('Removed hidden class from section');
    }
    
    // Update active state in sidebar
    const navItems = document.querySelectorAll('#public-dashboard .sidebar li');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(sectionId)) {
            item.classList.add('active');
        }
    });
}

function updatePublicFeedbackMetrics(topic, feedbackText, satisfaction) {
    // Process this feedback to add it to the global feedback database
    // that will be shared with the government dashboard
    processFeedback(topic, feedbackText, parseInt(satisfaction));
    
    // Update total feedback count
    const totalFeedbackElement = document.getElementById('public-total-feedback-count');
    if (totalFeedbackElement) {
        // Use the actual count from the database
        const totalCount = feedbackDatabase.reduce((sum, item) => sum + item.frequency, 0);
        totalFeedbackElement.textContent = totalCount;
    }
    
    // Update overall satisfaction
    const satisfactionElement = document.getElementById('public-overall-satisfaction');
    if (satisfactionElement) {
        // Calculate from the entire database
        const totalCount = feedbackDatabase.reduce((sum, item) => sum + item.frequency, 0);
        if (totalCount > 0) {
            const totalSatisfaction = feedbackDatabase.reduce((sum, item) => sum + (item.satisfactionTotal), 0);
            const avgSatisfaction = Math.round((totalSatisfaction / totalCount) * 10);
            satisfactionElement.textContent = `${avgSatisfaction}%`;
        } else {
            satisfactionElement.textContent = '0%';
        }
    }
    
    // Update top concern
    const topConcernElement = document.getElementById('public-top-concern');
    if (topConcernElement) {
        // Get top concern from the database
        const concerns = feedbackDatabase.filter(item => item.sentiment === 'Negative');
        if (concerns.length > 0) {
            // Sort by frequency
            concerns.sort((a, b) => b.frequency - a.frequency);
            topConcernElement.textContent = concerns[0].topic;
        } else {
            topConcernElement.textContent = 'None';
        }
    }
    
    // Add row to feedback analysis table
    const tableBody = document.getElementById('public-feedback-analysis-body');
    if (tableBody) {
        tableBody.innerHTML = ''; // Clear existing content
        
        // Add rows for top 5 feedback items
        const topFeedbacks = [...feedbackDatabase].sort((a, b) => b.frequency - a.frequency).slice(0, 5);
        
        topFeedbacks.forEach(feedback => {
            const row = document.createElement('tr');
            
            // Set row content
            row.innerHTML = `
                <td>${feedback.topic}</td>
                <td>${feedback.text.length > 30 ? feedback.text.substring(0, 30) + '...' : feedback.text}</td>
                <td class="importance-${feedback.importance.toLowerCase()}">${feedback.importance}</td>
                <td class="sentiment-${feedback.sentiment.toLowerCase()}">${feedback.sentiment}</td>
                <td class="frequency-count">${feedback.frequency}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // If no feedback, show message
        if (feedbackDatabase.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.textContent = 'No feedback data available yet.';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            tableBody.appendChild(row);
        }
    }
    
    // Update the word cloud in the public dashboard
    updatePublicWordCloud();
    
    // After processing the feedback, also update the government dashboard
    // This ensures changes appear there too
    if (typeof updateFeedbackAnalysis === 'function') {
        updateFeedbackAnalysis();
    }
}

function updatePublicWordCloud() {
    const cloudContainer = document.getElementById('public-feedback-cloud-container');
    if (!cloudContainer) return;
    
    cloudContainer.innerHTML = '';
    
    // Extract all keywords from all feedback
    const allKeywords = {};
    feedbackDatabase.forEach(feedback => {
        if (feedback.keywords && Array.isArray(feedback.keywords)) {
            feedback.keywords.forEach(keyword => {
                const word = keyword.word;
                allKeywords[word] = (allKeywords[word] || 0) + keyword.count;
            });
        }
    });
    
    // Convert to array and sort by frequency
    const keywordArray = Object.entries(allKeywords);
    keywordArray.sort((a, b) => b[1] - a[1]);
    
    // Take top keywords
    const topKeywords = keywordArray.slice(0, 15);
    
    // Create elements for each keyword
    topKeywords.forEach(([word, count]) => {
        // Determine word category for styling
        const category = determineWordCategory(word);
        
        // Create keyword element
        const keywordElement = document.createElement('span');
        keywordElement.className = `word-cloud-item keyword-${category}`;
        keywordElement.textContent = word;
        keywordElement.style.fontSize = `${Math.max(1, Math.min(2.5, 1 + count / 5))}em`;
        
        // Add to container
        cloudContainer.appendChild(keywordElement);
    });
    
    // If no keywords, show message
    if (topKeywords.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'No feedback data available yet.';
        message.style.color = '#777';
        message.style.textAlign = 'center';
        cloudContainer.appendChild(message);
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Disaster Fund Predictor functionality
function calculateDisasterFund() {
    // Get input values
    const severity = parseFloat(document.getElementById('disaster-severity').value);
    const estimatedDamage = parseFloat(document.getElementById('estimated-damage').value);
    
    // Validate inputs
    if (isNaN(severity) || isNaN(estimatedDamage)) {
        alert('Please enter valid numbers for both fields');
        return;
    }
    
    if (severity < 1 || severity > 10) {
        alert('Severity must be between 1 and 10');
        return;
    }
    
    if (estimatedDamage <= 0) {
        alert('Estimated damage must be greater than 0');
        return;
    }
    
    // Calculate required fund based on damage and severity
    const severityFactor = severity / 10; // Convert to 0.1-1.0 scale
    const requiredFund = estimatedDamage * (0.4 + (severityFactor * 0.4)); // 40-80% coverage based on severity
    
    // Get budget data from local storage or default data
    const budgetData = JSON.parse(localStorage.getItem('budgetData')) || getDefaultBudgetData();
    
    // Calculate budget adjustments
    const { originalBudget, adjustedBudget } = calculateBudgetAdjustments(budgetData, requiredFund);
    
    // Display the results
    displayDisasterPredictionResults(requiredFund, originalBudget, adjustedBudget);
}

function calculateBudgetAdjustments(budgetData, requiredFund) {
    // Create copies of the budget data to avoid modifying the original
    const originalBudget = {...budgetData};
    const adjustedBudget = {...budgetData};
    
    // Calculate total budget
    const totalBudget = calculateTotalBudget(budgetData);
    
    // Ensure the required fund doesn't exceed 30% of total budget
    const maxAllocation = totalBudget * 0.3;
    const finalRequiredFund = Math.min(requiredFund, maxAllocation);
    
    // Define sector priorities (lower number = higher priority)
    const sectorPriorities = {
        'Healthcare': 1,
        'Education': 2,
        'Social Welfare': 3,
        'Environment': 4,
        'Agriculture': 5,
        'Infrastructure': 6,
        'Technology': 7,
        'Public Safety': 8,
        'Defense': 9,
        'Administrative': 10
    };
    
    // Sort sectors by priority (lowest to highest)
    const sortedSectors = Object.keys(adjustedBudget).sort((a, b) => {
        return (sectorPriorities[b] || 99) - (sectorPriorities[a] || 99);
    });
    
    // Calculate remaining amount that needs to be allocated
    let remainingAmount = finalRequiredFund;
    
    // Reduce budgets based on priority
    for (const sector of sortedSectors) {
        if (remainingAmount <= 0) break;
        
        // Calculate max reduction for this sector (up to 15%)
        const maxReduction = adjustedBudget[sector] * 0.15;
        
        // Calculate actual reduction
        const actualReduction = Math.min(maxReduction, remainingAmount);
        
        // Update adjusted budget
        adjustedBudget[sector] -= actualReduction;
        
        // Update remaining amount
        remainingAmount -= actualReduction;
    }
    
    return { originalBudget, adjustedBudget };
}

function displayDisasterPredictionResults(requiredFund, originalBudget, adjustedBudget) {
    // Display required fund
    document.getElementById('required-fund').textContent = `₹${requiredFund.toFixed(2)} Cr`;
    
    // Get the table body element
    const tableBody = document.getElementById('budget-adjustment-table-body');
    
    // Clear existing table rows
    tableBody.innerHTML = '';
    
    // Add rows for each sector
    for (const sector in originalBudget) {
        // Skip sectors with no change
        if (originalBudget[sector] === adjustedBudget[sector]) continue;
        
        // Calculate difference and format it
        const difference = adjustedBudget[sector] - originalBudget[sector];
        const formattedDifference = difference.toFixed(2);
        
        // Create new row
        const row = document.createElement('tr');
        
        // Add cell for sector name
        const sectorCell = document.createElement('td');
        sectorCell.textContent = sector;
        row.appendChild(sectorCell);
        
        // Add cell for original budget
        const originalCell = document.createElement('td');
        originalCell.textContent = `₹${originalBudget[sector].toFixed(2)} Cr`;
        row.appendChild(originalCell);
        
        // Add cell for adjusted budget
        const adjustedCell = document.createElement('td');
        adjustedCell.textContent = `₹${adjustedBudget[sector].toFixed(2)} Cr`;
        row.appendChild(adjustedCell);
        
        // Add cell for difference
        const differenceCell = document.createElement('td');
        differenceCell.textContent = `₹${formattedDifference} Cr`;
        differenceCell.className = difference < 0 ? 'negative-change' : 'no-change';
        row.appendChild(differenceCell);
        
        // Add row to table
        tableBody.appendChild(row);
    }
    
    // Show the prediction results
    document.querySelector('.prediction-results').classList.remove('hidden');
}

// Add event listener for calculate button
document.addEventListener('DOMContentLoaded', function() {
    // Existing event listeners
    // ... existing code ...
    
    // Add event listener for calculate disaster fund button
    const calculateButton = document.getElementById('calculate-disaster-fund');
    if (calculateButton) {
        calculateButton.addEventListener('click', calculateDisasterFund);
    }
});

// New function to handle budget distribution events
function updatePublicDashboardWithNewData(totalBudget, sectorsData) {
    // Convert sectorsData array to the expected object format
    const budgetData = {};
    sectorsData.forEach(sector => {
        budgetData[sector.sector] = sector.amount;
    });
    
    // Update localStorage to persist the data
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
    
    // Display updated data
    displayTotalNationalBudget(totalBudget);
    displayPublicSectorCards(budgetData, totalBudget);
    displayKeyBudgetFacts(budgetData, totalBudget);
    
    // Update charts
    updatePublicCharts(budgetData);
    
    // Update comparison table
    initializeComparisonTable(budgetData);
    
    // Log synchronization for debugging
    console.log('Public dashboard synchronized with government dashboard:', {
        totalBudget,
        sectors: sectorsData
    });
}

// Function to update charts without recreating them
function updatePublicCharts(budgetData) {
    // Update pie chart
    updateSectorPieChart(budgetData);
    
    // Update bar chart
    updateSectorBarChart(budgetData);
    
    // Update comparison table
    initializeComparisonTable(budgetData);
}

function updateSectorPieChart(budgetData) {
    const pieChartCanvas = document.getElementById('sector-pie-chart');
    if (!pieChartCanvas) return;
    
    const chart = Chart.getChart(pieChartCanvas);
    if (!chart) return;
    
    // Prepare data for pie chart
    const labels = Object.keys(budgetData);
    const data = Object.values(budgetData);
    
    // Update chart data
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    
    // Update the chart
    chart.update();
}

function updateSectorBarChart(budgetData) {
    const barChartCanvas = document.getElementById('sector-bar-chart');
    if (!barChartCanvas) return;
    
    const chart = Chart.getChart(barChartCanvas);
    if (!chart) return;
    
    // Prepare data for bar chart
    const labels = Object.keys(budgetData);
    const data = Object.values(budgetData);
    
    // Update chart data
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    
    // Update the chart
    chart.update();
} 