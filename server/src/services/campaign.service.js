const { prisma } = require('../lib/prisma');
const crypto = require('crypto');
const { AppError, ERROR_CODES } = require('../constants/errors');

class CampaignService {
  _getRequesterCampaignRole(campaign, userId) {
    if (!userId) return null;
    if (campaign.ownerId === userId) return 'OWNER';
    const member = campaign.members?.find(m => m.userId === userId);
    return member?.role ?? null;
  }

  _requireCampaignOwner(campaign, userId, message = 'Тільки власник може виконати цю дію') {
    if (!userId || campaign.ownerId !== userId) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, message);
    }
  }

  _requireCampaignRoles(campaign, userId, allowedRoles, message = 'У вас немає прав для виконання цієї дії') {
    const role = this._getRequesterCampaignRole(campaign, userId);
    if (!role || !allowedRoles.includes(role)) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, message);
    }
    return role;
  }

  
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
    // 1. Отримуємо кампанію з бази
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
        // Заявки потрібні тільки власнику, але поки тягнемо (почистимо нижче)
        joinRequests: {
          where: { status: 'PENDING' },
          select: { id: true },
        },
      },
    });

    if (!campaign) {
      throw new AppError('CAMPAIGN_NOT_FOUND', 'Кампанія не знайдена');
    }

    // 2. Визначаємо роль поточного користувача
    let isOwner = false;
    let isMember = false;

    if (userId) {
      isOwner = campaign.ownerId === userId;
      // Перевіряємо масив members, який ми вже дістали
      isMember = campaign.members.some(m => m.userId === userId);
    }

    // 3. ПЕРЕВІРКА ДОСТУПУ (Security Check)
    // Якщо Private -> вимагаємо бути учасником або власником.
    // Якщо userId немає (анонім) і кампанія Private -> Access Denied.
    if (campaign.visibility === 'PRIVATE') {
      if (!userId || (!isOwner && !isMember)) {
        throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'У вас немає доступу до цієї кампанії');
      }
    }

    // 4. ОЧИЩЕННЯ ДАНИХ (Sanitization)
    // Заявки та invite код бачать тільки OWNER та GM (для запрошення гравців)
    const requesterRole = this._getRequesterCampaignRole(campaign, userId);
    const canSeeAdminData = requesterRole === 'OWNER' || requesterRole === 'GM';
    
    if (!canSeeAdminData) {
      // Заявки на вступ бачать тільки OWNER та GM
      delete campaign.joinRequests;
      
      // Invite код бачать тільки OWNER та GM (для запрошення гравців)
      delete campaign.inviteCode;
    }

    return campaign;
  }
  async updateCampaign(campaignId, userId, updateData) {
    const campaign = await this.getCampaignById(campaignId, userId);

    this._requireCampaignOwner(campaign, userId, 'Тільки власник може оновлювати кампанію');

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

    this._requireCampaignOwner(campaign, userId, 'Тільки власник може видаляти кампанію');

    // Каскадне видалення: members, sessions, participants видаляються автоматично
    await prisma.campaign.delete({
      where: { id: parseInt(campaignId) },
    });
  }

  // === Учасники ===

  async getCampaignMembers(campaignId, userId) {
    const id = parseInt(campaignId);

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, visibility: true, ownerId: true }
    });

    if (!campaign) {
      throw new AppError('CAMPAIGN_NOT_FOUND', 'Кампанія не знайдена');
    }

    // 1. Визначаємо роль того, хто запитує
    let isOwner = false;
    let requesterRole = null;

    if (userId) {
      isOwner = campaign.ownerId === userId;
      
      // Шукаємо запис про членство
      const memberRecord = await prisma.campaignMember.findUnique({
        where: {
          userId_campaignId: { userId, campaignId: id }
        },
        select: { role: true }
      });
      
      if (memberRecord) {
        requesterRole = memberRecord.role;
      }
    }

    // 2. Перевірка доступу (Private Check)
    const isMember = requesterRole !== null;
    if (campaign.visibility !== 'PUBLIC' && !isOwner && !isMember) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'У вас немає доступу до перегляду учасників');
    }

    // 3. Логіка видимості Email
    // Email бачить тільки Власник (OWNER) або Майстер (GM)
    const canSeeSensitiveData = isOwner || (requesterRole === 'GM') || (requesterRole === 'OWNER');

    // 4. Отримуємо список
    const members = await prisma.campaignMember.findMany({
      where: { campaignId: id },
      include: {
        user: {
          select: { 
            id: true, 
            username: true, 
            displayName: true, 
            avatarUrl: true,
            // Якщо canSeeSensitiveData === true, повернемо email, інакше undefined
            email: canSeeSensitiveData, 
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return members;
  }

  async addMemberToCampaign(campaignId, userId, newMemberId, role = 'PLAYER') {
    const campaign = await this.getCampaignById(campaignId, userId);

    this._requireCampaignRoles(
      campaign,
      userId,
      ['OWNER', 'GM'],
      'Ви не маєте права додавати учасників'
    );

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

    this._requireCampaignRoles(
      campaign,
      userId,
      ['OWNER', 'GM'],
      'Ви не маєте права видаляти учасників'
    );

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

    this._requireCampaignOwner(campaign, userId, 'Тільки власник може змінювати ролі учасників');

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

    this._requireCampaignOwner(campaign, userId, 'Тільки власник може регенерувати код');

    if (campaign.visibility === 'PRIVATE') {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Приватні кампанії не використовують invite-коди');
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
      select: { id: true, visibility: true, title: true, ownerId: true },
    });

    if (!campaign) {
      throw new AppError('INVITE_CODE_INVALID', 'Невірний invite код');
    }

    // 1. ПЕРЕВІРКА ВИДИМОСТІ
    // За кодом можна зайти тільки в LINK_ONLY (це їх суть) або PUBLIC (як швидкий вхід).
    // У PRIVATE кампанії вхід тільки через Join Request або ручне додавання ГМом.
    if (!['LINK_ONLY', 'PUBLIC'].includes(campaign.visibility)) {
      throw new AppError(
        ERROR_CODES.SECURITY_ACCESS_DENIED, 
        'Ця кампанія є приватною. Вступ можливий тільки через подачу заявки або запрошення власника.'
      );
    }

    // 2. Перевіряємо, чи користувач вже є учасником
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

    // 3. Додаємо учасника
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
    const id = parseInt(campaignId);

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, visibility: true, ownerId: true },
    });

    if (!campaign) {
      throw new AppError('CAMPAIGN_NOT_FOUND', 'Кампанія не знайдена');
    }

    // 1. Перевіряємо, чи користувач вже є учасником
    const existingMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: id,
        },
      },
    });

    if (existingMember) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Ви вже член цієї кампанії');
    }

    // Якщо публічна кампанія, одразу додаємо (заявка не потрібна)
    if (campaign.visibility === 'PUBLIC') {
      return this.addMemberToCampaign(campaignId, campaign.ownerId, userId, 'PLAYER');
    }

    // 2. Перевіряємо наявність будь-якої заявки (незалежно від статусу)
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: id,
        },
      },
    });

    if (existingRequest) {
      // Якщо заявка вже висить у черзі
      if (existingRequest.status === 'PENDING') {
        throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Ви вже подали заявку на цю кампанію');
      }

      // ВИПРАВЛЕНО: Якщо заявка була REJECTED або APPROVED (але юзер вийшов),
      // ми оновлюємо стару заявку замість створення нової, щоб уникнути конфлікту unique constraint.
      return prisma.joinRequest.update({
        where: { id: existingRequest.id },
        data: {
          status: 'PENDING',
          message: message,      // Оновлюємо повідомлення
          reviewedAt: null,      // Скидаємо час розгляду
          reviewedBy: null,      // Скидаємо рецензента
          createdAt: new Date()  // Оновлюємо дату створення, щоб заявка піднялася вгору списку
        },
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      });
    }

    // 3. Якщо заявки не існує — створюємо нову
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId,
        campaignId: id,
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

    this._requireCampaignRoles(
      campaign,
      userId,
      ['OWNER', 'GM'],
      'Ви не маєте права переглядати заявки'
    );

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

    this._requireCampaignRoles(
      campaign,
      userId,
      ['OWNER', 'GM'],
      'Ви не маєте права схвалювати заявки'
    );

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

    this._requireCampaignRoles(
      campaign,
      userId,
      ['OWNER', 'GM'],
      'Ви не маєте права відхиляти заявки'
    );

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