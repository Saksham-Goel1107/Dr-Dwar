import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';

export class VersionController {
  // Get latest app version
  static getLatestAppVersion = asyncHandler(async (req: Request, res: Response) => {
    const { platform, appType } = req.query;
    const versions = {
      android: {
        regular: {
          version: '1.1.4',
          releaseNotes:
            '• Enhanced AI chatbot responses\n• Improved appointment booking\n• Bug fixes and performance improvements',
          downloadUrl: 'https://play.google.com/store/apps/details?id=com.saksham.dr-dwar',
          store: 'Google Play Store',
        },
        professional: {
          version: '1.0.5',
          releaseNotes:
            '• New prescription management features\n• Enhanced patient records\n• Improved offline capabilities',
          downloadUrl: 'https://play.google.com/store/apps/details?id=com.saksham.dr-dwar.pro',
          store: 'Google Play Store',
        },
      },
      ios: {
        regular: {
          version: '1.1.0',
          releaseNotes:
            '• Enhanced AI chatbot responses\n• Improved appointment booking\n• Bug fixes and performance improvements',
          downloadUrl: 'https://apps.apple.com/app/dr-dwar/id1234567890',
          store: 'App Store',
        },
        professional: {
          version: '1.0.5',
          releaseNotes:
            '• New prescription management features\n• Enhanced patient records\n• Improved offline capabilities',
          downloadUrl: 'https://apps.apple.com/app/dr-dwar-professional/id1234567891',
          store: 'App Store',
        },
      },
    };

    const appTypeKey = appType === 'professional' ? 'professional' : 'regular';
    const platformKey = platform === 'ios' ? 'ios' : 'android';

    const appData = versions[platformKey][appTypeKey];

    res.json({
      success: true,
      version: appData.version,
      platform: platformKey,
      appType: appTypeKey,
      releaseNotes: appData.releaseNotes,
      downloadUrl: appData.downloadUrl,
      store: appData.store,
    });
  });
}
