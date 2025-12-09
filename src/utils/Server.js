module.exports = (app) => {
    const DB = require('../models');

    const startServer = (port) => {
        const server = app.listen(port);

        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE') {
                const fallback = port === 3400 ? 3500 : 3400;
                startServer(fallback);
            } else {
                throw err;
            }
        });

        process.on('unhandledRejection', err => {
            server.close(() => { process.exit(1); });
        });
    };

    DB.con
        .sync({ alter: false })
        .then(async () => {
            try {
                if (DB.models.AdminCode) {
                    await DB.models.AdminCode.sync({ alter: true });
                }
                if (DB.models.AdminCodeSlot) {
                    await DB.models.AdminCodeSlot.sync({ alter: true });
                }
                if (DB.models.AdminCodeUsage) {
                    await DB.models.AdminCodeUsage.sync({ alter: true });
                }
                if (DB.models.Deposit) {
                    await DB.models.Deposit.sync({ alter: true });
                }
                if (DB.models.Forwarder) {
                    await DB.models.Forwarder.sync({ alter: true });
                }
                if (DB.models.SweepTx) {
                    await DB.models.SweepTx.sync({ alter: true });
                }
                if (DB.models.StripeAccount) {
                    await DB.models.StripeAccount.sync({ alter: true });
                }
                if (DB.models.WithdrawConfig) {
                    await DB.models.WithdrawConfig.sync({ alter: true });
                }
            } catch (e) {}
            const initialPort = 3400;
            startServer(initialPort);
        })
        .catch(() => {});

    return DB;
};
