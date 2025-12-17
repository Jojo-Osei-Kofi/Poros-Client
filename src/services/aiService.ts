import * as FileSystem from 'expo-file-system/legacy';

// Export API key so it can be shared with other services
export const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';

// Tavily API key for real-time event search
export const TAVILY_API_KEY = process.env.EXPO_PUBLIC_TAVILY_API_KEY || '';

export interface JobDetails {
    companyName: string;
    positionTitle: string;
    jobDescription: string;
}

export const tailorResume = async (resumeUri: string, jobDetails: JobDetails): Promise<string> => {
    try {
        if (!ANTHROPIC_API_KEY) {
            throw new Error('Anthropic API Key is missing. Please check your .env file and restart the app.');
        }

        // Check if the URI is a remote URL
        let fileToRead = resumeUri;
        let isTempFile = false;

        if (resumeUri.startsWith('http')) {
            const timestamp = Date.now();
            const tempFileUri = `${FileSystem.cacheDirectory}temp_resume_${timestamp}.pdf`;
            const downloadRes = await FileSystem.downloadAsync(resumeUri, tempFileUri);
            fileToRead = downloadRes.uri;
            isTempFile = true;
        }

        // Read the file as Base64
        const resumeBase64 = await FileSystem.readAsStringAsync(fileToRead, {
            encoding: 'base64',
        });

        // Clean up temp file if we created one
        if (isTempFile) {
            await FileSystem.deleteAsync(fileToRead, { idempotent: true });
        }

        const prompt = `
    You are an expert resume writer. I will provide you with a resume (in PDF format) and a job description.
    Your task is to rewrite the resume to better match the job description, highlighting relevant skills and experience.
    
    Target Company: ${jobDetails.companyName}
    Target Position: ${jobDetails.positionTitle}
    
    Job Description:
    ${jobDetails.jobDescription}
    
    Please return the tailored resume as a complete, well-formatted HTML document. 
    
    CRITICAL DESIGN REQUIREMENTS:
    1. STRICT ONE-PAGE LIMIT (MANDATORY):
       - CSS RULES: Use \`font-size: 8pt\` and \`line-height: 1.15\`. Use narrow margins (0.5 inch).
       - CONTENT LIMITS: 
         * Professional Summary: Max 2-3 lines.
         * Experience: Include ONLY the 3 most relevant roles.
         * Bullet Points: MAXIMUM 3 bullet points per role.
         * Skills: Group into a compact list.
    2. COLOR: Use ONLY black text (#000000). Do NOT use blue or any other colors.
    3. LAYOUT: Use a clean, professional, compact layout. No wasted whitespace.
    
    Do not include any markdown formatting (like \`\`\`html), just the raw HTML code.
    `;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'document',
                                source: {
                                    type: 'base64',
                                    media_type: 'application/pdf',
                                    data: resumeBase64,
                                },
                            },
                            {
                                type: 'text',
                                text: prompt,
                            },
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Claude API Error:', errorData);
            throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const htmlContent = data.content[0].text;

        return htmlContent;
    } catch (error) {
        console.error('Error tailoring resume:', error);
        throw error;
    }
};
