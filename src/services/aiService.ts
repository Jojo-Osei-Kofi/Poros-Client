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

        console.log('[aiService] Starting tailoring with resumeUri:', resumeUri);

        let fileToRead = resumeUri;
        let isTempFile = false;

        // Check for relative path or missing scheme
        const hasScheme = resumeUri.startsWith('http') || resumeUri.startsWith('file:') || resumeUri.startsWith('content:');

        if (!hasScheme) {
            // It's a relative path from backend (e.g. /uploads/...)
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://poros-data-service.onrender.com';
            // Ensure we handle leading slash correctly
            const cleanPath = resumeUri.startsWith('/') ? resumeUri : `/${resumeUri}`;
            resumeUri = `${API_BASE_URL}${cleanPath}`;
            console.log('[aiService] Resolved relative path to full URL:', resumeUri);
        }

        if (resumeUri.startsWith('http')) {
            const timestamp = Date.now();
            const tempFileUri = `${FileSystem.cacheDirectory}temp_resume_${timestamp}.pdf`;
            console.log('[aiService] Downloading remote resume to:', tempFileUri);

            try {
                const downloadRes = await FileSystem.downloadAsync(resumeUri, tempFileUri);
                fileToRead = downloadRes.uri;
                isTempFile = true;
                console.log('[aiService] Download success:', downloadRes.status);
            } catch (err) {
                console.error('[aiService] Download failed:', err);
                throw new Error(`Failed to download resume from ${resumeUri}`);
            }
        }

        console.log('[aiService] Reading file from:', fileToRead);

        // Read the file as Base64
        const resumeBase64 = await FileSystem.readAsStringAsync(fileToRead, {
            encoding: 'base64',
        });

        // Clean up temp file if we created one
        if (isTempFile) {
            await FileSystem.deleteAsync(fileToRead, { idempotent: true });
        }

        const prompt = `
    You are an expert resume writer and ATS optimization specialist. I will provide you with a resume (in PDF format) and a job description.
    Your task is to rewrite the resume to maximize ATS compatibility and recruiter appeal while maintaining ALL experience from the original resume.

    Target Company: ${jobDetails.companyName}
    Target Position: ${jobDetails.positionTitle}

    Job Description:
    ${jobDetails.jobDescription}

    Please return the tailored resume as a complete, well-formatted HTML document.

    CRITICAL REQUIREMENTS:

    1. STRICT ONE-PAGE LIMIT (ABSOLUTE MAXIMUM):
       - The resume MUST NOT exceed one page under any circumstances
       - Content should fill the page but NEVER overflow to a second page
       - If all content doesn't fit, prioritize and condense intelligently
       - Use CSS: \`@page { size: letter; } @media print { body { page-break-after: avoid; } }\`

    2. ATS OPTIMIZATION (MANDATORY):
       - Extract and incorporate relevant keywords from the job description naturally throughout the resume
       - Use standard section headers: "Professional Summary", "Experience", "Skills", "Education"
       - Match job requirements with specific accomplishments and metrics from the user's experience
       - Use industry-standard terminology that matches the job description
       - Include both acronyms and full terms (e.g., "ATS (Applicant Tracking System)")

    3. CONTENT REQUIREMENTS:
       - Include ALL work experience from the original resume - do not omit any roles
       - Reorder experiences based on relevance to the target position (most relevant first)
       - For each role: 2-3 impactful bullet points that align with job requirements
       - If space is limited, use 1-2 bullet points for older/less relevant roles
       - Quantify achievements with metrics wherever possible
       - Tailor the Professional Summary (2-3 lines max) to mirror key job requirements
       - Organize skills to prioritize those mentioned in the job description

    4. LAYOUT & SPACING (CRITICAL FOR ONE-PAGE FIT):
       - CSS RULES: \`font-size: 8.5pt\`, \`line-height: 1.15\`, margins: \`0.5 inch\`
       - Compact section spacing: \`margin-bottom: 0.1in\` between sections
       - Tight bullet points: \`margin-bottom: 0.05in\`
       - Adjust font size down to 8pt if necessary to fit all content
       - No excessive whitespace - every inch counts
       - Test that content doesn't exceed 10.5 inches in height (11" page - 0.5" margins)

    5. VISUAL DESIGN:
       - Use ONLY black text (#000000) for maximum ATS compatibility
       - Clean, professional, single-column layout
       - Bold section headers and company names for visual hierarchy
       - Consistent formatting throughout

    6. RECRUITER SCREENING OPTIMIZATION:
       - Place most relevant experience and skills in the top half
       - Lead each bullet point with strong action verbs
       - Align language with the company culture (if identifiable)
       - Ensure cohesive narrative matching the target role

    IMPORTANT: Return ONLY the raw HTML code with no markdown formatting, code blocks, or backticks.
    The resume must be print-ready and STRICTLY limited to one page.
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
