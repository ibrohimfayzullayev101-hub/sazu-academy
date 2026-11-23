SAZU ACADEMY WEBSITE

1. Open this folder in VS Code.
2. Open index.html in a browser, or use the Live Server extension.
3. All images are in the assets folder. Keep the folder structure unchanged.
4. Edit text and translations in script.js. Styles are in style.css.

IMPORTANT:
- The contact form sends applications to the Vercel serverless endpoint at /api/lead.
- The endpoint saves each application in Supabase and sends it to the Telegram group.
- Configure these Vercel Environment Variables before deploying: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SUPABASE_URL, SUPABASE_ANON_KEY.
- Add the Telegram bot to the target group and grant it permission to send messages. Keep the bot token secret; never put it in frontend JavaScript.
- Confirm the exact branch addresses and map pins before publishing.
- Course fees, schedules, teacher profiles and real classroom photos can be added when supplied.
- The email and Telegram links are based on the contact details supplied.

5. The browser tab icon (favicon) uses assets/logo.png.
6. Subtle scroll-reveal, hover and floating animations are included. Visitors who prefer reduced motion will see animations minimized automatically.
