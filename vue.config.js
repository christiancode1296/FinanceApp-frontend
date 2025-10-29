module.exports = {
    devServer: {
        port: 3000, // so wie dein serve-Output
        proxy: {
            '/api': {
                target: 'http://localhost:8080', // Spring Boot
                changeOrigin: true,
            },
        },
    },
};