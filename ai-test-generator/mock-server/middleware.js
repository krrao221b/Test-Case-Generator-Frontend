module.exports = (req, res, next) => {
  // Enable CORS for all routes
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Add request logging
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

  // Handle Jira ticket lookup by key (e.g., /api/v1/integrations/jira/PROJ-123)
  if (
    req.method === "GET" &&
    req.path.match(/^\/api\/v1\/integrations\/jira\/[A-Z]+-\d+$/)
  ) {
    const pathParts = req.path.split("/");
    const ticketKey = pathParts[pathParts.length - 1];

    console.log(`Middleware: Looking for Jira ticket: ${ticketKey}`);

    const fs = require("fs");
    const path = require("path");

    try {
      const dbPath = path.join(__dirname, "db.json");
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      const tickets = db["jira-tickets"] || [];
      const ticket = tickets.find((t) => t.key === ticketKey);

      console.log(
        `Middleware: Available tickets:`,
        tickets.map((t) => t.key)
      );
      console.log(
        `Middleware: Found ticket:`,
        ticket ? ticket.key : "Not found"
      );

      if (ticket) {
        res.setHeader("Content-Type", "application/json");
        res.status(200).json(ticket);
        return;
      } else {
        res.status(404).json({ error: `Jira ticket ${ticketKey} not found` });
        return;
      }
    } catch (error) {
      console.error("Error reading database:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  // Handle Jira projects list
  if (
    req.method === "GET" &&
    req.path === "/api/v1/integrations/jira/projects"
  ) {
    console.log("Middleware: Fetching Jira projects");
    const fs = require("fs");
    const path = require("path");

    try {
      const dbPath = path.join(__dirname, "db.json");
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

      res.setHeader("Content-Type", "application/json");
      res.status(200).json(db["jira-projects"] || []);
      return;
    } catch (error) {
      console.error("Error reading database:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  // Handle Jira ticket lookup by key (e.g., PROJ-123) FIRST
  if (
    req.method === "GET" &&
    req.path.match(/^\/api\/v1\/integrations\/jira\/([A-Z]+-\d+)$/)
  ) {
    const ticketKey = req.path.match(/\/([A-Z]+-\d+)$/)[1];
    console.log(`Middleware: Looking up Jira ticket: ${ticketKey}`);

    const fs = require("fs");
    const path = require("path");

    try {
      const dbPath = path.join(__dirname, "db.json");
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

      const ticket = db["jira-tickets"].find((t) => t.key === ticketKey);

      if (ticket) {
        console.log(`Middleware: Found Jira ticket: ${ticket.summary}`);
        res.status(200).json(ticket);
        return;
      } else {
        console.log(`Middleware: Jira ticket ${ticketKey} not found`);
        res.status(404).json({ error: `Ticket ${ticketKey} not found` });
        return;
      }
    } catch (error) {
      console.error("Error reading Jira ticket:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  // Handle Jira projects list
  if (
    req.method === "GET" &&
    req.path === "/api/v1/integrations/jira/projects"
  ) {
    console.log("Middleware: Fetching Jira projects");
    const fs = require("fs");
    const path = require("path");

    try {
      const dbPath = path.join(__dirname, "db.json");
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

      res.status(200).json(db["jira-projects"] || []);
      return;
    } catch (error) {
      console.error("Error reading Jira projects:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  // Handle individual test case operations FIRST (GET, PUT, DELETE)
  if (req.path.match(/\/test-cases\/\d+\/?$/)) {
    const pathParts = req.path.split("/");
    const testCaseId = parseInt(
      pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2]
    );
    const fs = require("fs");
    const path = require("path");

    console.log(
      `Middleware: Handling ${req.method} for test case ID: ${testCaseId}`
    );
    console.log(`Middleware: Request path: ${req.path}`);
    console.log(`Middleware: Request body:`, req.body);

    try {
      const dbPath = path.join(__dirname, "db.json");
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

      if (req.method === "GET") {
        console.log(`Middleware: GET request for test case ${testCaseId}`);
        const testCase = db["test-cases"].find((tc) => tc.id === testCaseId);
        if (testCase) {
          console.log(`Middleware: Found test case, returning data`);
          res.json(testCase);
          return;
        } else {
          console.log(`Middleware: Test case ${testCaseId} not found`);
          res.status(404).json({ error: "Test case not found" });
          return;
        }
      }

      if (req.method === "PUT") {
        console.log(`Middleware: PUT request for test case ${testCaseId}`);
        const testCaseIndex = db["test-cases"].findIndex(
          (tc) => tc.id === testCaseId
        );
        if (testCaseIndex !== -1) {
          console.log(
            `Middleware: Found test case at index ${testCaseIndex}, updating...`
          );
          db["test-cases"][testCaseIndex] = {
            ...db["test-cases"][testCaseIndex],
            ...req.body,
            updated_at: new Date().toISOString(),
          };

          const updatedTestCase = db["test-cases"][testCaseIndex];
          console.log(
            `Middleware: Updated test case, sending response:`,
            updatedTestCase
          );

          // Send response BEFORE writing to file to avoid reload interruption
          res.setHeader("Content-Type", "application/json");
          res.status(200);
          res.json(updatedTestCase);

          // Write to file after response is sent (with delay to ensure response completes)
          setTimeout(() => {
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            console.log(`Middleware: File saved after response sent`);
          }, 100);

          return;
        } else {
          console.log(
            `Middleware: Test case ${testCaseId} not found for update`
          );
          res.status(404).json({ error: "Test case not found" });
          return;
        }
      }

      if (req.method === "DELETE") {
        console.log(`Middleware: DELETE request for test case ${testCaseId}`);
        const testCaseIndex = db["test-cases"].findIndex(
          (tc) => tc.id === testCaseId
        );
        if (testCaseIndex !== -1) {
          console.log(
            `Middleware: Found test case at index ${testCaseIndex}, deleting...`
          );
          // Remove from in-memory copy
          db["test-cases"].splice(testCaseIndex, 1);

          console.log(`Middleware: Deleted test case, sending 204 response`);

          // Send response BEFORE writing to file to avoid reload interruption
          res.status(204).end();

          // Write to file after response is sent
          setTimeout(() => {
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            console.log(`Middleware: File saved after DELETE response sent`);
          }, 100);

          return;
        } else {
          console.log(
            `Middleware: Test case ${testCaseId} not found for deletion`
          );
          res.status(404).json({ error: "Test case not found" });
          return;
        }
      }
    } catch (error) {
      console.error("Error handling test case operation:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  // Handle test case generation requests (FastAPI style)
  if (
    req.method === "POST" &&
    (req.path.includes("/test-cases/generate") ||
      req.path.includes("/generate"))
  ) {
    console.log("Middleware: Handling test case generation request");
    console.log("Request body:", req.body);

    // Mock AI-generated test cases based on the request
    const generatedTestCase = {
      id: Date.now(),
      title: req.body.title || req.body.name || "Generated Test Case",
      description:
        req.body.description ||
        "AI-generated test case based on provided criteria",
      feature_description:
        req.body.feature_description || "Feature generated from user input",
      acceptance_criteria:
        req.body.acceptance_criteria ||
        req.body.acceptanceCriteria ||
        "Acceptance criteria derived from input",
      priority: (req.body.priority || "medium").toLowerCase(),
      status: "draft",
      tags: req.body.tags || ["ai-generated", "automated"],
      preconditions:
        req.body.preconditions ||
        "System is accessible and user has necessary permissions",
      test_steps: req.body.test_steps || [
        {
          step_number: 1,
          action: "Navigate to the application or feature under test",
          test_data: "Valid URL or navigation path",
          expected_result:
            "Application loads successfully and displays the expected interface",
        },
        {
          step_number: 2,
          action: "Perform the primary action described in acceptance criteria",
          test_data: req.body.acceptance_criteria
            ? req.body.acceptance_criteria.substring(0, 50) + "..."
            : "Test data based on requirements",
          expected_result:
            "System responds according to the specified acceptance criteria",
        },
        {
          step_number: 3,
          action: "Verify the expected outcome",
          test_data: "Expected results validation data",
          expected_result:
            "All acceptance criteria are met and system behaves as expected",
        },
      ],
      expected_result:
        req.body.expected_result || "System behaves according to requirements",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      jira_issue_key: req.body.jira_issue_key || req.body.jiraTicketId || null,
      zephyr_test_id: null,
    };

    // Mock similar test cases
    const similarTestCases = [
      {
        id: 1,
        similarity_score: 0.85,
        test_case: {
          id: 1,
          title: "User Login Authentication Test",
          description:
            "Verify that users can successfully log in with valid credentials",
        },
      },
      {
        id: 2,
        similarity_score: 0.75,
        test_case: {
          id: 2,
          title: "Product Search Functionality Test",
          description:
            "Test the product search feature with various search terms and filters",
        },
      },
    ];

    // Mock response structure (FastAPI style)
    const response = {
      test_case: generatedTestCase,
      similar_cases: similarTestCases,
      message: "Test case generated successfully",
    };

    res.json(response);
    return;
  }

  // Handle similar test cases search
  if (req.method === "POST" && req.path.includes("/find-similar")) {
    console.log("Middleware: Handling find similar test cases request");

    const similarTestCases = [
      {
        id: 1,
        similarity_score: 0.92,
        test_case: {
          id: 1,
          title: "User Login Authentication Test",
          description:
            "Verify that users can successfully log in with valid credentials",
          priority: "high",
          status: "active",
        },
      },
      {
        id: 2,
        similarity_score: 0.78,
        test_case: {
          id: 2,
          title: "Product Search Functionality Test",
          description:
            "Test the product search feature with various search terms and filters",
          priority: "medium",
          status: "draft",
        },
      },
    ];

    res.json(similarTestCases);
    return;
  }

  // Handle test case search with query parameters
  if (
    req.method === "GET" &&
    req.path.includes("/test-cases") &&
    (req.query.search ||
      req.query.tags ||
      req.query.priority ||
      req.query.status)
  ) {
    console.log("Middleware: Handling test case search request");
    console.log("Query params:", req.query);

    // For mock purposes, return filtered results from db.json
    const fs = require("fs");
    const path = require("path");

    try {
      const dbPath = path.join(__dirname, "db.json");
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      let testCases = db["test-cases"] || [];

      // Apply filters
      if (req.query.search) {
        const searchTerm = req.query.search.toLowerCase();
        testCases = testCases.filter(
          (tc) =>
            tc.title.toLowerCase().includes(searchTerm) ||
            tc.description.toLowerCase().includes(searchTerm)
        );
      }

      if (req.query.priority) {
        testCases = testCases.filter(
          (tc) => tc.priority === req.query.priority
        );
      }

      if (req.query.status) {
        testCases = testCases.filter((tc) => tc.status === req.query.status);
      }

      if (req.query.tags) {
        const tags = Array.isArray(req.query.tags)
          ? req.query.tags
          : [req.query.tags];
        testCases = testCases.filter((tc) =>
          tags.some((tag) => tc.tags && tc.tags.includes(tag))
        );
      }

      res.json(testCases);
      return;
    } catch (error) {
      console.error("Error reading database:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  // Handle Jira ticket lookup by key (e.g., PROJ-123)
  if (
    req.method === "GET" &&
    req.path.includes("/jira") &&
    req.path.includes("/tickets/")
  ) {
    const pathParts = req.path.split("/");
    const ticketKey = pathParts[pathParts.length - 1].split("?")[0]; // Extract PROJ-123 and remove query params

    console.log(`Middleware: Looking for Jira ticket: ${ticketKey}`);

    // If it looks like a Jira key (letters-numbers), find by key instead of ID
    if (ticketKey && /^[A-Z]+-\d+$/.test(ticketKey)) {
      const fs = require("fs");
      const path = require("path");

      try {
        const dbPath = path.join(__dirname, "db.json");
        const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        const ticket = db["jira-tickets"]
          ? db["jira-tickets"].find((t) => t.key === ticketKey)
          : null;

        console.log(
          `Middleware: Found ticket:`,
          ticket ? ticket.key : "Not found"
        );

        if (ticket) {
          res.json(ticket);
          return;
        } else {
          res.status(404).json({ error: `Jira ticket ${ticketKey} not found` });
          return;
        }
      } catch (error) {
        console.error("Error reading database:", error);
        res.status(500).json({ error: "Internal server error" });
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
