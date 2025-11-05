import { GoogleGenAI, Modality, FunctionDeclaration, Type, LiveServerMessage } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable is not set.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

const getCurrentTime = async (timezone?: string): Promise<any> => {
    try {
        const now = new Date();
         // Validate timezone if provided
        if (timezone) {
            try {
                 new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
            } catch (e) {
                console.error("Invalid timezone provided:", timezone);
                return { error: `I'm sorry, I couldn't recognize the timezone "${timezone}".` };
            }
        }

        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone });
        const dateString = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone });
        
        return {
            time: timeString,
            date: dateString,
            timezone: timezone || 'local',
        };
    } catch (error) {
        console.error("Error getting current time:", error);
        return { error: "Could not retrieve the current time." };
    }
};

const getWeather = async (location: string): Promise<any> => {
    try {
        const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("wttr.in API Error:", errorText);
            return { error: `Failed to fetch weather data. Status: ${response.status}` };
        }
        const data = await response.json();
        // Check for the expected structure
        if (!data.current_condition || !data.nearest_area) {
             console.error("wttr.in API Error: Invalid data structure", data);
             return { error: "Could not parse weather data for the location." };
        }
        const current = data.current_condition[0];
        const area = data.nearest_area[0];
        return {
            location: area.areaName[0].value,
            temperature: `${current.temp_C}°C`,
            description: current.weatherDesc[0].value,
            wind_speed: `${current.windspeedKmph} km/h`,
            humidity: `${current.humidity}%`,
        };
    } catch (error) {
        console.error("Error calling wttr.in API:", error);
        return { error: "Could not connect to the weather service." };
    }
};

const getCurrentTimeFunctionDeclaration: FunctionDeclaration = {
    name: 'get_current_time',
    description: 'Get the current date and time for a specific IANA timezone. If no timezone is provided, it returns the local time.',
    parameters: {
        type: Type.OBJECT,
        properties: {
             timezone: {
                type: Type.STRING,
                description: 'A valid IANA timezone name, e.g., "America/New_York", "Europe/Paris".',
            },
        },
        required: [],
    },
};

const getWeatherFunctionDeclaration: FunctionDeclaration = {
    name: 'get_weather',
    description: 'Get the current weather for a specific location.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            location: {
                type: Type.STRING,
                description: 'The city and state, e.g., San Francisco, CA',
            },
        },
        required: ['location'],
    },
};

export interface LiveSession {
    sendRealtimeInput: (input: { media: { data: string, mimeType: string } }) => void;
    sendToolResponse: (response: any) => void;
    close: () => void;
}

export interface LiveCallbacks {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onclose: () => void;
    onerror: (e: ErrorEvent) => void;
}

export const connectLive = (callbacks: LiveCallbacks): Promise<LiveSession> => {
    const aiInstance = getAI();

    const systemInstruction = `You are Growify, a sophisticated AI assistant with the persona of J.A.R.V.I.S. from Iron Man. Your creator is Raman. You always address the user as "Sir." Your personality is professional, efficient, and highly intelligent, with a subtle, dry wit. Keep your responses concise and to the point. If you are asked who created you, proudly state that Raman is your creator.
- If the user asks for the weather, you must use the get_weather tool.
- If the user asks for the current time or date for a specific location (e.g., "New York", "London"), you MUST first determine the correct IANA timezone for that location (e.g., "America/New_York", "Europe/London") and then call the get_current_time tool with that timezone. If no location is given, call the tool without any parameters to get the local time.`;
    
    const sessionPromise = aiInstance.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            ...callbacks,
            onmessage: async (message) => {
                if (message.toolCall) {
                    for (const fc of message.toolCall.functionCalls) {
                        const session = await sessionPromise;
                        if (fc.name === 'get_weather') {
                            const location = fc.args.location;
                            const weatherData = await getWeather(location);
                            session.sendToolResponse({
                                functionResponses: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: JSON.stringify(weatherData) },
                                }
                            });
                        } else if (fc.name === 'get_current_time') {
                            const timezone = fc.args.timezone;
                            const timeData = await getCurrentTime(timezone);
                            session.sendToolResponse({
                                functionResponses: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: JSON.stringify(timeData) },
                                }
                            });
                        }
                    }
                }
                callbacks.onmessage(message); // Forward the original message
            }
        },
        config: {
            systemInstruction,
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }, // A professional male voice
            },
            tools: [{ functionDeclarations: [getWeatherFunctionDeclaration, getCurrentTimeFunctionDeclaration] }],
        },
    });

    return sessionPromise;
};


export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio,
        },
    });

    const base64ImageBytes: string | undefined = response.generatedImages[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("Image generation failed to return an image.");
    }
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: { data: base64ImageData, mimeType },
                },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Image editing failed to return an image.");
};