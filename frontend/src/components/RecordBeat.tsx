import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  LinearProgress,
  IconButton,
  Typography,
} from '@mui/material';
import { Mic, Stop, PlayArrow, Pause, Save } from '@mui/icons-material';
import { beats } from '../services/api';

interface RecordBeatProps {
  onUploadComplete: () => void;
}

const RecordBeat: React.FC<RecordBeatProps> = ({ onUploadComplete }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const audioSource = useRef<AudioBufferSourceNode | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (audioSource.current) {
        audioSource.current.stop();
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const handleOpen = () => {
    setOpen(true);
    resetState();
  };

  const handleClose = () => {
    setOpen(false);
    resetState();
  };

  const resetState = () => {
    setTitle('');
    setDescription('');
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPlaying(false);
    audioChunks.current = [];
    if (audioSource.current) {
      audioSource.current.stop();
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      audioChunks.current = [];
      mediaRecorder.current.start();
      setIsRecording(true);

      timerInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Failed to access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }
  };

  const togglePlayback = async () => {
    if (!recordedBlob) return;

    if (isPlaying) {
      if (audioSource.current) {
        audioSource.current.stop();
      }
      setIsPlaying(false);
      return;
    }

    try {
      if (!audioContext.current) {
        audioContext.current = new AudioContext();
      }

      const arrayBuffer = await recordedBlob.arrayBuffer();
      const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);

      audioSource.current = audioContext.current.createBufferSource();
      audioSource.current.buffer = audioBuffer;
      audioSource.current.connect(audioContext.current.destination);
      
      audioSource.current.onended = () => {
        setIsPlaying(false);
      };

      audioSource.current.start();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Failed to play the recording. Please try recording again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordedBlob) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('audio', recordedBlob, 'recording.webm');
      formData.append('title', title || 'Untitled Beat');
      formData.append('description', description || '');

      await beats.upload(formData);
      onUploadComplete();
      handleClose();
    } catch (error) {
      console.error('Error uploading beat:', error);
      alert('Failed to upload recording. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        Record Beat
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Record New Beat</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <IconButton
                color={isRecording ? 'error' : 'primary'}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={uploading}
              >
                {isRecording ? <Stop /> : <Mic />}
              </IconButton>
              {recordedBlob && (
                <IconButton
                  color="primary"
                  onClick={togglePlayback}
                  disabled={uploading || isRecording}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              )}
            </Box>

            <Typography align="center" variant="body2" color="textSecondary">
              {formatTime(recordingTime)}
            </Typography>

            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!recordedBlob || uploading}
            startIcon={<Save />}
            variant="contained"
          >
            {uploading ? 'Uploading...' : 'Save'}
          </Button>
        </DialogActions>
        {uploading && <LinearProgress />}
      </Dialog>
    </>
  );
};

export default RecordBeat;
