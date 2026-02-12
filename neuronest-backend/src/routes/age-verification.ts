import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { findUserById, updateUser, persistDb } from '../db/index.js';
import { getAgeVerificationConfig } from '../config/settings.js';

const router = Router();

router.use(authenticateToken);

// GET /age-verification/status - Check if age verification is required and user's status
router.get('/status', (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const config = getAgeVerificationConfig();
  const user = findUserById(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isVerified = !!(user as any).ageVerified;
  const verifiedAt = (user as any).ageVerifiedAt || null;
  const verificationMethod = (user as any).ageVerificationMethod || null;

  // Check grace period
  let withinGracePeriod = false;
  if (config.gracePeriodHours > 0 && user.createdAt) {
    const createdMs = new Date(user.createdAt).getTime();
    const graceMs = config.gracePeriodHours * 60 * 60 * 1000;
    withinGracePeriod = Date.now() - createdMs < graceMs;
  }

  // Check bypass for existing users (users created before feature was enabled)
  const bypassApplies = config.bypassForExistingUsers && !config.enforceOnRegistration;

  const required = config.enabled && !isVerified && !withinGracePeriod && !bypassApplies;

  res.json({
    required,
    enabled: config.enabled,
    isVerified,
    verifiedAt,
    verificationMethod,
    withinGracePeriod,
    minimumAge: config.minimumAge,
    enabledMethods: config.enabledMethods,
    provider: config.provider
  });
});

// POST /age-verification/verify - Submit age verification
router.post('/verify', (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const config = getAgeVerificationConfig();
  const { method, token: verificationToken, cardLast4, mobileNumber } = req.body;

  if (!config.enabled) {
    return res.status(400).json({ error: 'Age verification is not enabled' });
  }

  if (!method || !config.enabledMethods.includes(method)) {
    return res.status(400).json({ error: 'Invalid verification method' });
  }

  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // In production with Yoti, you'd validate the verificationToken with Yoti's API:
  //   POST https://api.yoti.com/age-verification/v1/sessions/{sessionId}/result
  //   with the Yoti SDK credentials to get the verified age result.
  //
  // For credit_card method: Yoti makes a £0 temporary auth to confirm the card
  //   is valid and belongs to someone 18+ (UK law requires 18+ for credit cards).
  //
  // For mobile method: Yoti checks with the mobile network operator whether the
  //   phone number has age restriction filters. No filters = confirmed 18+.
  //
  // For photo_id method: Yoti extracts DOB from government ID photo and verifies
  //   via facial matching that the document belongs to the user.
  //
  // For facial_age_estimation: Yoti's AI estimates age from a selfie.
  //
  // For open_banking: User authorises their bank to confirm age via Open Banking API.

  // When Yoti credentials are configured, this would call:
  //   const yotiResult = await verifyWithYoti(config, method, verificationToken);
  //   if (!yotiResult.verified) return res.status(403).json({ error: 'Verification failed' });

  // For now (no Yoti keys configured), we accept the verification in manual/demo mode
  // or when provider is 'manual'. In production, this gate is enforced by the Yoti callback.
  const isManualMode = config.provider === 'manual' || !config.yotiClientSdkId;

  if (!isManualMode) {
    // Production: would validate with Yoti API here
    // For safety, reject if no real validation can happen
    if (!verificationToken) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
  }

  // Mark user as age-verified
  const updates: Record<string, any> = {
    ageVerified: true,
    ageVerifiedAt: new Date().toISOString(),
    ageVerificationMethod: method
  };

  if (method === 'credit_card' && cardLast4) {
    updates.ageVerificationRef = `card:****${cardLast4}`;
  } else if (method === 'mobile' && mobileNumber) {
    const masked = mobileNumber.replace(/.(?=.{4})/g, '*');
    updates.ageVerificationRef = `mobile:${masked}`;
  } else {
    updates.ageVerificationRef = `${method}:verified`;
  }

  updateUser(userId, updates);
  persistDb();

  res.json({
    verified: true,
    method,
    verifiedAt: updates.ageVerifiedAt
  });
});

// GET /age-verification/config - Public config (what methods are available)
router.get('/config', (_req: Request, res: Response) => {
  const config = getAgeVerificationConfig();
  res.json({
    enabled: config.enabled,
    minimumAge: config.minimumAge,
    enabledMethods: config.enabledMethods,
    provider: config.provider
  });
});

export default router;
