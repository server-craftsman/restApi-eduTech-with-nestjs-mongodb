const rawUrl = process.env.KEEP_ALIVE_URL ?? process.env.RENDER_WEB_URL;

if (!rawUrl) {
    console.error('KEEP_ALIVE_URL (or RENDER_WEB_URL) is required');
    process.exit(1);
}

const url = rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;

try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
            'user-agent': 'render-cron-keepalive/1.0',
        },
    });

    clearTimeout(timeout);

    if (!response.ok) {
        console.error(`Keep-alive failed: ${response.status} ${response.statusText}`);
        process.exit(1);
    }

    console.log(`Keep-alive success: ${url}`);
} catch (error) {
    console.error('Keep-alive error:', error);
    process.exit(1);
}
