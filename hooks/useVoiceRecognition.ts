import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface IWindow extends Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onStopCallbackRef = useRef<((finalTranscript: string) => void) | null>(null);
  const transcriptRef = useRef(''); // Ref to hold latest final transcript

  useEffect(() => {
    const SpeechRecognitionAPI = (window as unknown as IWindow).SpeechRecognition || (window as unknown as IWindow).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.error("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let final_transcript = '';
      let interim_transcript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final_transcript += transcriptPart;
        } else {
          interim_transcript += transcriptPart;
        }
      }

      if (final_transcript) {
        transcriptRef.current = (transcriptRef.current ? transcriptRef.current + ' ' : '') + final_transcript.trim();
      }
      
      setTranscript(transcriptRef.current + (interim_transcript ? ' ' + interim_transcript : ''));
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        setIsListening(false);
        if (onStopCallbackRef.current) {
          onStopCallbackRef.current(transcriptRef.current);
          onStopCallbackRef.current = null;
        }
      }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      transcriptRef.current = '';
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback((callback?: (finalTranscript: string) => void) => {
    if (recognitionRef.current && isListening) {
      if (callback) {
        onStopCallbackRef.current = callback;
      }
      recognitionRef.current.stop();
    } else if (callback) {
      callback(transcriptRef.current);
    }
  }, [isListening]);

  const setTranscriptManually = useCallback((text: string) => {
    setTranscript(text);
    transcriptRef.current = text;
  }, []);

  return { isListening, transcript, startListening, stopListening, setTranscript: setTranscriptManually };
};
