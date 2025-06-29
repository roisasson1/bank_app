describe('Login Component', () => {
  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept('POST', 'http://localhost:3000/api/auth/login', (req) => {
      const { email, password } = req.body;
      if (email === 'test@example.com' && password === 'password123') {
        req.reply({
          statusCode: 200,
          body: {
            message: 'Login successful',
            accessToken: 'mock_access_token',
            fullName: 'Test User',
          },
        });
      } else if (email === 'error@example.com') {
        req.reply({
          statusCode: 401,
          body: { error: 'Invalid credentials' },
        });
      } else {
        req.reply({
          statusCode: 401,
          body: { error: 'Login failed. Please check your email and password.' },
        });
      }
    }).as('loginApiCall');

    cy.intercept('GET', 'http://localhost:3000/api/balance**', {
      statusCode: 200,
      body: { balance: 1234.56, currency: 'USD' },
    }).as('getBalanceApiCall');

    cy.intercept('GET', 'http://localhost:3000/api/transactions**', {
      statusCode: 200,
      body: {
        transactions: [
          { id: '1', description: 'Grocery', amount: -50, date: '2024-06-20' },
          { id: '2', description: 'Salary', amount: 2000, date: '2024-06-15' },
        ],
      },
    }).as('getTransactionsApiCall');

    cy.visit('/');

    cy.contains('Log In').click();
    cy.get('.modal-content').should('be.visible');
  });

  it('should display validation error for short password', () => {
    cy.get('#loginEmail').type('test@example.com');
    cy.get('#loginPassword').type('123');
    cy.get('.modal-content button[type="submit"]').contains('Log In').click();
    cy.wait(50);
    cy.get('.error-message').should('exist').and('contain', 'Password must be at least 4 characters');
  });

  it('should successfully log in with valid credentials and navigate to dashboard', () => {
    cy.get('#loginEmail').type('test@example.com');
    cy.get('#loginPassword').type('password123');
    cy.get('.modal-content button[type="submit"]').contains('Log In').click();

    cy.wait('@loginApiCall').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);

      cy.window().its('localStorage').invoke('getItem', 'accessToken').should('eq', 'mock_access_token');
      cy.window().its('localStorage').invoke('getItem', 'userEmail').should('eq', 'test@example.com');
      cy.window().its('localStorage').invoke('getItem', 'fullName').should('eq', 'Test User');
      
      cy.get('.modal-content').should('not.exist');
    });

    cy.url().should('include', '/dashboard');
  });

  it('should display an error message for invalid login credentials', () => {
    cy.get('#loginEmail').type('wrong@example.com');
    cy.get('#loginPassword').type('wrongpassword');
    cy.get('.modal-content button[type="submit"]').contains('Log In').click();

    cy.wait('@loginApiCall').then((interception) => {
      expect(interception.response?.statusCode).to.eq(401);
      cy.wait(50);
      cy.get('.error-message').should('exist').and('contain', 'Login failed. Please check your email and password.');
      cy.window().its('localStorage').invoke('getItem', 'accessToken').should('be.null');
      cy.window().its('localStorage').invoke('getItem', 'userEmail').should('be.null');
      cy.window().its('localStorage').invoke('getItem', 'fullName').should('be.null');
    });
  });

  it('should display a network error message if API fails', () => {
    cy.intercept('POST', 'http://localhost:3000/api/auth/login', {
      forceNetworkError: true,
    }).as('networkErrorLogin');

    cy.get('#loginEmail').type('test@example.com');
    cy.get('#loginPassword').type('password123');
    cy.get('.modal-content button[type="submit"]').contains('Log In').click();

    cy.wait('@networkErrorLogin');
    cy.wait(50);
    cy.get('.error-message').should('exist').and('contain', 'Could not connect to the server. Please try again later.');
  });

  it('should switch to the Sign Up form when "Sign Up" link is clicked', () => {
    cy.get('.switch-link').contains('Sign Up').click();
    cy.get('.modal-content h2').should('contain', 'Sign Up');
  });

  it('should close the login modal when close button is clicked', () => {
    cy.get('.modal-content .close-btn').click();
    cy.get('.modal-content').should('not.exist');
  });
});