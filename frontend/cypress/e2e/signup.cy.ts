describe('SignUp Component', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept('POST', `${import.meta.env.VITE_API_DEV_URL}/api/auth/sign-up`, (req) => {
      const { email, password, phoneNumber, fullName } = req.body;
      if (email === 'newuser@example.com' && password === 'securepass' && phoneNumber === '1234567890' && fullName === 'New User') {
        req.reply({
          statusCode: 200,
          body: {
            message: 'Sign up successful! Please verify your phone.',
            accessToken: 'mock_signup_access_token',
            id: 'mockUserId123',
          },
        });
      } else if (email === 'existing@example.com') {
        req.reply({
          statusCode: 409,
          body: { error: 'Email already registered.' },
        });
      } else {
        req.reply({
          statusCode: 400,
          body: { error: 'Sign up failed due to invalid data.' },
        });
      }
    }).as('signUpApiCall');

    cy.visit('/');
    cy.contains('Sign Up').click();
    cy.get('.modal-content').should('be.visible');
  });

  it('should display validation error for short password', () => {
    cy.get('#name').type('Test Name');
    cy.get('#email').type('test@example.com');
    cy.get('#phone').type('1234567890');
    cy.get('#password').type('123');
    cy.get('.modal-content button[type="submit"]').click();
    cy.wait(50);
    cy.get('.error-message').should('exist').and('contain', 'Password must be at least 4 characters');
  });

  it('should display validation error for invalid phone number length', () => {
    cy.get('#name').type('Test Name');
    cy.get('#email').type('test@example.com');
    cy.get('#phone').type('123');
    cy.get('#password').type('password123');
    cy.get('.modal-content button[type="submit"]').click();
    cy.wait(50);
    cy.get('.error-message').should('exist').and('contain', 'Phone number must have 7-10 digits');

    cy.get('#phone').clear().type('12345678901');
    cy.get('.modal-content button[type="submit"]').click();
    cy.wait(50);
    cy.get('.error-message').should('exist').and('contain', 'Phone number must have 7-10 digits');
  });

  it('should successfully sign up with valid credentials and call onSignUpSuccess', () => {
    cy.get('#name').type('New User');
    cy.get('#email').type('newuser@example.com');
    cy.get('#phone').type('1234567890');
    cy.get('#password').type('securepass');
    cy.get('.modal-content button[type="submit"]').click();

    cy.wait('@signUpApiCall').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      cy.window().its('localStorage').invoke('getItem', 'accessToken').should('eq', 'mock_signup_access_token');
      cy.window().its('localStorage').invoke('getItem', 'userEmail').should('eq', 'newuser@example.com');
      cy.window().its('localStorage').invoke('getItem', 'fullName').should('eq', 'New User');
    });
  });

  it('should display an error message for an existing email', () => {
    cy.get('#name').type('Existing User');
    cy.get('#email').type('existing@example.com');
    cy.get('#phone').type('9876543210');
    cy.get('#password').type('anotherpass');
    cy.get('.modal-content button[type="submit"]').click();

    cy.wait('@signUpApiCall').then((interception) => {
      expect(interception.response?.statusCode).to.eq(409);
      cy.wait(50);
      cy.get('.error-message').should('exist').and('contain', 'Email already registered.');
      void expect(localStorage.getItem('accessToken')).to.be.null;
      void expect(localStorage.getItem('userEmail')).to.be.null;
      void expect(localStorage.getItem('fullName')).to.be.null;
    });
  });

  it('should display a network error message if API fails', () => {
    cy.intercept('POST', `${import.meta.env.VITE_API_DEV_URL}/api/auth/sign-up`, {
      forceNetworkError: true,
    }).as('networkErrorSignUp');

    cy.get('#name').type('Network Error User');
    cy.get('#email').type('network@example.com');
    cy.get('#phone').type('1112223333');
    cy.get('#password').type('networkpass');
    cy.get('.modal-content button[type="submit"]').click();

    cy.wait('@networkErrorSignUp');
    cy.wait(50);
    cy.get('.error-message').should('exist').and('contain', 'Could not connect to the server. Please try again later.');
  });

  it('should close the sign-up modal when close button is clicked', () => {
    cy.get('.modal-content .close-btn').click();
    cy.get('.modal-content').should('not.exist');
  });
});
