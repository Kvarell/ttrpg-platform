const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const campaignController = require('../controllers/campaign.controller');
const { 
  validateCreateCampaign,
  validateUpdateCampaign,
  validateCampaignId,
  validateAddMember,
  validateRemoveMember,
  validateUpdateMemberRole,
  validateJoinRequest,
  validateApproveJoinRequest,
  validateRejectJoinRequest,
  validateGetMyCampaigns,
  validateInviteCode,
} = require('../validation/campaign.validation');

// === Публічні маршути ===

// POST /api/campaigns/invite/:inviteCode - Приєднатися за кодом запрошення
router.post('/invite/:inviteCode', [authenticateToken, ...validateInviteCode], (req, res, next) => campaignController.joinByInviteCode(req, res, next));

// === Захищені маршути (потрібна аутентифікація) ===

// POST /api/campaigns - Створити нову кампанію
router.post('/', [authenticateToken, ...validateCreateCampaign], (req, res, next) => campaignController.createCampaign(req, res, next));

// GET /api/campaigns - Отримати мої кампанії
router.get('/', [authenticateToken, ...validateGetMyCampaigns], (req, res, next) => campaignController.getMyCampaigns(req, res, next));

// GET /api/campaigns/:campaignId - Отримати деталі кампанії
router.get('/:campaignId', [authenticateToken, ...validateCampaignId], (req, res, next) => campaignController.getCampaignById(req, res, next));

// PUT /api/campaigns/:campaignId - Оновити кампанію
router.put('/:campaignId', [authenticateToken, ...validateUpdateCampaign], (req, res, next) => campaignController.updateCampaign(req, res, next));

// DELETE /api/campaigns/:campaignId - Видалити кампанію
router.delete('/:campaignId', [authenticateToken, ...validateCampaignId], (req, res, next) => campaignController.deleteCampaign(req, res, next));

// === Члени кампанії ===

// GET /api/campaigns/:campaignId/members - Отримати членів кампанії
router.get('/:campaignId/members', [authenticateToken, ...validateCampaignId], (req, res, next) => campaignController.getCampaignMembers(req, res, next));

// POST /api/campaigns/:campaignId/members - Додати учасника до кампанії
router.post('/:campaignId/members', [authenticateToken, ...validateAddMember], (req, res, next) => campaignController.addMemberToCampaign(req, res, next));

// DELETE /api/campaigns/:campaignId/members/:memberId - Видалити учасника з кампанії
router.delete('/:campaignId/members/:memberId', [authenticateToken, ...validateRemoveMember], (req, res, next) => campaignController.removeMemberFromCampaign(req, res, next));

// PATCH /api/campaigns/:campaignId/members/:memberId - Оновити роль учасника
router.patch('/:campaignId/members/:memberId', [authenticateToken, ...validateUpdateMemberRole], (req, res, next) => campaignController.updateMemberRole(req, res, next));

// === Коди запрошень ===

// POST /api/campaigns/:campaignId/invite - Регенерувати код запрошення
router.post('/:campaignId/invite', [authenticateToken, ...validateCampaignId], (req, res, next) => campaignController.regenerateInviteCode(req, res, next));

// === Запити на приєднання ===

// POST /api/campaigns/:campaignId/requests - Надіслати запит на приєднання
router.post('/:campaignId/requests', [authenticateToken, ...validateJoinRequest], (req, res, next) => campaignController.submitJoinRequest(req, res, next));

// GET /api/campaigns/:campaignId/requests - Отримати запити на приєднання
router.get('/:campaignId/requests', [authenticateToken, ...validateCampaignId], (req, res, next) => campaignController.getJoinRequests(req, res, next));

// POST /api/campaigns/requests/:requestId/approve - Схвалити запит на приєднання
router.post('/requests/:requestId/approve', [authenticateToken, ...validateApproveJoinRequest], (req, res, next) => campaignController.approveJoinRequest(req, res, next));

// POST /api/campaigns/requests/:requestId/reject - Відхилити запит на приєднання
router.post('/requests/:requestId/reject', [authenticateToken, ...validateRejectJoinRequest], (req, res, next) => campaignController.rejectJoinRequest(req, res, next));

module.exports = router;
