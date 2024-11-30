import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RecordBeat from './RecordBeat';

const RecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    navigate('/feed'); // Return to feed when closed
  };

  const handleUploadComplete = () => {
    setOpen(false);
    navigate('/feed'); // Return to feed after successful upload
  };

  return (
    <RecordBeat
      open={open}
      onClose={handleClose}
      onUploadComplete={handleUploadComplete}
    />
  );
};

export default RecordPage;
