import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import axios from 'axios';

const AdminIDCard = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [photo, setPhoto] = useState('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80');
  const [idCards, setIdCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const frontRef = useRef(null);
  const backRef = useRef(null);
  const modalFrontRef = useRef(null);
  const modalBackRef = useRef(null);

  useEffect(() => {
    fetchIDCards();
  }, []);

  const fetchIDCards = async () => {
    try {
      const res = await axios.get('/api/auth/admin/id-cards');
      setIdCards(res.data.idCards);
    } catch (err) {
      console.error('Error fetching ID cards:', err);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name || !role || !idNumber) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/admin/id-cards', {
        name,
        role,
        idNumber,
        photo
      });
      alert('ID Card saved successfully');
      fetchIDCards();
      // Clear fields
      setName('');
      setRole('');
      setIdNumber('');
    } catch (err) {
      console.error('Error saving ID card:', err);
      alert('Failed to save ID card');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ID card?')) return;
    try {
      await axios.delete(`/api/auth/admin/id-cards/${id}`);
      fetchIDCards();
    } catch (err) {
      console.error('Error deleting ID card:', err);
    }
  };

  const downloadCard = async (side, ref) => {
    const element = ref ? ref.current : (side === 'front' ? frontRef.current : backRef.current);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `askc-id-card-${side}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating card image:', err);
    }
  };

  const handleShare = async () => {
    if (!modalFrontRef.current) return;
    try {
      const canvas = await html2canvas(modalFrontRef.current, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'id-card.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'ASKC Digital Web ID Card',
          text: `ID Card for ${selectedCard.name}`
        });
      } else {
        alert('Sharing not supported on this browser. You can download the card instead.');
      }
    } catch (err) {
      console.error('Error sharing card:', err);
    }
  };

  const openViewModal = (card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const closeViewModal = () => {
    setSelectedCard(null);
    setShowModal(false);
  };

  const CardFront = ({ cardData, reference }) => (
    <div className="id-card-wrapper" ref={reference}>
      <div className="front-bg-pattern"></div>
      <div className="front-bottom-bg"></div>
      <div className="front-wave-1"></div>
      <div className="front-wave-2"></div>
      
      <div className="id-front front-content">
        <div className="lanyard-hole"></div>
        
        <div className="logo-container">
          <img src="/askclogonew.jpeg" alt="ASKC Digital Web" />
        </div>
        
        <div className="photo-container">
          <img src={cardData.photo || photo} alt="Profile Photo" />
        </div>
        
        <div className="details">
          <h2 className="employee-name">{cardData.name || "Rohit Sharma"}</h2>
          <div className="employee-title">{cardData.role || "Web Developer"}</div>
          <div className="divider"></div>
          <p className="id-label">ID No.</p>
          <div className="id-number-badge">{cardData.idNumber || "ASKC2025001"}</div>
          
          <div className="signature-container">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f6/Signature_of_John_Hancock.svg" className="signature" alt="Signature" />
            <div className="signatory">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );

  const CardBack = ({ reference }) => (
    <div className="id-card-wrapper" ref={reference}>
      <div className="id-back">
        <div className="back-wave-top"></div>
        <div className="back-wave-top-inner"></div>
        <div className="back-wave-bottom"></div>
        <div className="back-wave-bottom-inner"></div>
        <div className="world-map"></div>
        
        <div className="back-content">
          <div className="back-lanyard-hole"></div>
          
          <div className="back-logo">
            <img src="/askclogonew.jpeg" alt="ASKC Digital Web" />
          </div>
          
          <div className="dashed-divider"></div>
          
          <div className="section-title">ABOUT US</div>
          <p className="about-text">
            ASKC Digital Web is a creative digital solutions company providing innovative website development, design and digital marketing services to help businesses grow online.
          </p>
          
          <div className="section-title">CONTACT US</div>
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </div>
              <div>123, 2nd Floor, Tech Park,<br/>Bhopal, Madhya Pradesh, 462023</div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </div>
              <div>+91 62626 92632</div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </div>
              <div>support@askcweb.in</div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>
              </div>
              <div>www.askcweb.in</div>
            </div>
          </div>
          
          <div className="dashed-divider"></div>
          
          <div className="qr-container">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.askcweb.in" alt="QR Code" />
          </div>
          
          <div className="social-section">
            <div className="social-title">Follow Us</div>
            <div className="social-icons">
              <div className="icon">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99h-2.54V12h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12c0-5.52-4.48-10-10-10z"/></svg>
              </div>
              <div className="icon">
                <svg viewBox="0 0 24 24"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25zM12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
              </div>
              <div className="icon">
                <svg viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="id-card-generator p-6 w-full max-w-7xl mx-auto">
      <style>{`
        .id-card-generator {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Inter', sans-serif;
          color: white;
          box-sizing: border-box;
        }

        .generator-title {
          margin-bottom: 30px;
          text-align: center;
          font-size: 28px;
        }

        .generator-layout {
          display: flex;
          gap: 50px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
          margin-bottom: 50px;
        }

        .form-container {
          background: #1e293b;
          padding: 25px;
          border-radius: 12px;
          width: 320px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }

        .form-container label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          color: #94a3b8;
        }

        .form-container input {
          width: 100%;
          padding: 12px;
          margin-bottom: 15px;
          border-radius: 6px;
          border: 1px solid #334155;
          background: #0f172a;
          color: white;
          outline: none;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }

        .form-container input:focus {
          border-color: #0055ff;
        }

        .download-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .btn-download {
          width: 100%;
          padding: 12px;
          background: #10b981;
          border: none;
          color: white;
          font-weight: bold;
          cursor: pointer;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          transition: background 0.2s;
        }

        .btn-download:hover {
          background: #059669;
        }

        .btn-save {
          width: 100%;
          padding: 12px;
          background: #3b82f6;
          border: none;
          color: white;
          font-weight: bold;
          cursor: pointer;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          transition: background 0.2s;
          margin-top: 5px;
        }

        .btn-save:hover {
          background: #2563eb;
        }

        .btn-save:disabled {
          background: #64748b;
          cursor: not-allowed;
        }

        .cards-preview {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* CARD DESIGN STYLES */
        .id-card-wrapper {
          width: 340px;
          height: 530px;
          border-radius: 15px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
          position: relative;
          overflow: hidden;
          background-color: #f8f9fa;
          flex-shrink: 0;
          color: #1e293b;
        }

        /* FRONT DESIGN */
        .id-front {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .front-bg-pattern {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 300px;
          background-image: radial-gradient(#d1d5db 1px, transparent 1px);
          background-size: 15px 15px;
          opacity: 0.6;
          z-index: 1;
        }

        .front-bottom-bg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 290px;
          background-color: #0d1b2a;
          z-index: 1;
        }
        
        .front-wave-1 {
          position: absolute;
          bottom: 240px;
          left: -30%;
          width: 160%;
          height: 300px;
          background-color: #0055ff;
          border-radius: 50%;
          transform: rotate(-8deg);
          z-index: 1;
        }
        
        .front-wave-2 {
          position: absolute;
          bottom: 190px;
          left: -30%;
          width: 160%;
          height: 300px;
          background-color: #0d1b2a;
          border-radius: 50%;
          transform: rotate(2deg);
          z-index: 2;
        }

        .front-content {
          position: relative;
          z-index: 10;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .lanyard-hole {
          width: 50px;
          height: 8px;
          background-color: #0d1b2a;
          border-radius: 10px;
          margin-top: 15px;
          opacity: 0.15;
        }

        .logo-container {
          margin-top: 20px;
          text-align: center;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-container img {
          max-width: 140px;
          max-height: 70px;
          object-fit: contain;
          mix-blend-mode: multiply;
        }

        .photo-container {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 4px solid #0055ff;
          margin-top: 20px;
          overflow: hidden;
          background-color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .photo-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .details {
          margin-top: 25px;
          text-align: center;
          color: white;
          width: 100%;
        }
        .employee-name {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: #ffffff;
          letter-spacing: 0.5px;
        }
        .employee-title {
          font-size: 14px;
          color: #3b82f6;
          margin: 5px 0 15px 0;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .divider {
          width: 60%;
          height: 1px;
          background-color: rgba(255,255,255,0.15);
          margin: 0 auto 12px auto;
        }
        .id-label {
          font-size: 11px;
          color: #ffffff;
          margin: 0 0 5px 0;
          font-weight: 600;
        }
        .id-number-badge {
          background-color: #0055ff;
          color: white;
          padding: 6px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          display: inline-block;
          margin-bottom: 15px;
          letter-spacing: 1px;
        }

        .signature-container {
          text-align: center;
          margin-top: 5px;
        }
        .signature {
          width: 80px;
          height: auto;
          filter: invert(1);
          opacity: 0.8;
        }
        .signatory {
          font-size: 9px;
          color: #b0b5be;
          margin-top: 2px;
        }

        /* BACK DESIGN */
        .id-back {
          background-color: #0d1b2a;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          color: white;
          position: relative;
        }

        .back-wave-top {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 180px;
          height: 180px;
          background-color: #0055ff;
          border-radius: 50%;
          z-index: 1;
        }
        .back-wave-top-inner {
          position: absolute;
          top: -20px;
          right: -10px;
          width: 160px;
          height: 160px;
          background-color: #0d1b2a;
          border-radius: 50%;
          z-index: 2;
        }
        
        .back-wave-bottom {
          position: absolute;
          bottom: -40px;
          left: -40px;
          width: 140px;
          height: 140px;
          background-color: #0055ff;
          border-radius: 50%;
          z-index: 1;
        }
        .back-wave-bottom-inner {
          position: absolute;
          bottom: -40px;
          left: -20px;
          width: 120px;
          height: 120px;
          background-color: #0d1b2a;
          border-radius: 50%;
          z-index: 2;
        }

        .back-content {
          position: relative;
          z-index: 10;
          width: 100%;
          padding: 15px 25px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .back-lanyard-hole {
          width: 50px;
          height: 8px;
          background-color: #000;
          border-radius: 10px;
          margin-top: 0;
          opacity: 0.4;
          margin-bottom: 15px;
        }

        .back-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          height: 50px;
        }
        .back-logo img {
          max-height: 50px;
          max-width: 140px;
          object-fit: contain;
        }

        .section-title {
          color: #3b82f6;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .about-text {
          font-size: 9px;
          text-align: center;
          color: #e2e8f0;
          line-height: 1.4;
          margin-bottom: 15px;
          font-weight: 400;
        }

        .contact-info {
          width: 100%;
          font-size: 9px;
          color: #ffffff;
          font-weight: 500;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        
        .contact-icon {
          width: 20px;
          height: 20px;
          background-color: #1e90ff;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }
        .contact-icon svg {
          width: 10px;
          height: 10px;
          fill: white;
        }

        .qr-container {
          background-color: white;
          padding: 4px;
          border-radius: 5px;
          margin-bottom: 10px;
        }
        .qr-container img {
          width: 45px;
          height: 45px;
          display: block;
        }

        .social-section {
          text-align: center;
        }
        .social-title {
          font-size: 9px;
          color: #e2e8f0;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .social-icons {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .social-icons .icon {
          width: 18px;
          height: 18px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .social-icons .icon svg {
          width: 9px;
          height: 9px;
          fill: #0d1b2a;
        }

        .world-map {
          position: absolute;
          top: 25%;
          left: 10%;
          width: 80%;
          height: 50%;
          opacity: 0.03;
          background-image: radial-gradient(#fff 1px, transparent 1px);
          background-size: 5px 5px;
          z-index: 1;
        }
        
        .dashed-divider {
          width: 100%;
          border-top: 1px dashed rgba(255,255,255,0.15);
          margin-bottom: 12px;
        }

        /* TABLE STYLES */
        .saved-cards-section {
          width: 100%;
          background: #1e293b;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          margin-top: 20px;
        }

        .saved-cards-title {
          font-size: 22px;
          margin-bottom: 20px;
          color: #3b82f6;
          border-bottom: 1px solid #334155;
          padding-bottom: 10px;
        }

        .cards-table-container {
          overflow-x: auto;
        }

        .cards-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .cards-table th {
          padding: 12px;
          border-bottom: 2px solid #334155;
          color: #94a3b8;
          font-size: 14px;
        }

        .cards-table td {
          padding: 12px;
          border-bottom: 1px solid #334155;
          font-size: 14px;
        }

        .btn-view {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
        }

        .btn-delete {
          padding: 6px 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        /* MODAL STYLES */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: #1e293b;
          padding: 30px;
          border-radius: 15px;
          max-width: 800px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .modal-cards {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 25px;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          width: 100%;
          justify-content: center;
        }

        .btn-modal {
          padding: 12px 25px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        .btn-modal-download { background: #10b981; color: white; }
        .btn-modal-share { background: #3b82f6; color: white; }
        .btn-modal-cancel { background: #64748b; color: white; }

        .close-modal {
          position: absolute;
          top: 15px;
          right: 15px;
          font-size: 24px;
          color: #94a3b8;
          cursor: pointer;
          background: none;
          border: none;
        }
      `}</style>

      <h2 className="generator-title">ASKC Digital Web - ID Card Management</h2>

      <div className="generator-layout">
        {/* CONTROLS / FORM */}
        <div className="form-container">
          <label htmlFor="name">Employee Name</label>
          <input 
            type="text" 
            id="name" 
            placeholder="e.g. Rohit Sharma" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          
          <label htmlFor="role">Role / Position</label>
          <input 
            type="text" 
            id="role" 
            placeholder="e.g. Web Developer" 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
          />
          
          <label htmlFor="idNumber">ID Number</label>
          <input 
            type="text" 
            id="idNumber" 
            placeholder="e.g. ASKC2025001" 
            value={idNumber} 
            onChange={(e) => setIdNumber(e.target.value)} 
          />
          
          <label htmlFor="photoInput">Profile Photo</label>
          <input 
            type="file" 
            id="photoInput" 
            accept="image/*" 
            onChange={handlePhotoChange} 
            style={{ padding: '8px' }}
          />
          
          <div className="download-btns">
            <button className="btn-download" onClick={() => downloadCard('front')}>Download Front Preview</button>
            <button className="btn-download" onClick={() => downloadCard('back')}>Download Back Preview</button>
            <button className="btn-save" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save to Database'}
            </button>
          </div>
        </div>

        {/* PREVIEWS */}
        <div className="cards-preview">
          <CardFront cardData={{ name, role, idNumber, photo }} reference={frontRef} />
          <CardBack reference={backRef} />
        </div>
      </div>

      {/* SAVED CARDS TABLE */}
      <div className="saved-cards-section">
        <h3 className="saved-cards-title">Saved ID Cards</h3>
        <div className="cards-table-container">
          <table className="cards-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>ID Number</th>
                <th>Date Saved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {idCards.map((card) => (
                <tr key={card._id}>
                  <td>{card.name}</td>
                  <td>{card.role}</td>
                  <td>{card.idNumber}</td>
                  <td>{new Date(card.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-view" onClick={() => openViewModal(card)}>View</button>
                    <button className="btn-delete" onClick={() => handleDelete(card._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {idCards.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8' }}>No saved cards found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {showModal && selectedCard && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={closeViewModal}>&times;</button>
            <h3 style={{ marginBottom: '20px', fontSize: '24px' }}>ID Card View</h3>
            
            <div className="modal-cards">
              <CardFront cardData={selectedCard} reference={modalFrontRef} />
              <CardBack reference={modalBackRef} />
            </div>

            <div className="modal-actions">
              <button className="btn-modal btn-modal-download" onClick={() => downloadCard('front', modalFrontRef)}>Download Front</button>
              <button className="btn-modal btn-modal-download" onClick={() => downloadCard('back', modalBackRef)}>Download Back</button>
              <button className="btn-modal btn-modal-share" onClick={handleShare}>Share</button>
              <button className="btn-modal btn-modal-cancel" onClick={closeViewModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIDCard;
