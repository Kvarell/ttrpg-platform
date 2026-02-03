const { prisma } = require('../lib/prisma');
const crypto = require('crypto');
const { AppError, ERROR_CODES } = require('../constants/errors');

class CampaignService {
  
  // === CRUD ===

  async createCampaign(data) {
    const { title, description, imageUrl, system, visibility, ownerId } = data;

    // Генеруємо invite код для LINK_ONLY
    const inviteCode = visibility === 'LINK_ONLY' 
      ? crypto.randomBytes(8).toString('hex') 
      : null;

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        system: system || null,
        visibility,
        inviteCode,
        ownerId,
        // Додаємо власника як члена з роллю OWNER
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: {
          select: { id: true, username: true, displayName: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return campaign;
  }

  async getMyCampaigns(userId, role = 'all') {
    const whereCondition = {};

    if (role === 'owner') {
      whereCondition.ownerId = userId;
    } else if (role === 'member') {
      // Кампанії, де я учасник, але не власник
      whereCondition.members = {
        some: {
          userId,
          role: { not: 'OWNER' },
        },
      };
    } else {
      // all - кампанії, де я усім (власник або учасник)
      whereCondition.OR = [
        { ownerId: userId },
        { members: { some: { userId } } },
      ];
    }

    const campaigns = await prisma.campaign.findMany({
      where: whereCondition,
      include: {
        owner: {
          select: { id: true, username: true, displayName: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
        sessions: {
          select: { id: true, title: true, date: true, status: true },
          orderBy: { date: 'asc' },
          take: 5, // Останні 5 сесій
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns;
  }

  async getCampaignById(campaignId, userId = null) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(campaignId) },
      include: {
        owner: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { role: 'asc' },
        },
        sessions: {
          select: { id: true, title: true, date: true, status: true, maxPlayers: true },
          orderBy: { date: 'asc' },
        },
        joinRequests: {
          where: { status: 'PENDING' },
          select: { id: true },
        },
      },
    });

    if (!campaign) {
      throw new AppError('CAMPAIGN_NOT_FOUND', 'Кампанія не знайдена');
    }

    // Перевіряємо доступ до приватних кампаній
    if (campaign.visibility === 'PRIVATE' && userId) {
      const isMember = campaign.members.some(m => m.userId === userId);
      if (!isMember && campaign.ownerId !== userId) {
        throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'У вас немає доступу до цієї кампанії');
      }
    }

    return campaign;
  }

  async updateCampaign(campaignId, userId, updateData) {
    const campaign = await this.getCampaignById(campaignId, userId);

    // Тільки власник може оновлювати
    if (campaign.ownerId !== userId) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Тільки власник може оновлювати кампанію');
    }

    const updated = await prisma.campaign.update({
      where: { id: parseInt(campaignId) },
      data: {
        title: updateData.title || undefined,
        description: updateData.description || undefined,
        imageUrl: updateData.imageUrl || undefined,
        system: updateData.system || undefined,
        visibility: updateData.visibility || undefined,
        // Якщо змінюємо видимість на LINK_ONLY, генеруємо код
        ...(updateData.visibility === 'LINK_ONLY' && { 
          inviteCode: crypto.randomBytes(8).toString('hex') 
        }),
      },
      include: {
        owner: {
          select: { id: true, username: true, displayName: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true },
            },
          },
        },
      },
    });

    return updated;
  }

  async deleteCampaign(campaignId, userId) {
    const campaign = await this.getCampaignById(campaignId, userId);

    // Тільки власник може видаляти
    if (campaign.ownerId !== userId) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Тільки власник може видаляти кампанію');
    }

    // Каскадне видалення: members, sessions, participants видаляються автоматично
    await prisma.campaign.delete({
      where: { id: parseInt(campaignId) },
    });
  }

  // === Учасники ===

  async getCampaignMembers(campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(campaignId) },
      select: {
        members: {
          include: {
            user: {
              select: { 
                id: true, 
                username: true, 
                displayName: true, 
                avatarUrl: true,
                email: true,
              },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
      },
    });

    if (!campaign) {
      throw new AppError('CAMPAIGN_NOT_FOUND', 'Кампанія не знайдена');
    }

    return campaign.members;
  }

  async addMemberToCampaign(campaignId, userId, newMemberId, role = 'PLAYER') {
    const campaign = await this.getCampaignById(campaignId, userId);

    // Тільки OWNER та GM можуть додавати учасників
    const requesterMember = campaign.members.find(m => m.userId === userId);
    if (!requesterMember || !['OWNER', 'GM'].includes(requesterMember.role)) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Ви не маєте права додавати учасників');
    }

    // Перевіряємо, чи не додаємо один раз
    const existingMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId: parseInt(newMemberId),
          campaignId: parseInt(campaignId),
        },
      },
    });

    if (existingMember) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Цей користувач вже член кампанії');
    }

    // Перевіряємо наявність користувача
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(newMemberId) },
    });

    if (!userExists) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'Користувач не знайдений');
    }

    const member = await prisma.campaignMember.create({
      data: {
        userId: parseInt(newMemberId),
        campaignId: parseInt(campaignId),
        role,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return member;
  }

  async removeMemberFromCampaign(campaignId, userId, memberId) {
    const campaign = await this.getCampaignById(campaignId, userId);

    // Тільки OWNER та GM можуть видаляти учасників (але не себе)
    const requesterMember = campaign.members.find(m => m.userId === userId);
    if (!requesterMember || !['OWNER', 'GM'].includes(requesterMember.role)) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Ви не маєте права видаляти учасників');
    }

    // OWNER не може видаляти себе таким чином (тільки видалити кампанію)
    if (campaign.ownerId === userId && parseInt(memberId) === userId) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'OWNER не може видаляти себе');
    }

    const member = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId: parseInt(memberId),
          campaignId: parseInt(campaignId),
        },
      },
    });

    if (!member) {
      throw new AppError('CAMPAIGN_MEMBER_NOT_FOUND', 'Учасник не знайдений');
    }

    await prisma.campaignMember.delete({
      where: {
        userId_campaignId: {
          userId: parseInt(memberId),
          campaignId: parseInt(campaignId),
        },
      },
    });
  }

  async updateMemberRole(campaignId, userId, memberId, newRole) {
    const campaign = await this.getCampaignById(campaignId, userId);

    // Тільки OWNER може змінювати ролі
    if (campaign.ownerId !== userId) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Тільки власник може змінювати ролі учасників');
    }

    // Валідуємо роль
    const validRoles = ['OWNER', 'GM', 'PLAYER'];
    if (!validRoles.includes(newRole)) {
      throw new AppError(ERROR_CODES.VALIDATION_INVALID_FORMAT, 'Невірна роль');
    }

    // Не можна змінювати OWNER на щось інше
    const targetMember = campaign.members.find(m => m.userId === parseInt(memberId));
    if (targetMember && targetMember.role === 'OWNER' && newRole !== 'OWNER') {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Не можна змінити роль власника');
    }

    const updated = await prisma.campaignMember.update({
      where: {
        userId_campaignId: {
          userId: parseInt(memberId),
          campaignId: parseInt(campaignId),
        },
      },
      data: { role: newRole },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return updated;
  }

  // === Invite Коди ===

  async regenerateInviteCode(campaignId, userId) {
    const campaign = await this.getCampaignById(campaignId, userId);

    // Тільки OWNER може регенерувати код
    if (campaign.ownerId !== userId) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Тільки власник може регенерувати код');
    }

    const newInviteCode = crypto.randomBytes(8).toString('hex');

    const updated = await prisma.campaign.update({
      where: { id: parseInt(campaignId) },
      data: { inviteCode: newInviteCode },
    });

    return updated;
  }

  async joinByInviteCode(inviteCode, userId) {
    const campaign = await prisma.campaign.findUnique({
      where: { inviteCode },
      select: { id: true, visibility: true, title: true },
    });

    if (!campaign) {
      throw new AppError('INVITE_CODE_INVALID', 'Невірний invite код');
    }

    // Перевіряємо, чи не medlem уже
    const existingMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: campaign.id,
        },
      },
    });

    if (existingMember) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Ви вже член цієї кампанії');
    }

    const member = await prisma.campaignMember.create({
      data: {
        userId,
        campaignId: campaign.id,
        role: 'PLAYER',
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return member;
  }

  // === Заявки на вступ ===

  async submitJoinRequest(campaignId, userId, message = null) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(campaignId) },
      select: { id: true, visibility: true, ownerId: true },
    });

    if (!campaign) {
      throw new AppError('CAMPAIGN_NOT_FOUND', 'Кампанія не знайдена');
    }

    // Перевіряємо, чи не medlem уже
    const existingMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: parseInt(campaignId),
        },
      },
    });

    if (existingMember) {
      throw new ApiError(400, 'Ви вже член цієї кампанії');
    }

    // Перевіряємо, чи не є вже заявка
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: parseInt(campaignId),
        },
      },
    });

    if (existingRequest && existingRequest.status === 'PENDING') {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Ви вже подали заявку на цю кампанію');
    }

    // Якщо публічна кампанія, одразу додаємо
    if (campaign.visibility === 'PUBLIC') {
      return this.addMemberToCampaign(campaignId, campaign.ownerId, userId, 'PLAYER');
    }

    // Інакше створюємо заявку
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId,
        campaignId: parseInt(campaignId),
        message,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return joinRequest;
  }

  async getJoinRequests(campaignId, userId) {
    const campaign = await this.getCampaignById(campaignId, userId);

    // Тільки OWNER та GM можуть переглядати заявки
    const requesterMember = campaign.members.find(m => m.userId === userId);
    if (!requesterMember || !['OWNER', 'GM'].includes(requesterMember.role)) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Ви не маєте права переглядати заявки');
    }

    const joinRequests = await prisma.joinRequest.findMany({
      where: {
        campaignId: parseInt(campaignId),
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return joinRequests;
  }

  async approveJoinRequest(requestId, userId, role = 'PLAYER') {
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: parseInt(requestId) },
      select: { campaignId: true, userId: true, status: true },
    });

    if (!joinRequest) {
      throw new AppError('JOIN_REQUEST_NOT_FOUND', 'Заявка не знайдена');
    }

    if (joinRequest.status !== 'PENDING') {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Заявка вже оброблена');
    }

    const campaign = await this.getCampaignById(joinRequest.campaignId, userId);

    // Тільки OWNER та GM можуть схвалювати
    const requesterMember = campaign.members.find(m => m.userId === userId);
    if (!requesterMember || !['OWNER', 'GM'].includes(requesterMember.role)) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Ви не маєте права схвалювати заявки');
    }

    // Оновлюємо заявку
    await prisma.joinRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });

    // Додаємо як члена
    const member = await prisma.campaignMember.create({
      data: {
        userId: joinRequest.userId,
        campaignId: joinRequest.campaignId,
        role,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return member;
  }

  async rejectJoinRequest(requestId, userId) {
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: parseInt(requestId) },
      select: { campaignId: true, status: true },
    });

    if (!joinRequest) {
      throw new AppError('JOIN_REQUEST_NOT_FOUND', 'Заявка не знайдена');
    }

    if (joinRequest.status !== 'PENDING') {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Заявка вже оброблена');
    }

    const campaign = await this.getCampaignById(joinRequest.campaignId, userId);

    // Тільки OWNER та GM можуть відхиляти
    const requesterMember = campaign.members.find(m => m.userId === userId);
    if (!requesterMember || !['OWNER', 'GM'].includes(requesterMember.role)) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Ви не маєте права відхиляти заявки');
    }

    await prisma.joinRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: userId,
      },
    });
  }
}

module.exports = new CampaignService();