# Voice Architecture Findings

## Root cause

The current Windows app does not contain a real modern automatic speech recognition model. Its voice path is split between the browser Web Speech API and a PowerShell `System.Speech.RecognitionEngine` fallback. The refinement provider only receives text after recognition; it cannot convert microphone audio into text. Therefore the app is not yet a Wispr Flow-style audio-to-ASR pipeline.

## Evidence

The renderer opens a microphone stream for a signal meter, while the native recognizer separately calls `SetInputToDefaultAudioDevice()`. These are two independent capture paths. The renderer's `MediaRecorder` data is not sent to any transcription engine. The runtime repeatedly reaches `native-speech-ready`, but no `native-speech-result` is produced during a silent controlled launch.

## Selected strategy

The reliable architecture should be: one renderer microphone stream, explicit audio buffering, conversion to mono 16-bit 16 kHz WAV, local Whisper inference through the Windows `whisper.cpp` runtime, then refinement and focused-app insertion. `whisper.cpp` officially supports Windows, CPU-only inference, quantized models, and voice activity detection. A small `base.en` or `tiny.en` model is appropriate for the first working build; larger models can be offered later.

The existing System.Speech and browser Web Speech paths should remain only as optional fallback paths, not the primary transcription engine. A final release must not claim live dictation until a real audio buffer has been transcribed end to end.

## Sources

1. https://github.com/ggml-org/whisper.cpp — official whisper.cpp repository and Windows/CPU/model documentation.
2. https://learn.microsoft.com/en-us/dotnet/api/system.speech.recognition.speechrecognitionengine — Microsoft SpeechRecognitionEngine API and audio-input behavior.
3. https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder — MediaRecorder capture and dataavailable behavior.
