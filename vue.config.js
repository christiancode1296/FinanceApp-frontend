module.exports = {
    devServer: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080', // ← hier läuft dein Spring-Boot-Backend
                changeOrigin: true,
            },
        },
    },
};