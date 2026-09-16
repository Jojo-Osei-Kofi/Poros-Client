import * as FileSystem from 'expo-file-system/legacy';
import apiService from './apiService';

export interface JobDetails {
  companyName: string;
  positionTitle: string;
  jobDescription: string;
}

export const tailorResume = async (
  resumeUri: string,
  jobDetails: JobDetails
): Promise<string> => {
  let fileToRead = resumeUri;
  let temporaryFile: string | null = null;

  try {
    const hasScheme =
      resumeUri.startsWith('http') ||
      resumeUri.startsWith('file:') ||
      resumeUri.startsWith('content:');

    if (!hasScheme) {
      const cleanPath = resumeUri.startsWith('/') ? resumeUri : `/${resumeUri}`;
      resumeUri = `${apiService.getBaseURL()}${cleanPath}`;
    }

    if (resumeUri.startsWith('http')) {
      temporaryFile = `${FileSystem.cacheDirectory}resume_${Date.now()}.pdf`;
      const authHeaders = await apiService.getAuthHeaders();
      const download = await FileSystem.downloadAsync(
        resumeUri,
        temporaryFile,
        { headers: authHeaders }
      );
      fileToRead = download.uri;
    }

    const resumeBase64 = await FileSystem.readAsStringAsync(fileToRead, {
      encoding: 'base64',
    });

    const authHeaders = await apiService.getAuthHeaders();
    const response = await fetch(
      `${apiService.getBaseURL()}/api/ai/tailor-resume`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ resumeBase64, jobDetails }),
      }
    );

    const data = await response.json() as { html?: string; error?: string };

    if (!response.ok || !data.html) {
      throw new Error(data.error || 'Resume tailoring failed');
    }

    return data.html;
  } finally {
    if (temporaryFile) {
      await FileSystem.deleteAsync(temporaryFile, { idempotent: true });
    }
  }
};
