const mockUserId = 'testUser123';
const mockPhoneNumber = '1234567890';
const mockInitialFullName = 'Test User';
const mockUserEmail = 'test@example.com';

describe('PhoneValidation Component', () => {
  Cypress.on('uncaught:exception', (err) => {
    console.error('Uncaught exception from app:', err.message);
    return false;
  });

  beforeEach(() => {
    cy.clearLocalStorage();

    cy.intercept('POST', 'http://localhost:3000/api/auth/sign-up/validate', (req) => {
      const { userId, code } = req.body;
      if (userId === mockUserId && code === '123456') {
        req.reply({
          statusCode: 200,
          body: {
            message: 'Phone number verified successfully!',
            email: mockUserEmail,
            fullName: mockInitialFullName,
          },
        });
      } else if (userId === mockUserId && code === '000000') {
        req.reply({
          statusCode: 400,
          body: { error: 'Invalid passcode.' },
        });
      } else {
        req.reply({
          statusCode: 400,
          body: { error: 'Verification failed.' },
        });
      }
    }).as('validateApiCall');

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
    cy.contains('Sign Up').click();
    cy.get('#name').type(mockInitialFullName);
    cy.get('#email').type(mockUserEmail);
    cy.get('#phone').type(mockPhoneNumber);
    cy.get('#password').type('securepass');
    cy.intercept('POST', 'http://localhost:3000/api/auth/sign-up', {
        statusCode: 200,
        body: {
            message: 'Sign up successful! Please verify your phone.',
            accessToken: 'mock_signup_access_token',
            id: mockUserId,
        },
    }).as('mockSignUpSuccess'); 

    cy.get('.modal-content button[type="submit"]').click();
    cy.wait('@mockSignUpSuccess');

    cy.get('.modal-content h2').should('contain', 'Verify Phone Number');
  });

  it('should display the last four digits of the phone number', () => {
    cy.get('.modal-content p').should('contain', `ending in **${mockPhoneNumber.slice(-4)}.`);
  });

  it('should successfully validate phone number with correct passcode and set localStorage', () => {
    cy.get('#passcode').type('123456');
    cy.get('.modal-content button[type="submit"]').click();

    cy.wait('@validateApiCall').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      cy.window().its('localStorage').invoke('getItem', 'fullName').should('eq', mockInitialFullName);
      cy.window().its('localStorage').invoke('getItem', 'userEmail').should('eq', mockUserEmail);
    });
    
    cy.get('.modal-content').should('not.exist');
    cy.url().should('include', '/dashboard');
  });

  it('should display an error message for incorrect passcode', () => {
    cy.get('#passcode').type('000000');
    cy.get('.modal-content button[type="submit"]').click();

    cy.wait('@validateApiCall').then((interception) => {
      expect(interception.response?.statusCode).to.eq(400);
      cy.wait(50);
      cy.get('.error-message').should('exist').and('contain', 'Invalid passcode.');
      cy.window().its('localStorage').invoke('getItem', 'fullName').should('eq', mockInitialFullName); 
    });
  });

  it('should display a network error message if API fails', () => {
    cy.intercept('POST', 'http://localhost:3000/api/auth/sign-up/validate', {
      forceNetworkError: true,
    }).as('networkErrorValidation');

    cy.get('#passcode').type('123456');
    cy.get('.modal-content button[type="submit"]').click();

    cy.wait('@networkErrorValidation');
    cy.wait(50);
    cy.get('.error-message').should('exist').and('contain', 'Could not connect to the server. Please try again later.');
  });

  it('should close the phone validation modal when the close button is clicked', () => {
    cy.get('.modal-content .close-btn').click();
  });

  it('should close the phone validation modal when modal overlay is clicked', () => {
    cy.get('.modal-overlay').click({ force: true });
  });
});