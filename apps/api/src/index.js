import express from 'express';
import { createHealthCheck } from '@circulos/shared';
import { createUserService } from './users.cjs';
import { createCaregiverProfileService } from './caregiver-profiles.cjs';
import { createCircleService } from './circles.cjs';
import { createCircleMemberService } from './circle-members.cjs';
import { createFacilitatorService } from './facilitators.cjs';
import { createAuthService, requireAuth } from './auth.cjs';
import { createOAuthService } from './oauth.cjs';

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

app.use(express.json());

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

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
