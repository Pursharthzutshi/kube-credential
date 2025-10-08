import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the page components
jest.mock('../pages/IssuancePage', () => {
  return function MockIssuancePage() {
    return <div data-testid="issuance-page">Issuance Page</div>;
  };
});

jest.mock('../pages/VerificationPage', () => {
  return function MockVerificationPage() {
    return <div data-testid="verification-page">Verification Page</div>;
  };
});

describe('App Component', () => {
  it('should render the app with navigation', () => {
    render(<App />);
    
    expect(screen.getByText('Issue Credential')).toBeInTheDocument();
    expect(screen.getByText('Verify Credential')).toBeInTheDocument();
  });

  it('should show issuance page by default', () => {
    render(<App />);
    
    expect(screen.getByTestId('issuance-page')).toBeInTheDocument();
    expect(screen.queryByTestId('verification-page')).not.toBeInTheDocument();
  });

  it('should switch to verification page when Verify button is clicked', () => {
    render(<App />);
    
    const verifyButton = screen.getByText('Verify Credential');
    fireEvent.click(verifyButton);
    
    expect(screen.getByTestId('verification-page')).toBeInTheDocument();
    expect(screen.queryByTestId('issuance-page')).not.toBeInTheDocument();
  });

  it('should switch to issuance page when Issue button is clicked', () => {
    render(<App />);
    
    // First switch to verification page
    const verifyButton = screen.getByText('Verify Credential');
    fireEvent.click(verifyButton);
    
    expect(screen.getByTestId('verification-page')).toBeInTheDocument();
    
    // Then switch back to issuance page
    const issueButton = screen.getByText('Issue Credential');
    fireEvent.click(issueButton);
    
    expect(screen.getByTestId('issuance-page')).toBeInTheDocument();
    expect(screen.queryByTestId('verification-page')).not.toBeInTheDocument();
  });

  it('should have proper button styling', () => {
    render(<App />);
    
    const issueButton = screen.getByText('Issue Credential');
    const verifyButton = screen.getByText('Verify Credential');
    
    expect(issueButton).toHaveClass('px-6', 'py-3');
    expect(verifyButton).toHaveClass('px-6', 'py-3');
  });

  it('should render navigation with proper styling', () => {
    render(<App />);
    
    const nav = screen.getByText('Issue Credential').closest('nav');
    expect(nav).toHaveClass('px-6', 'py-4');
  });
});
