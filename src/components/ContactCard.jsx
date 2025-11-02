import React from 'react';
import PhoneIcon from '@mui/icons-material/Phone';
import CallIcon from '@mui/icons-material/Call';
import EmailIcon from '@mui/icons-material/Email';

const ContactCard = ({ onClose }) => {
  return (
    <div className="contact-card-overlay" style={overlayStyle}>
      <div className="contact-card" style={cardStyle}>
        <button onClick={onClose} style={closeButtonStyle} aria-label="Close contact card">
          &times;
        </button>
        <h2 style={titleStyle}>Contact Us</h2>
        <div style={itemStyle}>
          <div style={iconCircleStyle}>
            <PhoneIcon style={iconStyle} />
          </div>
          <div>
            <p style={labelStyle}>Helpline No.</p>
            <p style={valueStyle}>+91 9876543210</p>
          </div>
        </div>
        <hr style={dividerStyle} />
        <div style={itemStyle}>
          <div style={iconCircleStyle}>
            <CallIcon style={iconStyle} />
          </div>
          <div>
            <p style={labelStyle}>Superintendent No.</p>
            <p style={valueStyle}>+91 8765432109</p>
          </div>
        </div>
        <hr style={dividerStyle} />
        <div style={itemStyle}>
          <div style={iconCircleStyle}>
            <EmailIcon style={iconStyle} />
          </div>
          <div>
            <p style={labelStyle}>Our Gmail ID</p>
            <p style={valueStyle}>support@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.3)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '24px',
  width: '320px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  position: 'relative',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  color: '#1a3d1a', // dark green text
};

const closeButtonStyle = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  background: 'transparent',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#4a4a4a',
};

const titleStyle = {
  marginBottom: '20px',
  fontWeight: '700',
  fontSize: '1.5rem',
};

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
};

const iconCircleStyle = {
  backgroundColor: '#d9e6d9',
  borderRadius: '50%',
  padding: '10px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '40px',
  height: '40px',
  color: '#2f6f2f',
};

const iconStyle = {
  width: '20px',
  height: '20px',
};

const labelStyle = {
  fontSize: '0.85rem',
  color: '#6b6b6b',
  marginBottom: '4px',
};

const valueStyle = {
  fontWeight: '700',
  fontSize: '1rem',
};

const dividerStyle = {
  border: 'none',
  borderTop: '1px solid #d9d9d9',
  margin: '8px 0',
};

export default ContactCard;
