// Feedback database to store all feedback entries
let feedbackDatabase = [];

// Initialize the feedback system
function initializeFeedbackSystem() {
    // Load existing data from JSON file
    loadFeedbackData();
    
    // Set up event listeners
    setupFeedbackEvents();
}

// Load feedback data from JSON file
function loadFeedbackData() {
    fetch('votes.json')
        .then(response => response.json())
        .then(data => {
            feedbackDatabase = data.feedback;
            updateFeedbackAnalysis();
        })
        .catch(error => {
            console.error('Error loading feedback data:', error);
            // Initialize with empty data if file doesn't exist
            feedbackDatabase = [];
        });
}

// Save feedback data to JSON file
function saveFeedbackData() {
    const data = {
        votes: [],
        totalVotes: 0,
        sectorVotes: {
            healthcare: 0,
            education: 0,
            infrastructure: 0,
            agriculture: 0,
            defense: 0,
            "social-welfare": 0
        },
        feedback: feedbackDatabase
    };

    // In a real application, you would send this data to a server
    // For this demo, we'll simulate saving to a file
    console.log('Saving feedback data:', data);
    // Note: In a real application, you would need server-side code to handle the file saving
}

// Set up feedback form event listeners
function setupFeedbackEvents() {
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
    if (submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener('click', submitFeedback);
    }
}

// Submit feedback function
function submitFeedback() {
    const topic = document.getElementById('feedback-topic').value;
    const feedbackText = document.getElementById('feedback-text').value.trim();
    const satisfaction = document.getElementById('feedback-satisfaction').value;
    
    // Validate input
    if (!feedbackText) {
        alert('Please enter your feedback before submitting.');
        return;
    }
    
    // Disable button during processing
    const submitBtn = document.getElementById('submit-feedback-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Process feedback
    setTimeout(() => {
        try {
            // Process and store the feedback
            processFeedback(topic, feedbackText, parseInt(satisfaction));
            
            // Clear the form
            document.getElementById('feedback-text').value = '';
            document.getElementById('feedback-satisfaction').value = 5;
            
            // Show success message
            showFeedbackConfirmation();
            
            // Update the analysis display
            updateFeedbackAnalysis();
        } catch (error) {
            console.error('Error processing feedback:', error);
            alert('There was an error processing your feedback. Please try again.');
        } finally {
            // Re-enable the button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }, 1500);
}

// Process and analyze the feedback
function processFeedback(topic, feedbackText, satisfaction) {
    // Normalize the feedback text
    const normalizedText = feedbackText.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Check if similar feedback exists
    const existingFeedback = feedbackDatabase.find(item => {
        return calculateSimilarity(normalizedText, item.normalizedText) > 0.7;
    });
    
    if (existingFeedback) {
        // Update existing feedback
        existingFeedback.frequency += 1;
        existingFeedback.satisfactionTotal += satisfaction;
        existingFeedback.satisfactionAvg = Math.round(existingFeedback.satisfactionTotal / existingFeedback.frequency);
        existingFeedback.importance = calculateImportance(existingFeedback.frequency, existingFeedback.sentiment);
    } else {
        // Analyze sentiment
        let sentiment;
        if (satisfaction <= 4) sentiment = 'Negative';
        else if (satisfaction <= 6) sentiment = 'Neutral';
        else sentiment = 'Positive';
        
        // Extract keywords
        const keywords = extractKeywords(normalizedText, topic);
        
        // Calculate initial importance
        const importance = calculateImportance(1, sentiment);
        
        // Add new feedback to database
        feedbackDatabase.push({
            id: Date.now(),
            topic: formatTopic(topic),
            text: feedbackText,
            normalizedText: normalizedText,
            sentiment: sentiment,
            satisfaction: satisfaction,
            satisfactionTotal: satisfaction,
            satisfactionAvg: satisfaction,
            frequency: 1,
            importance: importance,
            keywords: keywords,
            timestamp: new Date().toISOString()
        });
    }
    
    // Sort feedback by importance and frequency
    feedbackDatabase.sort((a, b) => {
        const importanceOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        if (importanceOrder[b.importance] !== importanceOrder[a.importance]) {
            return importanceOrder[b.importance] - importanceOrder[a.importance];
        }
        return b.frequency - a.frequency;
    });

    // Save the updated data
    saveFeedbackData();
}

// Calculate text similarity (simple implementation)
function calculateSimilarity(text1, text2) {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
}

// Calculate importance based on frequency and sentiment
function calculateImportance(frequency, sentiment) {
    if (frequency >= 5) return 'High';
    if (frequency >= 3) return 'Medium';
    if (sentiment === 'Negative') return 'Medium';
    return 'Low';
}

// Extract keywords from feedback text
function extractKeywords(text, topic) {
    // Simple keyword extraction based on topic and common words
    const commonKeywords = {
        'healthcare': ['hospital', 'doctor', 'medical', 'health', 'treatment'],
        'education': ['school', 'teacher', 'student', 'learning', 'education'],
        'infrastructure': ['road', 'building', 'construction', 'development', 'project'],
        'agriculture': ['farm', 'farmer', 'crop', 'irrigation', 'agriculture'],
        'defense': ['military', 'security', 'defense', 'soldier', 'army'],
        'social-welfare': ['welfare', 'pension', 'benefit', 'support', 'aid']
    };
    
    const keywords = new Set();
    const words = text.toLowerCase().split(' ');
    
    // Add topic-specific keywords
    if (commonKeywords[topic]) {
        commonKeywords[topic].forEach(keyword => keywords.add(keyword));
    }
    
    // Add common words from the text
    words.forEach(word => {
        if (word.length > 4) { // Only consider words longer than 4 characters
            keywords.add(word);
        }
    });
    
    return Array.from(keywords);
}

// Format topic for display
function formatTopic(topic) {
    return topic.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Show feedback submission confirmation
function showFeedbackConfirmation() {
    const confirmation = document.getElementById('public-feedback-confirmation');
    const form = document.querySelector('.feedback-form');
    
    if (confirmation && form) {
        form.classList.add('hidden');
        confirmation.classList.remove('hidden');
        
        // Hide confirmation after 3 seconds
        setTimeout(() => {
            confirmation.classList.add('hidden');
            form.classList.remove('hidden');
        }, 3000);
    }
}

// Update feedback analysis display
function updateFeedbackAnalysis() {
    updateFeedbackMetrics();
    updateFeedbackTable();
    updateWordCloud();
}

// Update feedback metrics
function updateFeedbackMetrics() {
    // Update total feedback count
    const totalCount = feedbackDatabase.reduce((sum, item) => sum + item.frequency, 0);
    document.getElementById('total-feedback-count').textContent = totalCount;
    document.getElementById('public-total-feedback-count').textContent = totalCount;
    
    // Update overall satisfaction
    if (totalCount > 0) {
        const totalSatisfaction = feedbackDatabase.reduce((sum, item) => sum + item.satisfactionTotal, 0);
        const avgSatisfaction = Math.round((totalSatisfaction / totalCount) * 10);
        document.getElementById('overall-satisfaction').textContent = `${avgSatisfaction}%`;
        document.getElementById('public-overall-satisfaction').textContent = `${avgSatisfaction}%`;
    }
    
    // Update top concern
    const concerns = feedbackDatabase.filter(item => item.sentiment === 'Negative');
    const topConcern = concerns.length > 0 ? concerns[0].topic : 'None';
    document.getElementById('top-concern').textContent = topConcern;
    document.getElementById('public-top-concern').textContent = topConcern;
}

// Update feedback analysis table
function updateFeedbackTable() {
    updateTable('feedback-analysis-body');
    updateTable('public-feedback-analysis-body');
}

function updateTable(tableId) {
    const tableBody = document.getElementById(tableId);
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    feedbackDatabase.forEach(feedback => {
        const row = document.createElement('tr');
        
        // Create cells
        const cells = [
            feedback.topic,
            feedback.text.length > 100 ? feedback.text.substring(0, 100) + '...' : feedback.text,
            feedback.importance,
            feedback.sentiment,
            feedback.frequency
        ];
        
        cells.forEach((content, index) => {
            const cell = document.createElement('td');
            if (index === 2) cell.className = `importance-${feedback.importance.toLowerCase()}`;
            if (index === 3) cell.className = `sentiment-${feedback.sentiment.toLowerCase()}`;
            cell.textContent = content;
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    });
}

// Update word cloud
function updateWordCloud() {
    updateWordCloudContainer('feedback-cloud-container');
    updateWordCloudContainer('public-feedback-cloud-container');
}

function updateWordCloudContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Collect all keywords from feedback
    const allKeywords = feedbackDatabase.reduce((keywords, feedback) => {
        feedback.keywords.forEach(keyword => {
            keywords[keyword] = (keywords[keyword] || 0) + feedback.frequency;
        });
        return keywords;
    }, {});
    
    // Sort keywords by frequency
    const sortedKeywords = Object.entries(allKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20); // Show top 20 keywords
    
    // Clear container
    container.innerHTML = '';
    
    // Add keywords to cloud
    sortedKeywords.forEach(([keyword, frequency]) => {
        const span = document.createElement('span');
        span.className = 'cloud-keyword';
        span.style.fontSize = `${Math.min(24, 12 + frequency)}px`;
        span.textContent = keyword;
        container.appendChild(span);
    });
}

// Function to download dataset
function downloadDataset() {
    // Create the dataset object
    const dataset = {
        metadata: {
            version: "1.0",
            lastUpdated: new Date().toISOString(),
            description: "Budget Allocation System Dataset"
        },
        budgetData: {
            totalBudget: 225000,
            currency: "INR",
            fiscalYear: "2023-24",
            sectorAllocation: {
                healthcare: { amount: 50000, percentage: 22.22 },
                infrastructure: { amount: 45000, percentage: 20.00 },
                education: { amount: 40000, percentage: 17.78 },
                defense: { amount: 35000, percentage: 15.56 },
                agriculture: { amount: 30000, percentage: 13.33 },
                socialWelfare: { amount: 25000, percentage: 11.11 }
            }
        },
        feedbackData: {
            totalFeedback: feedbackDatabase.length,
            overallSatisfaction: calculateOverallSatisfaction(),
            feedbackEntries: feedbackDatabase
        },
        votingData: {
            totalVotes: 0,
            sectorVotes: {
                healthcare: 0,
                education: 0,
                infrastructure: 0,
                agriculture: 0,
                defense: 0,
                socialWelfare: 0
            }
        },
        analysisMetrics: {
            topConcerns: getTopConcerns(),
            commonThemes: getCommonThemes(),
            sentimentDistribution: calculateSentimentDistribution()
        }
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(dataset, null, 2);
    
    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget_allocation_dataset.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Helper function to calculate overall satisfaction
function calculateOverallSatisfaction() {
    if (feedbackDatabase.length === 0) return 0;
    const total = feedbackDatabase.reduce((sum, feedback) => sum + feedback.satisfaction, 0);
    return Math.round((total / feedbackDatabase.length) * 10);
}

// Helper function to get top concerns
function getTopConcerns() {
    return feedbackDatabase
        .filter(feedback => feedback.sentiment === 'Negative')
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map(feedback => ({
            topic: feedback.topic,
            frequency: feedback.frequency,
            text: feedback.text
        }));
}

// Helper function to get common themes
function getCommonThemes() {
    const themes = {};
    feedbackDatabase.forEach(feedback => {
        feedback.keywords.forEach(keyword => {
            themes[keyword] = (themes[keyword] || 0) + 1;
        });
    });
    return Object.entries(themes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }));
}

// Helper function to calculate sentiment distribution
function calculateSentimentDistribution() {
    const distribution = {
        positive: 0,
        neutral: 0,
        negative: 0
    };
    feedbackDatabase.forEach(feedback => {
        distribution[feedback.sentiment.toLowerCase()]++;
    });
    return distribution;
}

// Add download button to the feedback section
function addDownloadButton() {
    const feedbackSection = document.getElementById('public-feedback-results');
    if (feedbackSection) {
        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-dataset-btn';
        downloadButton.innerHTML = '<i class="fas fa-download"></i> Download Dataset';
        downloadButton.onclick = downloadDataset;
        feedbackSection.appendChild(downloadButton);
    }
}

// Initialize the feedback system when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeFeedbackSystem();
    addDownloadButton();
}); 