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
  open: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

const RecordBeat: React.FC<RecordBeatProps> = ({ open, onClose, onUploadComplete }) => {
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
        try {
          audioSource.current.stop();
          audioSource.current.disconnect();
        } catch (error) {
          console.error('Error cleaning up audio source:', error);
        }
      }
      if (audioContext.current) {
        try {
          audioContext.current.close();
        } catch (error) {
          console.error('Error closing audio context:', error);
        }
      }
    };
  }, []);

  const resetState = () => {
    setTitle('');
    setDescription('');
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPlaying(false);
    audioChunks.current = [];
    if (audioSource.current) {
      try {
        audioSource.current.stop();
        audioSource.current.disconnect();
      } catch (error) {
        console.error('Error cleaning up audio source:', error);
      }
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const mimeType = 'audio/webm';
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        setRecordedBlob(audioBlob);
      };

      audioChunks.current = [];
      mediaRecorder.current.start(200);
      setIsRecording(true);

      // Start timer
      timerInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please make sure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
  };

  const togglePlayback = async () => {
    if (!recordedBlob) return;

    if (isPlaying) {
      if (audioSource.current) {
        audioSource.current.stop();
        audioSource.current.disconnect();
      }
      setIsPlaying(false);
      return;
    }

    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      setIsPlaying(false);
    }
  };

  const handleSubmit = async () => {
    if (!recordedBlob) return;

    try {
      setUploading(true);

      // Convert to WAV format before uploading
      const wavBlob = await convertToWav(recordedBlob);
      
      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      formData.append('title', title || 'Untitled Beat');
      formData.append('description', description || '');

      await beats.upload(formData);
      onUploadComplete();
      onClose();
    } catch (error) {
      console.error('Error uploading beat:', error);
      alert('Failed to upload recording. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const convertToWav = async (blob: Blob): Promise<Blob> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const wavBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
    
    // Copy the audio data
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      wavBuffer.copyToChannel(channelData, channel);
    }
    
    // Create WAV file
    const wavData = await encodeWavFile(wavBuffer);
    return new Blob([wavData], { type: 'audio/wav' });
  };

  const encodeWavFile = async (audioBuffer: AudioBuffer): Promise<ArrayBuffer> => {
    const interleaved = interleaveChannels(audioBuffer);
    const dataView = createWavDataView(interleaved, audioBuffer.sampleRate);
    return dataView.buffer;
  };

  const interleaveChannels = (audioBuffer: AudioBuffer): Float32Array => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels;
    const result = new Float32Array(length);

    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        result[i * numberOfChannels + channel] = audioBuffer.getChannelData(channel)[i];
      }
    }

    return result;
  };

  const createWavDataView = (interleaved: Float32Array, sampleRate: number): DataView => {
    const buffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(buffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, interleaved.length * 2, true);

    // Write audio data
    floatTo16BitPCM(view, 44, interleaved);

    return view;
  };

  const writeString = (view: DataView, offset: number, string: string): void => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const floatTo16BitPCM = (view: DataView, offset: number, input: Float32Array): void => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
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
  );
};

export default RecordBeat;