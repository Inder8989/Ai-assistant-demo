
export const textToSpeech = async (text: string, voiceId: string, apiKey: string): Promise<Blob> => {
    if (!apiKey) {
        throw new Error("ElevenLabs API key is not set.");
    }
    if (!text.trim()) {
        return new Blob();
    }

    const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`ElevenLabs API error: ${errorData.detail?.message || response.statusText}`);
        }

        const audioBlob = await response.blob();
        return audioBlob;
    } catch (error) {
        console.error("Error with ElevenLabs TTS:", error);
        throw error;
    }
};
