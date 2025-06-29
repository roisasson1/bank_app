import React from 'react';
import './css/JitsiMeeting.css';

interface JitsiMeetingModalProps {
  roomName: string;
  userInfo: {
    displayName: string;
    email?: string;
  };
  onClose: () => void;
}

const JitsiMeetingModal: React.FC<JitsiMeetingModalProps> = ({ roomName, userInfo, onClose }) => {
  const jitsiDomain = 'meet.jit.si';
  const iframeSrc = `https://${jitsiDomain}/${roomName}#userInfo.displayName=${encodeURIComponent(userInfo.displayName)}`;

  return (
    <div className="jitsi-modal-overlay" onClick={onClose}>
      <div className="jitsi-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="jitsi-close-btn" onClick={onClose}>&times;</button>
        <h2>Video Meeting</h2>
        <div className="jitsi-iframe-container">
          <iframe
            allow="camera; microphone; fullscreen; display-capture"
            src={iframeSrc}
            style={{ height: '100%', width: '100%', border: '0' }}
            title={`Jitsi Meeting - ${roomName}`}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default JitsiMeetingModal;