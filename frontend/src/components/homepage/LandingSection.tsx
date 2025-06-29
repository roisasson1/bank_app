import React from 'react';
import './css/LandingSection.css';

interface LandingSectionProps {
  onGetStartedClick: () => void;
}

const LandingSection: React.FC<LandingSectionProps> = ({ onGetStartedClick }) => {
  const currentYear = new Date().getFullYear();

  return (
    <section className="landing">
      <div className="landing-content-wrapper">
        <div className="landing-text">
          <h1>
            Your Future Secured <br/>with 
            <span> PAY</span>
          </h1>
          <p>
            <b>Welcome to the next generation of banking</b>
            <br/>We empower your financial journey with innovation and peace of mind.
            <br/>Discover a smarter way to manage your money.
          </p>
          <div className="buttons">
            <button className="start-btn" onClick={onGetStartedClick}>Get Started</button>
            <a href="#features" className="services-btn">Explore Our Features</a>
          </div>
        </div>

        <div className="landing-image">
          <div className="image-wrapper">
          </div>
        </div>
      </div>

      <div id="features" className="features-showcase">
        <div className="feature-card">
          <div className="icon-placeholder">🔒</div>
          <h3>Complete Security</h3>
          <p>Your money and data are protected with the highest industry-standard encryption.</p>
        </div>
        <div className="feature-card">
          <div className="icon-placeholder">📈</div>
          <h3>Smart Financial Growth</h3>
          <p>Utilize intelligent tools and personalized insights to achieve your financial goals.</p>
        </div>
        <div className="feature-card">
          <div className="icon-placeholder">💳</div>
          <h3>Fast Transfers</h3>
          <p>Enjoy quick, reliable, and effortless money transfers and payments every time.</p>
        </div>
      </div>

      <div className="copyright">
        <p>&copy; {currentYear} PAY Bank. All rights reserved.</p>
        <div className="legal-links">
          <a href="#">Privacy Policy</a> | 
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </section>
  );
}

export default LandingSection;