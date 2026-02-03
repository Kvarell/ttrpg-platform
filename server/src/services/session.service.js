const { prisma } = require('../lib/prisma');
const { AppError, ERROR_CODES } = require('../constants/errors');

/**
 * SessionService — сервіс для управління сесіями (грами)
 * 
 * Відповідає за:
 * - CRUD операції над сесіями
 * - Управління учасниками сесій
 * - Календар агрегацію
 * - Перевірку прав доступу
 */
class SessionService {
  _requireSessionCreator(session, userId, message = 'Тільки GM може виконати цю дію') {
    if (session.creatorId !== userId) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, message);
    }
  }

  // ============== CRUD Сесії ==============

  /**
   * Створити нову сесію
   */
  async createSession(data) {
    const {
      title,
      description,
      date,
      duration,
      maxPlayers,
      price,
      campaignId,
      creatorId,
      visibility,
    } = data;

    // Якщо сесія в межах кампанії - перевіряємо права
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: parseInt(campaignId) },
        include: {
          members: {
            where: { userId: creatorId },
            select: { role: true },
          },
        },
      });

      if (!campaign) {
        throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Кампанія не знайдена');
      }

      // Тільки OWNER та GM можуть створювати сесії в кампанії
      const memberRole = campaign.members[0]?.role;
      if (!memberRole || !['OWNER', 'GM'].includes(memberRole)) {
        throw new AppError(
          ERROR_CODES.SECURITY_ACCESS_DENIED,
          'Ви не маєте права створювати сесії в цій кампанії'
        );
      }
    }

    const session = await prisma.session.create({
      data: {
        title,
        description: description || null,
        date,
        duration,
        maxPlayers,
        price,
        campaignId: campaignId ? parseInt(campaignId) : null,
        creatorId,
        visibility,
        // Автоматично додаємо GM як учасника
        participants: {
          create: {
            userId: creatorId,
            role: 'GM',
            status: 'CONFIRMED',
            isGuest: false,
          },
        },
      },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        campaign: {
          select: { id: true, title: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return session;
  }

  /**
   * Отримати мої сесії (як GM або як гравець)
   */
  async getMySessions(userId, options = {}) {
    const { status, role = 'ALL', limit = 20, offset = 0 } = options;

    const whereCondition = {
      participants: {
        some: {
          userId,
        },
      },
    };

    // Фільтр по статусу
    if (status) {
      whereCondition.status = status;
    }

    // Якщо потрібна певна роль
    if (role !== 'ALL') {
      whereCondition.participants = {
        some: {
          userId,
          role,
        },
      };
    }

    const sessions = await prisma.session.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        campaign: {
          select: { id: true, title: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
      skip: offset,
      take: limit,
    });

    return sessions;
  }

  /**
   * Отримати календар (агрегація сесій по датам)
   */
  async getCalendar(userId, options = {}) {
    const { year, month, type = 'MY' } = options;

    // Використовуємо UTC для коректної роботи з датами незалежно від timezone сервера
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    // Останній день місяця: new Date(year, month, 0) дає останній день попереднього місяця
    const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endDate = new Date(Date.UTC(year, month - 1, lastDayOfMonth, 23, 59, 59, 999));

    // Базова умова - діапазон дат
    const whereCondition = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // БЕЗПЕЧНА ПОБУДОВА ФІЛЬТРУ  
    if (type === 'MY') {
      // Якщо просять "МОЇ", але ID немає -> це помилка доступу (або пустий список)
      if (!userId) {
         throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING, 'Необхідна авторизація для перегляду особистого календаря');
      }
      whereCondition.participants = { some: { userId } };
    } 
    else if (type === 'PUBLIC') {
      whereCondition.visibility = { in: ['PUBLIC', 'LINK_ONLY'] };
    } 
    else if (type === 'ALL') {
      // Якщо ALL: показуємо (Публічні) АБО (Мої приватні)
      if (userId) {
        whereCondition.OR = [
          { visibility: { in: ['PUBLIC', 'LINK_ONLY'] } },
          { participants: { some: { userId } } }
        ];
      } else {
        // Якщо не авторизований - ALL перетворюється на PUBLIC
        whereCondition.visibility = { in: ['PUBLIC', 'LINK_ONLY'] };
      }
    }

    const sessions = await prisma.session.findMany({
      where: whereCondition,
      select: {
        id: true,
        date: true,
      },
    });

    const calendar = {};
    sessions.forEach(session => {
      const dateKey = session.date.toISOString().split('T')[0];
      calendar[dateKey] = (calendar[dateKey] || 0) + 1;
    });

    return calendar;
  }
  /**
   * Отримати деталі сесії
   */
  /**
   * Отримати деталі сесії
   */
  async getSessionById(sessionId, userId = null) {
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        campaign: {
          // Додаємо visibility, щоб розуміти контекст кампанії, якщо треба
          select: { id: true, title: true, visibility: true, ownerId: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { role: 'asc' },
        },
      },
    });

    if (!session) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Сесія не знайдена');
    }

    // 1. ПЕРЕВІРКА ДОСТУПУ (Security Check)
    
    // Якщо сесія ПРИВАТНА (PRIVATE)
    if (session.visibility === 'PRIVATE') {
      // Аноніми -> Access Denied (раніше тут була дірка)
      if (!userId) {
        throw new AppError(
          ERROR_CODES.SECURITY_ACCESS_DENIED,
          'У вас немає доступу до цієї сесії'
        );
      }

      // Перевіряємо права: тільки Учасник або ГМ (creator)
      const isParticipant = session.participants.some(p => p.userId === userId);
      const isCreator = session.creatorId === userId;

      // Можна також додати перевірку: якщо це сесія кампанії, то власник кампанії теж має доступ
      // const isCampaignOwner = session.campaign?.ownerId === userId;

      if (!isParticipant && !isCreator) {
        throw new AppError(
          ERROR_CODES.SECURITY_ACCESS_DENIED,
          'У вас немає доступу до цієї сесії'
        );
      }
    }

    // 2. САНІТИЗАЦІЯ ДАНИХ (Data Trimming)
    // Для PUBLIC/LINK_ONLY сесій, якщо дивиться анонім або не учасник
    
    // Якщо в майбутньому в моделі Session з'являться поля типу "gmNotes" (нотатки майстра)
    // або "hiddenLoot" (прихована нагорода), їх треба видаляти тут.
    
    /* const isGM = userId && session.creatorId === userId;
    if (!isGM) {
       delete session.gmNotes;
       delete session.hiddenLoot;
    }
    */

    return session;
  }

  /**
   * Оновити сесію (тільки для GM/creator)
   */
  async updateSession(sessionId, creatorId, updateData) {
    const session = await this.getSessionById(sessionId, creatorId);

    this._requireSessionCreator(session, creatorId, 'Тільки GM може оновлювати сесію');

    const updated = await prisma.session.update({
      where: { id: parseInt(sessionId) },
      data: {
        title: updateData.title || undefined,
        description: updateData.description || undefined,
        date: updateData.date || undefined,
        duration: updateData.duration || undefined,
        maxPlayers: updateData.maxPlayers || undefined,
        price: updateData.price || undefined,
        visibility: updateData.visibility || undefined,
        status: updateData.status || undefined,
      },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        campaign: {
          select: { id: true, title: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return updated;
  }

  /**
   * Видалити сесію (тільки для GM/creator)
   * 
   * Каскадно видаляються:
   * - SessionParticipant записи
   * - ChatMessage записи (якщо будуть)
   */
  async deleteSession(sessionId, creatorId) {
    const session = await this.getSessionById(sessionId, creatorId);

    this._requireSessionCreator(session, creatorId, 'Тільки GM може видаляти сесію');

    await prisma.session.delete({
      where: { id: parseInt(sessionId) },
    });
  }

  // ============== Управління учасниками ==============

  /**
   * Приєднатися до сесії
   */
  async joinSession(sessionId, userId, isGuest = false) {
    const session = await this.getSessionById(sessionId, userId);

    // --- TIME & STATUS GUARDS ---
    
    // 1. Не можна приєднатися до скасованої або завершеної гри
    if (session.status !== 'PLANNED') {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Не можна приєднатися до сесії зі статусом ${session.status}`
      );
    }

    // 2. Не можна приєднатися до гри, що вже почалася або пройшла
    if (new Date(session.date) < new Date()) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Не можна приєднатися до сесії, яка вже минула'
      );
    }

    // ----------------------------

    // Перевіряємо максимум гравців (не рахуємо GM)
    const playerCount = session.participants.filter(p => p.role === 'PLAYER').length;
    if (playerCount >= session.maxPlayers) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Місць у сесії більше немає');
    }

    const existingParticipant = await prisma.sessionParticipant.findUnique({
      where: {
        userId_sessionId: { userId, sessionId: parseInt(sessionId) },
      },
    });

    if (existingParticipant) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Ви вже приєднані до цієї сесії');
    }

    let status = 'PENDING';
    if (session.visibility === 'PUBLIC' || session.visibility === 'LINK_ONLY') {
      // Для спрощення MVP: публічні ігри одразу дають CONFIRMED, або логіку можна змінити
      status = 'CONFIRMED'; 
    }

    const participant = await prisma.sessionParticipant.create({
      data: {
        userId,
        sessionId: parseInt(sessionId),
        role: 'PLAYER',
        status,
        isGuest,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    return participant;
  }
  /**
   * Вийти з сесії
   */
  async leaveSession(sessionId, userId) {
    // Спочатку перевіряємо саму сесію і статус
    const participant = await prisma.sessionParticipant.findUnique({
      where: {
        userId_sessionId: { userId, sessionId: parseInt(sessionId) },
      },
      include: {
        session: {
          select: { 
            creatorId: true,
            status: true, 
            date: true 
          },
        },
      },
    });

    if (!participant) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Ви не є учасником цієї сесії');
    }

    // --- TIME & STATUS GUARDS ---

    // Не можна вийти з гри, яка вже завершилася (це історія)
    if (['FINISHED', 'CANCELED'].includes(participant.session.status)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Не можна вийти з завершеної або скасованої сесії'
      );
    }
    
    // Опціонально: заборонити вихід, якщо гра вже почалася, але ще не FINISHED (статус ACTIVE)
    if (participant.session.status === 'ACTIVE') {
       throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Гра вже триває, вихід неможливий'
      );
    }

    // ----------------------------

    if (participant.role === 'GM' && participant.session.creatorId === userId) {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'GM не може вийти з власної сесії');
    }

    await prisma.sessionParticipant.delete({
      where: {
        userId_sessionId: { userId, sessionId: parseInt(sessionId) },
      },
    });
  }

  /**
   * Отримати всіх учасників сесії
   */
  async getSessionParticipants(sessionId, userId = null) {
    const session = await this.getSessionById(sessionId, userId);

    return session.participants;
  }

  /**
   * Оновити статус учасника (тільки для GM)
   * 
   * Статуси: PENDING | CONFIRMED | DECLINED | ATTENDED | NO_SHOW
   */
  async updateParticipantStatus(sessionId, participantId, creatorId, status) {
    const session = await this.getSessionById(sessionId, creatorId);

    this._requireSessionCreator(session, creatorId, 'Тільки GM може змінювати статус учасників');

    const validStatuses = ['PENDING', 'CONFIRMED', 'DECLINED', 'ATTENDED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Невалідний статус учасника');
    }

    // --- LOGIC GUARDS ---

    const isSessionFinished = session.status === 'FINISHED';
    const isStatusResult = ['ATTENDED', 'NO_SHOW'].includes(status);
    const isStatusPlanned = ['PENDING', 'CONFIRMED'].includes(status);

    // 1. Якщо сесія завершена, можна ставити тільки "Результат" (Був/Не був/Відмовився)
    // Не можна повертати в PENDING/CONFIRMED
    if (isSessionFinished && isStatusPlanned) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Завершеній сесії не можна встановити статус PENDING або CONFIRMED'
      );
    }

    // 2. Якщо сесія НЕ завершена (PLANNED/ACTIVE), не можна ставити "Результат"
    // Не можна сказати, що гравець "Відвідав" гру, яка ще не закінчилася
    if (!isSessionFinished && isStatusResult) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Не можна відмітити відвідування для незавершеної сесії'
      );
    }

    // --------------------

    const participant = await prisma.sessionParticipant.findUnique({
      where: { id: parseInt(participantId) },
    });

    if (!participant || participant.sessionId !== parseInt(sessionId)) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Учасник не знайдений');
    }

    const updated = await prisma.sessionParticipant.update({
      where: { id: parseInt(participantId) },
      data: { status },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    return updated;
  }

  /**
   * Видалити учасника з сесії (тільки для GM)
   */
  async removeParticipant(sessionId, participantId, creatorId) {
    const session = await this.getSessionById(sessionId, creatorId);

    this._requireSessionCreator(session, creatorId, 'Тільки GM може видаляти учасників');

    // --- GUARD ---
    // Якщо гра закінчилася, видаляти учасника не можна — це фальсифікація історії.
    // Замість видалення ГМ має поставити статус NO_SHOW або DECLINED.
    if (['FINISHED', 'CANCELED'].includes(session.status)) {
       throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Не можна видаляти учасників із завершеної сесії'
      );
    }
    // -------------

    const participant = await prisma.sessionParticipant.findUnique({
      where: { id: parseInt(participantId) },
    });

    if (!participant || participant.sessionId !== parseInt(sessionId)) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Учасник не знайдений');
    }

    if (participant.role === 'GM') {
      throw new AppError(ERROR_CODES.SECURITY_ACCESS_DENIED, 'Не можна видаляти GM з сесії');
    }

    await prisma.sessionParticipant.delete({
      where: { id: parseInt(participantId) },
    });
  }

  // ============== Утилітарні методи ==============

  /**
   * Отримати сесії конкретного дня
   */
  async getSessionsByDay(userId, dateString, type = 'MY') {
    // Парсимо дату з формату YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    // Використовуємо UTC для коректної роботи незалежно від timezone
    const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const whereCondition = {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    };

    // Та сама безпечна логіка
    if (type === 'MY') {
      if (!userId) {
         throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING, 'Необхідна авторизація');
      }
      whereCondition.participants = { some: { userId } };
    } 
    else if (type === 'PUBLIC') {
      whereCondition.visibility = { in: ['PUBLIC', 'LINK_ONLY'] };
    } 
    else if (type === 'ALL') {
      if (userId) {
        whereCondition.OR = [
          { visibility: { in: ['PUBLIC', 'LINK_ONLY'] } },
          { participants: { some: { userId } } }
        ];
      } else {
        whereCondition.visibility = { in: ['PUBLIC', 'LINK_ONLY'] };
      }
    }

    const sessions = await prisma.session.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        campaign: {
          select: { id: true, title: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return sessions;
  }
  /**
   * Отримати сесії по кампанії
   */
  async getCampaignSessions(campaignId, userId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    // Перевіряємо доступ до кампанії
    const campaign = await prisma.campaign.findUnique({
      where: { id: parseInt(campaignId) },
      include: {
        members: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (!campaign) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, 'Кампанія не знайдена');
    }

    // Тільки члени кампанії мають доступ
    if (!campaign.members.length && campaign.ownerId !== userId) {
      throw new AppError(
        ERROR_CODES.SECURITY_ACCESS_DENIED,
        'У вас немає доступу до цієї кампанії'
      );
    }

    const sessions = await prisma.session.findMany({
      where: { campaignId: parseInt(campaignId) },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
      skip: offset,
      take: limit,
    });

    return sessions;
  }

  /**
   * Скасувати сесію (Soft Delete)
   */
  async cancelSession(sessionId, userId) {
    const session = await this.getSessionById(sessionId, userId);

    // 1. Перевірка прав (тільки GM)
    this._requireSessionCreator(session, userId, 'Тільки GM може скасувати сесію');

    // 2. Перевірка стану
    // Не можна скасувати гру, яка вже закінчилася
    if (session.status === 'FINISHED') {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Не можна скасувати вже завершену сесію'
      );
    }

    if (session.status === 'CANCELED') {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Сесія вже скасована'
      );
    }

    // 3. Оновлення статусу
    const updatedSession = await prisma.session.update({
      where: { id: parseInt(sessionId) },
      data: {
        status: 'CANCELED',
        // Опціонально: можна додати поле canceledAt або canceledReason у схему в майбутньому
      },
      include: {
        creator: { select: { id: true, username: true } },
        participants: {
          include: {
            user: { select: { id: true, email: true, username: true } }
          }
        }
      }
    });

    // TODO: Тут можна викликати notificationService.notifyParticipants(updatedSession, 'Session Canceled');
    // TODO: Якщо session.price > 0, тут викликати walletService.refundParticipants(...);

    return updatedSession;
  }
  
}

module.exports = new SessionService();
