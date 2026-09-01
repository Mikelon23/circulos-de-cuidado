import express from 'express';
import { createHealthCheck } from '@circulos/shared';
import { createUserService } from './users.cjs';
import { createCaregiverProfileService } from './caregiver-profiles.cjs';
import { createCircleService } from './circles.cjs';
import { createCircleMemberService } from './circle-members.cjs';
import { createFacilitatorService } from './facilitators.cjs';
import { createAuthService, requireAuth } from './auth.cjs';
import { createOAuthService } from './oauth.cjs';
import { generateCircles } from './matching.cjs';
import { createWaitingQueueService } from './waiting-queue.cjs';
import {
  createCorsMiddleware,
  createInputSanitizationMiddleware,
  createRateLimitMiddleware,
} from './security.cjs';

const app = express();
const port = process.env.PORT || 3000;
let userService;
const authService = createAuthService({
  findUserById: (id) => userService?.getUserById(id),
});
userService = createUserService({ authService });
const oauthService = createOAuthService({ userService, authService });
const caregiverProfileService = createCaregiverProfileService();
const circleService = createCircleService();
const circleMemberService = createCircleMemberService();
const facilitatorService = createFacilitatorService();
const waitingQueueService = createWaitingQueueService();

app.use(createCorsMiddleware());
app.use(createRateLimitMiddleware());
app.use(express.json({ limit: '100kb' }));
app.use(createInputSanitizationMiddleware());

app.get('/health', (_req, res) => {
  res.json(createHealthCheck('api'));
});

app.post('/api/v1/users/register', (req, res) => {
  try {
    const created = userService.registerUser(req.body || {});
    res.status(201).json({ data: created });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/users/verify-email', (req, res) => {
  try {
    const verified = userService.verifyEmail(req.body?.token);
    res.json({ data: verified });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/users/forgot-password', (req, res) => {
  try {
    const result = userService.requestPasswordReset(req.body?.email);
    res.json({ data: { message: result.message } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/users/reset-password', (req, res) => {
  try {
    const user = userService.resetPassword(
      req.body?.token,
      req.body?.password,
      req.body?.passwordConfirmation ?? req.body?.confirmPassword
    );
    res.json({ data: { user } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/users/login', (req, res) => {
  try {
    const auth = userService.loginUser(req.body || {});
    res.json({ data: auth });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/v1/auth/refresh', (req, res) => {
  try {
    const tokens = authService.refreshTokens(req.body?.refreshToken);
    res.json({ data: tokens });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/v1/auth/:provider', (req, res) => {
  try {
    const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${port}`;
    const redirectUri = `${baseUrl}/api/v1/auth/${req.params.provider}/callback`;
    res.redirect(oauthService.begin(req.params.provider, redirectUri));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/auth/:provider/callback', async (req, res) => {
  try {
    const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${port}`;
    const redirectUri = `${baseUrl}/api/v1/auth/${req.params.provider}/callback`;
    const auth = await oauthService.complete(req.params.provider, {
      code: req.query.code,
      state: req.query.state,
      redirectUri,
    });
    const webUrl = process.env.WEB_PUBLIC_URL || 'http://localhost:5173';
    const frontendCallback = new URL('/oauth/callback', webUrl);
    frontendCallback.hash = new URLSearchParams({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    }).toString();
    res.redirect(frontendCallback.toString());
  } catch (error) {
    const webUrl = process.env.WEB_PUBLIC_URL || 'http://localhost:5173';
    const frontendCallback = new URL('/oauth/callback', webUrl);
    frontendCallback.searchParams.set('error', error.message);
    res.redirect(frontendCallback.toString());
  }
});

app.get('/api/v1/users/me', requireAuth(authService), (req, res) => {
  const user = userService.getUserById(req.auth.sub);

  if (!user) {
    return res.status(401).json({ error: 'El usuario no existe' });
  }

  return res.json({ data: user });
});

app.patch('/api/v1/users/me/profile', requireAuth(authService), (req, res) => {
  try {
    const profile = userService.updateUserProfile(req.auth.sub, req.body || {});
    return res.json({ data: profile });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/users', (_req, res) => {
  res.json({ data: userService.listUsers() });
});

app.post('/api/v1/caregiver-profiles', (req, res) => {
  try {
    const created = caregiverProfileService.createProfile(req.body || {});
    res.status(201).json({ data: created });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/caregiver-profiles', (_req, res) => {
  res.json({ data: caregiverProfileService.listProfiles() });
});

app.get('/api/v1/caregiver-profiles/:id', (req, res) => {
  try {
    const profile = caregiverProfileService.getProfile(req.params.id);
    res.json({ data: profile });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.patch('/api/v1/caregiver-profiles/:id', (req, res) => {
  try {
    const updated = caregiverProfileService.updateProfile(req.params.id, req.body || {});
    res.json({ data: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/v1/caregiver-profiles/:id', (req, res) => {
  try {
    const deleted = caregiverProfileService.deleteProfile(req.params.id);
    res.json({ data: deleted });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/v1/circles', (req, res) => {
  try {
    const created = circleService.createCircle(req.body || {});
    res.status(201).json({ data: created });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/circles', (_req, res) => {
  res.json({ data: circleService.listCircles() });
});

app.get('/api/v1/circles/:id', (req, res) => {
  try {
    const circle = circleService.getCircle(req.params.id);
    res.json({ data: circle });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.patch('/api/v1/circles/:id', (req, res) => {
  try {
    const updated = circleService.updateCircle(req.params.id, req.body || {});
    res.json({ data: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/v1/circles/:id', (req, res) => {
  try {
    const deleted = circleService.deleteCircle(req.params.id);
    res.json({ data: deleted });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/v1/circle-members', (req, res) => {
  try {
    const created = circleMemberService.createMember(req.body || {});
    res.status(201).json({ data: created });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/circle-members', (_req, res) => {
  res.json({ data: circleMemberService.listMembers() });
});

app.get('/api/v1/circle-members/:id', (req, res) => {
  try {
    const member = circleMemberService.getMember(req.params.id);
    res.json({ data: member });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.patch('/api/v1/circle-members/:id', (req, res) => {
  try {
    const updated = circleMemberService.updateMember(req.params.id, req.body || {});
    res.json({ data: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/v1/circle-members/:id', (req, res) => {
  try {
    const deleted = circleMemberService.deleteMember(req.params.id);
    res.json({ data: deleted });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/v1/facilitators', (req, res) => {
  try {
    const created = facilitatorService.createFacilitator(req.body || {});
    res.status(201).json({ data: created });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/facilitators', (_req, res) => {
  res.json({ data: facilitatorService.listFacilitators() });
});

app.get('/api/v1/facilitators/:id', (req, res) => {
  try {
    const facilitator = facilitatorService.getFacilitator(req.params.id);
    res.json({ data: facilitator });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.patch('/api/v1/facilitators/:id', (req, res) => {
  try {
    const updated = facilitatorService.updateFacilitator(req.params.id, req.body || {});
    res.json({ data: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/v1/facilitators/:id', (req, res) => {
  try {
    const deleted = facilitatorService.deleteFacilitator(req.params.id);
    res.json({ data: deleted });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/v1/matching/generate-circles', (req, res) => {
  try {
    const { candidates = [], config = {} } = req.body || {};

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        error: 'Se requiere un array de cuidadores candidatos (candidates)',
      });
    }

    const result = generateCircles(candidates, config);

    res.status(201).json({
      data: result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Waiting Queue endpoints
app.post('/api/v1/waiting-queue', (req, res) => {
  try {
    const entry = waitingQueueService.addToQueue(req.body || {});
    res.status(201).json({ data: entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/waiting-queue', (req, res) => {
  try {
    const options = {
      status: req.query.status,
      sortBy: req.query.sortBy || 'urgencia',
      order: req.query.order || 'desc',
    };
    const entries = waitingQueueService.listQueue(options);
    res.json({ data: entries });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/waiting-queue/stats', (_req, res) => {
  try {
    const stats = waitingQueueService.getQueueStats();
    res.json({ data: stats });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/v1/waiting-queue/:id', (req, res) => {
  try {
    const entry = waitingQueueService.getQueueEntry(req.params.id);
    res.json({ data: entry });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.patch('/api/v1/waiting-queue/:id', (req, res) => {
  try {
    const updated = waitingQueueService.updateQueueEntry(req.params.id, req.body || {});
    res.json({ data: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/v1/waiting-queue/:id', (req, res) => {
  try {
    const removed = waitingQueueService.removeFromQueue(req.params.id);
    res.json({ data: removed });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/api/v1/waiting-queue/process', (req, res) => {
  try {
    const { config = {} } = req.body || {};
    
    // Get next candidates ready for matching
    const nextLimit = req.body?.limit || 12;
    const candidates = waitingQueueService.getNextCandidatesForMatching(nextLimit);

    if (candidates.length < (config.minSize || 6)) {
      return res.json({
        data: {
          message: 'No hay suficientes candidatos para generar círculos',
          candidatesCount: candidates.length,
          requiredCount: config.minSize || 6,
          circlesGenerated: 0,
          circles: [],
          processed: [],
        },
      });
    }

    // Generate circles from candidates
    const result = generateCircles(
      candidates.map((c) => ({
        id: c.cuidadorId,
        ...c.perfilCuidador,
        urgencia: c.urgencia,
      })),
      config
    );

    // Mark processed candidates as offered
    const processedIds = result.circles
      .flatMap((c) => c.members)
      .map((m) => candidates.find((cand) => cand.cuidadorId === m.id)?.id)
      .filter(Boolean);

    if (processedIds.length > 0) {
      waitingQueueService.markAsOffered(processedIds);
    }

    res.status(201).json({
      data: {
        circlesGenerated: result.circles.length,
        circles: result.circles,
        processedCount: processedIds.length,
        waitlistCount: result.waitlist.length,
        metrics: result.metrics,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
