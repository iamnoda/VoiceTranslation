import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Copy, RotateCcw, Languages, Send, Volume2 } from 'lucide-react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  addEventListener(type: 'end', listener: () => void): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'th', name: 'Thai' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
];

const speechLanguageCodes = {
  'en': 'en-US',
  'th': 'th-TH',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'it': 'it-IT',
  'pt': 'pt-PT',
  'ru': 'ru-RU',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'zh': 'zh-CN',
  'ar': 'ar-SA',
  'hi': 'hi-IN',
  'vi': 'vi-VN',
  'nl': 'nl-NL',
  'sv': 'sv-SE',
  'da': 'da-DK',
  'no': 'no-NO',
  'fi': 'fi-FI',
  'pl': 'pl-PL',
  'tr': 'tr-TR',
};

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [agentReply, setAgentReply] = useState('');
  const [agentReplyTranslated, setAgentReplyTranslated] = useState('');
  const [inputLanguage, setInputLanguage] = useState('th');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingReply, setIsTranslatingReply] = useState(false);
  const [error, setError] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = speechLanguageCodes[inputLanguage as keyof typeof speechLanguageCodes] || 'th-TH';

        recognitionRef.current.addEventListener('result', (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setOriginalText(prev => prev + finalTranscript);
            setInterimText('');
          } else {
            setInterimText(interimTranscript);
          }
        });

        recognitionRef.current.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
          setError(`Speech recognition error: ${event.error}`);
          setIsRecording(false);
        });

        recognitionRef.current.addEventListener('end', () => {
          setIsRecording(false);
          setInterimText('');
        });
      }
    } else {
      setError('Speech recognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [inputLanguage]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLanguageCodes[inputLanguage as keyof typeof speechLanguageCodes] || 'th-TH';
    }
  }, [inputLanguage]);
  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setError('');
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const clearText = () => {
    setOriginalText('');
    setTranslatedText('');
    setAgentReply('');
    setAgentReplyTranslated('');
    setInterimText('');
    setError('');
  };

  const translateText = async () => {
    if (!originalText.trim()) return;
    
    setIsTranslating(true);
    setError('');
    
    try {
      // Using MyMemory Translation API (free, no API key required)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(originalText)}&langpair=${inputLanguage}|${outputLanguage}`
      );
      
      if (!response.ok) {
        throw new Error('Translation service unavailable');
      }
      
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        throw new Error('Translation failed');
      }
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const translateAgentReply = async () => {
    if (!agentReply.trim()) return;
    
    setIsTranslatingReply(true);
    setError('');
    
    try {
      // Translate from output language back to input language
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(agentReply)}&langpair=${outputLanguage}|${inputLanguage}`
      );
      
      if (!response.ok) {
        throw new Error('Translation service unavailable');
      }
      
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        setAgentReplyTranslated(data.responseData.translatedText);
      } else {
        throw new Error('Translation failed');
      }
    } catch (err) {
      setError('Agent reply translation failed. Please try again.');
      console.error('Translation error:', err);
    } finally {
      setIsTranslatingReply(false);
    }
  };

  const speakText = (text: string, language: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLanguageCodes[language as keyof typeof speechLanguageCodes] || 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        setError('Text-to-speech failed. Please try again.');
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setError('Text-to-speech is not supported in this browser.');
    }
  };
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  useEffect(() => {
    if (originalText.trim()) {
      translateText();
    }
  }, [originalText, inputLanguage, outputLanguage]);

  useEffect(() => {
    if (agentReply.trim()) {
      translateAgentReply();
    } else {
      setAgentReplyTranslated('');
    }
  }, [agentReply, inputLanguage, outputLanguage]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Voice Transcription & Translation</h1>
          <p className="text-gray-600">Speak naturally and see your words translated in real-time</p>
        </div>

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="flex flex-col gap-6">
            {/* Language Selection */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Input Language:</label>
                <select
                  value={inputLanguage}
                  onChange={(e) => setInputLanguage(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="text-gray-400">→</div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Output Language:</label>
                <select
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Recording Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                }`}
                disabled={!recognitionRef.current}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </>
                )}
              </button>

              <button
                onClick={clearText}
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200 transform hover:scale-105"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </button>

              {isRecording && (
                <div className="flex items-center gap-2 text-red-500">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Text Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Original Text */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Original Text ({languages.find(l => l.code === inputLanguage)?.name})
              </h2>
              {originalText && (
                <button
                  onClick={() => copyToClipboard(originalText)}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {originalText || (isRecording ? 'Listening...' : 'Click "Start Recording" to begin')}
                {interimText && (
                  <span className="text-gray-400 italic">
                    {interimText}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Translated Text */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                Translated Text ({languages.find(l => l.code === outputLanguage)?.name})
              </h2>
              {translatedText && (
                <button
                  onClick={() => copyToClipboard(translatedText)}
                  className="p-2 text-gray-500 hover:text-emerald-500 transition-colors rounded-lg hover:bg-emerald-50"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
              {isTranslating ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Translating...</span>
                </div>
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {translatedText || 'Translation will appear here automatically'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Agent Reply Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            Agent Reply
          </h2>
          
          {/* Agent Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type your reply in {languages.find(l => l.code === outputLanguage)?.name}:
            </label>
            <div className="flex gap-2">
              <textarea
                value={agentReply}
                onChange={(e) => setAgentReply(e.target.value)}
                placeholder={`Type your response in ${languages.find(l => l.code === outputLanguage)?.name}...`}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />
              <button
                onClick={() => setAgentReply('')}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Clear reply"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Translated Reply Display */}
          {(agentReply.trim() || isTranslatingReply) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Original Reply */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800">
                    Original ({languages.find(l => l.code === outputLanguage)?.name})
                  </h3>
                  <div className="flex gap-1">
                    {agentReply && (
                      <button
                        onClick={() => copyToClipboard(agentReply)}
                        className="p-1 text-gray-500 hover:text-purple-500 transition-colors rounded"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                    {agentReply && (
                      <button
                        onClick={() => speakText(agentReply, outputLanguage)}
                        className={`p-1 transition-colors rounded ${
                          isSpeaking ? 'text-purple-600' : 'text-gray-500 hover:text-purple-500'
                        }`}
                        title="Play audio"
                        disabled={isSpeaking}
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-800 text-sm whitespace-pre-wrap">
                  {agentReply || 'Your reply will appear here...'}
                </p>
              </div>

              {/* Translated Reply */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800">
                    Translated ({languages.find(l => l.code === inputLanguage)?.name})
                  </h3>
                  <div className="flex gap-1">
                    {agentReplyTranslated && (
                      <button
                        onClick={() => copyToClipboard(agentReplyTranslated)}
                        className="p-1 text-gray-500 hover:text-blue-500 transition-colors rounded"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                    {agentReplyTranslated && (
                      <button
                        onClick={() => speakText(agentReplyTranslated, inputLanguage)}
                        className={`p-1 transition-colors rounded ${
                          isSpeaking ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                        }`}
                        title="Play audio"
                        disabled={isSpeaking}
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {isTranslatingReply ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Translating...</span>
                  </div>
                ) : (
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">
                    {agentReplyTranslated || 'Translation will appear here...'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Instructions */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Use:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">1</div>
              <div>
                <p className="font-medium">Select Languages</p>
                <p>Choose your input language (what you'll speak) and output language (translation target)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">2</div>
              <div>
                <p className="font-medium">Start Recording</p>
                <p>Click the microphone button and grant permission to access your microphone</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">3</div>
              <div>
                <p className="font-medium">Speak & Translate</p>
                <p>Your speech will be transcribed and automatically translated in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs">4</div>
              <div>
                <p className="font-medium">Agent Reply</p>
                <p>Type a response that will be translated back and can be played as audio</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;