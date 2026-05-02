import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import axios from 'axios';
import Barcode from 'react-barcode';

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
    // Auto-generate ID number if empty
    if (!idNumber) {
      generateDynamicID();
    }
  }, []);

  const generateDynamicID = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    setIdNumber(`ASKCDW${year}${randomNum}`);
  };

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
      // Reset form
      setName('');
      setRole('');
      generateDynamicID();
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
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `askc-id-card-${side}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating card image:', err);
    }
  };

  const handleShare = async () => {
    if (!selectedCard) return;
    
    const shareUrl = `${window.location.origin}/id-card/verify/${selectedCard._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ASKC Digital Web ID Card',
          text: `Digital ID Verification for ${selectedCard.name}`,
          url: shareUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Verification link copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      alert(`Share link: ${text}`);
    });
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

  const CardBack = ({ cardData, reference }) => (
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
          
          <div className="dashed-divider"></div>

          <div className="section-title">CONTACT US</div>
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </div>
              <div>Bihar IT Solution, Main Road,<br/>Patna, Bihar, 800001</div>
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
          </div>
          
          <div className="dashed-divider" style={{ marginTop: '5px' }}></div>
          
          <div className="barcode-container" style={{ background: 'white', padding: '10px', borderRadius: '10px', marginTop: '10px' }}>
            <Barcode 
              value={cardData.idNumber || idNumber || "ASKCDW2025001"} 
              height={40} 
              width={1.2} 
              fontSize={12}
            />
          </div>
          
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '10px' }}>
            Follow Us
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
          border-color: #3b82f6;
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

        .id-card-wrapper {
          width: 340px;
          height: 530px;
          border-radius: 20px;
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
          height: 300px;
          background-color: #0d1b2a;
          z-index: 1;
        }
        
        .front-wave-1 {
          position: absolute;
          bottom: 240px;
          left: -30%;
          width: 160%;
          height: 300px;
          background-color: #3b82f6;
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
          height: 10px;
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
          max-width: 160px;
          max-height: 80px;
          object-fit: contain;
          mix-blend-mode: multiply;
        }

        .photo-container {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 4px solid #3b82f6;
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
          margin-top: 30px;
          text-align: center;
          color: white;
          width: 100%;
        }
        .employee-name {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #ffffff;
          letter-spacing: 0.5px;
        }
        .employee-title {
          font-size: 16px;
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
          font-size: 12px;
          color: #ffffff;
          margin: 0 0 5px 0;
          font-weight: 600;
        }
        .id-number-badge {
          background-color: #3b82f6;
          color: white;
          padding: 8px 30px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 700;
          display: inline-block;
          margin-bottom: 20px;
          letter-spacing: 1px;
        }

        .signature-container {
          text-align: center;
          margin-top: 5px;
        }
        .signature {
          width: 100px;
          height: auto;
          filter: invert(1);
          opacity: 0.8;
        }
        .signatory {
          font-size: 10px;
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
          background-color: #3b82f6;
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
          background-color: #3b82f6;
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
          padding: 15px 30px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .back-lanyard-hole {
          width: 60px;
          height: 10px;
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
          margin-bottom: 15px;
          height: 60px;
        }
        .back-logo img {
          max-height: 60px;
          max-width: 180px;
          object-fit: contain;
        }

        .section-title {
          color: #3b82f6;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .about-text {
          font-size: 10px;
          text-align: center;
          color: #e2e8f0;
          line-height: 1.5;
          margin-bottom: 20px;
          font-weight: 400;
        }

        .contact-info {
          width: 100%;
          font-size: 11px;
          color: #ffffff;
          font-weight: 500;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .contact-icon {
          width: 24px;
          height: 24px;
          background-color: #3b82f6;
          border-radius: 6px;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }
        .contact-icon svg {
          width: 14px;
          height: 14px;
          fill: white;
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
          margin-bottom: 15px;
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
          overflow-y: auto;
        }

        .modal-content {
          background: #1e293b;
          padding: 30px;
          border-radius: 15px;
          max-width: 900px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          margin-top: auto;
          margin-bottom: auto;
        }

        .modal-cards {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 25px;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-modal {
          padding: 12px 25px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          min-width: 120px;
        }

        .btn-cancel {
          background: #475569;
          color: white;
        }

        .btn-download-modal {
          background: #10b981;
          color: white;
        }

        .btn-share {
          background: #8b5cf6;
          color: white;
        }
        
        @media (max-width: 768px) {
          .modal-content {
            padding: 15px;
          }
          .modal-cards {
            gap: 15px;
          }
          .id-card-wrapper {
            transform: scale(0.85);
            margin: -40px 0;
          }
          .modal-actions {
            flex-direction: column;
            gap: 10px;
          }
          .btn-modal {
            width: 100%;
          }
        }
      `}</style>

      <h1 className="generator-title font-bold text-slate-100 flex items-center gap-3">
        <span className="p-2 bg-blue-500/20 rounded-lg">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm5 3a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </span>
        Admin ID Card Generator
      </h1>
      
      <div className="generator-layout">
        <div className="form-container">
          <label>Employee Name</label>
          <input 
            type="text" 
            placeholder="Enter full name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          
          <label>Job Position</label>
          <input 
            type="text" 
            placeholder="Enter position" 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
          />
          
          <label>Employee ID No.</label>
          <input 
            type="text" 
            placeholder="e.g. ASKCDW2025001" 
            value={idNumber} 
            onChange={(e) => setIdNumber(e.target.value)} 
          />
          
          <label>Upload Photo</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoChange} 
            style={{ padding: '8px' }}
          />

          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save to Database'}
          </button>
          
          <div className="download-btns">
            <button className="btn-download" onClick={() => downloadCard('front')}>Download Front</button>
            <button className="btn-download" style={{ background: '#6366f1' }} onClick={() => downloadCard('back')}>Download Back</button>
          </div>
        </div>

        <div className="cards-preview">
          <CardFront cardData={{ name, role, idNumber, photo }} reference={frontRef} />
          <CardBack cardData={{ name, role, idNumber }} reference={backRef} />
        </div>
      </div>

      <div className="saved-cards-section">
        <h2 className="saved-cards-title">Managed ID Cards</h2>
        <div className="cards-table-container">
          <table className="cards-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Role</th>
                <th>ID Number</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {idCards.map(card => (
                <tr key={card._id}>
                  <td>
                    <img 
                      src={card.photo || 'https://via.placeholder.com/40'} 
                      alt={card.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                  </td>
                  <td>{card.name}</td>
                  <td>{card.role}</td>
                  <td className="font-mono text-blue-400">{card.idNumber}</td>
                  <td>{new Date(card.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-view" onClick={() => openViewModal(card)}>View</button>
                    <button className="btn-delete" onClick={() => handleDelete(card._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {idCards.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No ID cards generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedCard && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="saved-cards-title w-full text-center mb-6">ID Card Preview</h2>
            
            <div className="modal-cards">
              <CardFront cardData={selectedCard} reference={modalFrontRef} />
              <CardBack cardData={selectedCard} reference={modalBackRef} />
            </div>

            <div className="modal-actions">
              <button className="btn-modal btn-download-modal" onClick={() => downloadCard('front', modalFrontRef)}>Download Front</button>
              <button className="btn-modal btn-download-modal" style={{ background: '#6366f1' }} onClick={() => downloadCard('back', modalBackRef)}>Download Back</button>
              <button className="btn-modal btn-share" onClick={handleShare}>Share Link</button>
              <button className="btn-modal btn-cancel" onClick={closeViewModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIDCard;
