declare global {
  interface Window {
    onLoginSuccess: (email: string, fullName: string) => void;
    onSignUpSuccess: (userId: string, phoneNumber: string, email: string, fullName: string) => void;
    onValidationComplete: (email: string, fullName: string) => void;
    onGoBackToSignUp: () => void;
  }
}

export {};