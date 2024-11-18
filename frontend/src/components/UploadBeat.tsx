import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  LinearProgress,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { beats } from '../services/api';

interface UploadBeatProps {
  onUploadComplete: () => void;
}

const UploadBeat: React.FC<UploadBeatProps> = ({ onUploadComplete }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', title);
      formData.append('description', description);

      await beats.upload(formData);
      onUploadComplete();
      handleClose();
    } catch (error) {
      console.error('Error uploading beat:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<CloudUpload />}
        onClick={handleClickOpen}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        Upload Beat
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Beat</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Box sx={{ mt: 2 }}>
              <input
                accept="audio/*"
                style={{ display: 'none' }}
                id="audio-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="audio-file">
                <Button variant="outlined" component="span" fullWidth>
                  {file ? file.name : 'Choose Audio File'}
                </Button>
              </label>
            </Box>
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={!file || uploading}>
              Upload
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default UploadBeat;
