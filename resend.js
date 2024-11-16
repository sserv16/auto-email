// 从环境变量中获取配置
const resendApiKey = RESEND_API_KEY; // Resend API 密钥
const fromEmail = FROM_EMAIL || onboarding@resend.dev; // 发件人邮箱
const subject = SUBJECT; // 邮件主题
const body = BODY; // 邮件正文
const toEmails = TO_EMAILS.split('\n').map(email => email.trim()).filter(email => email); // 解析收件人

// 用于发送邮件的函数
async function sendEmail(toEmail) {
    const url = `https://api.resend.com/emails`; // Resend API URL
    const emailData = {
        from: fromEmail,
        to: toEmail,
        subject: subject,
        text: body, // 邮件正文（纯文本）
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${resendApiKey}`, // 使用 Bearer Token 验证
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
    });

    if (response.ok) {
        console.log(`邮件已成功发送到 ${toEmail}`);
        return true;
    } else {
        console.log(`发送邮件到 ${toEmail} 失败: ${response.status} - ${await response.text()}`);
        return false;
    }
}

// 群发邮件
async function handleRequest(event) {
    const results = await Promise.all(
        toEmails.map(async (email) => {
            const success = await sendEmail(email);
            return { email, success };
        })
    );

    // 分析结果
    const successCount = results.filter(res => res.success).length;
    const failureCount = results.length - successCount;
    const failedEmails = results.filter(res => !res.success).map(res => res.email);
    return new Response(
        `Emails sent: ${successCount} successful, ${failureCount} failed.\nFailed emails: ${failedEmails.join(', ')}`,
        { status: 200 }
    );
}

// HTTP 触发器
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event));
});

// 定时触发器
addEventListener('scheduled', event => {
    event.waitUntil(handleRequest(event));
});
