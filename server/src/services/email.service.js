const nodemailer = require('nodemailer');

/**
 * Email сервіс для відправлення листів (ресет пароля, верифікація, тощо)
 * 
 * Підтримує дві конфігурації:
 * 1. Gmail (development) - через gmail app password
 * 2. SMTP сервер (production) - загальний SMTP
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Ініціалізація transporter на основі змінних оточення
   */
  initializeTransporter() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp'; 

    try {
      // 1. Обробка режиму 'disabled'
      if (emailProvider === 'disabled') {
        console.log('⚠️ Email Service: Режим відлагодження (відправка листів вимкнена)');
        return; // Transporter залишається null, це нормально для цього режиму
      }

      // 2. Ініціалізація реальних провайдерів
      if (emailProvider === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD,
          }
        });
        console.log('✅ Email Service: Gmail конфігурація активована');
      } else if (emailProvider === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        });
        console.log('✅ Email Service: SMTP конфігурація активована');
      } else {
        console.warn('⚠️ Email Service: Невідомий провайдер email');
      }

      // Тестування з'єднання
      if (this.transporter) {
        this.transporter.verify((error) => {
          if (error) console.error('⚠️ Email Service: Помилка з\'єднання:', error.message);
          else console.log('✅ Email Service: З\'єднання успішне');
        });
      }
    } catch (error) {
      console.error('❌ Email Service: Помилка ініціалізації:', error.message);
    }
  }
  /**
   * Відправити листа для ресету пароля
   * @param {string} email - Адреса електронної пошти користувача
   * @param {string} resetUrl - URL посилання для скидання пароля
   * @param {string} userName - Ім'я користувача (опціонально)
   */
 async sendPasswordResetEmail(email, resetUrl, userName = 'Користувач') {
    // === ВИПРАВЛЕННЯ ТУТ ===
    // Спочатку перевіряємо, чи ми в режимі 'disabled'
    if (process.env.EMAIL_PROVIDER === 'disabled') {
        console.log('==========================================');
        console.log('📧 MOCK EMAIL (Лист не відправлено, але згенеровано)');
        console.log(`To: ${email}`);
        console.log(`Subject: 🔐 Скидання пароля`);
        console.log(`Link: ${resetUrl}`);
        console.log('==========================================');
        return { success: true, message: 'Email (Mock) успішно емульовано' };
    }

    // Тепер перевіряємо transporter для реальної відправки
    if (!this.transporter) {
      console.warn('⚠️ Email Service: Transporter не ініціалізований');
      return {
        success: false,
        message: 'Email сервіс не налаштований'
      };
    }

    try {
      const mailOptions = {
        from: `"TTRPG Platform" <${process.env.EMAIL_FROM || 'noreply@ttrpg.local'}>`,
        to: email,
        subject: '🔐 Скидання пароля - TTRPG Platform',
        html: this.getPasswordResetEmailTemplate(resetUrl, userName),
        text: this.getPasswordResetEmailText(resetUrl, userName)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email надіслано: ${email} (Message ID: ${info.messageId})`);
      
      return { success: true, message: 'Email успішно надіслано', messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Помилка надсилання email до ${email}:`, error.message);
      return { success: false, message: 'Помилка при надсиланні email', error: error.message };
    }
  }

  /**
   * HTML шаблон для листа ресету пароля
   */
  getPasswordResetEmailTemplate(resetUrl, userName) {
    return `
      <!DOCTYPE html>
      <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 20px;
          }
          .content h2 {
            color: #333;
            margin-top: 0;
          }
          .content p {
            color: #666;
            line-height: 1.6;
            margin: 15px 0;
          }
          .button {
            display: inline-block;
            background-color: #667eea;
            color: white!important;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #5568d3;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 TTRPG Platform</h1>
            <p>Скидання пароля</p>
          </div>
          
          <div class="content">
            <h2>Привіт, ${userName}! 👋</h2>
            
            <p>Ми отримали запит на скидання пароля для вашого акаунту. Якщо це не ви, просто ігноруйте цей лист.</p>
            
            <p>Щоб встановити новий пароль, нажміть на кнопку нижче:</p>
            
            <center>
              <a href="${resetUrl}" class="button">Скинути пароль</a>
            </center>
            
            
            <div class="warning">
              <strong>⚠️ Важливо:</strong> Це посилання дійсне тільки 1 годину. Якщо ви не скидаєте пароль протягом цього часу, запросіть нове посилання.
            </div>
            
            <p><strong>Безпека вашого акаунту:</strong></p>
            <ul>
              <li>Ніколи не діліться цим посиланням з іншими</li>
              <li>TTRPG Staff ніколи не буде просити вас клікати на подібні посилання</li>
              <li>Переконайтеся, що ви на сайті ttrpg.local перед введенням пароля</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>© 2026 TTRPG Platform. Всі права захищені.</p>
            <p>
              Цей лист був надісланий автоматично. Будь ласка, не відповідайте на нього.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Текстовий варіант листа для клієнтів без HTML підтримки
   */
  getPasswordResetEmailText(resetUrl, userName) {
    return `
Привіт, ${userName}!

Ми отримали запит на скидання пароля для вашого акаунту. Якщо це не ви, просто ігноруйте цей лист.

Щоб встановити новий пароль, перейдіть за цим посиланням:
${resetUrl}

⚠️ ВАЖЛИВО: Це посилання дійсне тільки 1 годину.

Безпека вашого акаунту:
- Ніколи не діліться цим посиланням з іншими
- TTRPG Staff ніколи не буде просити вас клікати на подібні посилання
- Переконайтеся, що ви на сайті ttrpg.local перед введенням пароля

---
© 2026 TTRPG Platform. Всі права захищені.
Цей лист був надісланий автоматично. Будь ласка, не відповідайте на нього.
    `;
  }

  /**
   * Відправити листа для верифікації email (для майбутнього використання)
   */
  async sendEmailVerificationEmail(email, verificationUrl, userName = 'Користувач') {
    if (process.env.EMAIL_PROVIDER === 'disabled') {
        console.log('==========================================');
        console.log('📧 MOCK EMAIL (Верифікація)');
        console.log(`Link: ${verificationUrl}`);
        console.log('==========================================');
        return { success: true, message: 'Email (Mock) успішно емульовано' };
    }

    if (!this.transporter) {
      return { success: false, message: 'Email сервіс не налаштований' };
    }

    try {
      const mailOptions = {
        from: `"TTRPG Platform" <${process.env.EMAIL_FROM || 'noreply@ttrpg.local'}>`,
        to: email,
        subject: '✅ Підтвердіть вашу email адресу - TTRPG Platform',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px;">
              <h2>Привіт, ${userName}! 👋</h2>
              <p>Дякуємо за реєстрацію на TTRPG Platform!</p>
              <p>Щоб активувати ваш акаунт, підтвердіть вашу email адресу:</p>
              <a href="${verificationUrl}" style="display: inline-block; background-color: #667eea; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Підтвердити email</a>
              <p><small>Це посилання дійсне 15 хвилин.</small></p>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email верифікації надіслано: ${email}`);
      
      return { success: true, message: 'Email верифікації надіслано' };
    } catch (error) {
      console.error(`❌ Помилка надсилання email верифікації:`, error.message);
      return { success: false, message: 'Помилка при надсиланні email' };
    }
  }
}

module.exports = new EmailService();
