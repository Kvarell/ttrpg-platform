/**
 * @fileoverview Канонічна модель профілю.
 *
 * Усі компоненти та хуки, що працюють із профілем публічного гравця,
 * очікують цю форму. При додаванні нового поля — оновлюйте тут
 * і в ProfilePublicCard, а не в кожному компоненті окремо.
 */

/**
 * @typedef {Object} ProfileStats
 * @property {number} sessionsPlayed — кількість зіграних сесій
 * @property {number} hoursPlayed   — загальна кількість годин
 */

/**
 * @typedef {Object} ProfileShape
 * @property {number}          id
 * @property {string}          username
 * @property {string|null}     displayName
 * @property {string|null}     avatarUrl
 * @property {string|null}     bio
 * @property {string|null}     timezone
 * @property {string|null}     language
 * @property {string|null}     city
 * @property {string|null}     preferredSystem  — улюблена система (D&D, PF2e, тощо)
 * @property {ProfileStats}    [stats]
 */

export {};
