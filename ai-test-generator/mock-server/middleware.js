module.exports = (req, res, next) => {
  // Enable CORS for all routes
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Add request logging
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

  // Handle test case generation requests
  if (req.method === 'POST' && req.path.includes('/generate')) {
    console.log('Middleware: Handling test case generation request');
    console.log('Request body:', req.body);
    
    // Mock AI-generated test cases based on the request
    const generatedTestCases = [
      {
        id: `tc-generated-${Date.now()}`,
        name: req.body.title || 'Generated Test Case',
        description: req.body.description || 'AI-generated test case based on provided criteria',
        priority: 'Medium',
        preconditions: 'System is accessible and user has necessary permissions',
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to the application or feature under test',
            testData: 'Valid URL or navigation path',
            expectedResult: 'Application loads successfully and displays the expected interface'
          },
          {
            stepNumber: 2,
            action: 'Perform the primary action described in acceptance criteria',
            testData: req.body.acceptanceCriteria ? req.body.acceptanceCriteria.substring(0, 50) + '...' : 'Test data based on requirements',
            expectedResult: 'System responds according to the specified acceptance criteria'
          },
          {
            stepNumber: 3,
            action: 'Verify the expected outcome',
            testData: 'Expected results validation data',
            expectedResult: 'All acceptance criteria are met and system behaves as expected'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labels: ['ai-generated', 'automated', req.body.inputType || 'manual'],
        jiraTicketId: req.body.jiraTicketId || null
      }
    ];

    // Mock response structure
    const response = {
      success: true,
      data: {
        testCases: generatedTestCases,
        similarTestCases: [
          {
            id: 'tc-002',
            name: 'Product Search Functionality Test',
            description: 'Test the product search feature with various search terms and filters',
            priority: 'Medium'
          }
        ]
      },
      message: 'Test cases generated successfully'
    };

    res.json(response);
    return;
  }

  // Handle Jira ticket lookup by key (e.g., PROJ-123)
  if (req.method === 'GET' && req.path.includes('/jira/ticket/')) {
    const pathParts = req.path.split('/');
    const ticketKey = pathParts[pathParts.length - 1].split('?')[0]; // Extract PROJ-123 and remove query params
    
    console.log(`Middleware: Looking for Jira ticket: ${ticketKey}`);
    
    // If it looks like a Jira key (letters-numbers), find by key instead of ID
    if (ticketKey && /^[A-Z]+-\d+$/.test(ticketKey)) {
      const fs = require('fs');
      const path = require('path');
      
      try {
        const dbPath = path.join(__dirname, 'db.json');
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const ticket = db.jiraTickets.find(t => t.key === ticketKey);
        
        console.log(`Middleware: Found ticket:`, ticket ? ticket.key : 'Not found');
        
        if (ticket) {
          res.json(ticket);
          return;
        } else {
          res.status(404).json({ error: `Jira ticket ${ticketKey} not found` });
          return;
        }
      } catch (error) {
        console.error('Error reading database:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
    }
  }

  // Simulate API delays for realistic testing
  const delay = Math.random() * 500 + 200; // 200-700ms delay
  setTimeout(() => {
    next();
  }, delay);
};
