const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const depositService = require('../services/deposit.service');
const referralService = require('../services/referral.service');
const { createDepositSchema } = require('../validations/deposit.validation');
const DB = require('../models');
const { Op } = DB.Sequelize;

const responseTime = (req) => `${Date.now() - (req.time || Date.now())} ms`;

exports.create = catchAsync(async (req, res, next) => {
    const { error, value } = createDepositSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const payload = { ...value };
    const deposit = await depositService.createDeposit(req.user.id, payload);

    res.status(201).json({
        status: 'success',
        deposit,
        receive_address: process.env.EXODUS_USDT_TRON_ADDRESS || null,
        wallet_provider: 'EXODUS',
        network: 'TRON_USDT_TRC20',
        reference_code: deposit.reference_code,
        tron_uri: (process.env.EXODUS_USDT_TRON_ADDRESS ? `tron:${process.env.EXODUS_USDT_TRON_ADDRESS}${deposit.amount ? `?amount=${deposit.amount}` : ''}` : null),
        time: responseTime(req)
    });
});

exports.list = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (limit < 1 || offset < 0) {
        return next(new AppError('Invalid pagination parameters', 400));
    }

    const deposits = await depositService.getUserDeposits(req.user.id, limit, offset);
    const totalDeposited = await depositService.getTotalDeposited(req.user.id);

    res.status(200).json({
        status: 'success',
        deposits,
        totalDeposited,
        time: responseTime(req)
    });
});

exports.profile = catchAsync(async (req, res) => {
    const [totalDeposited, wallet, refCount] = await Promise.all([
        depositService.getTotalDeposited(req.user.id),
        DB.models.Wallet.findOne({ where: { user_id: req.user.id } }),
        referralService.getInvitesCount(req.user.id)
    ]);

    const refRate = referralService.calcReferrerRate(0.20, refCount);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);


    const balance = wallet ? Number(wallet.balance) : 0;
    const balancePlusDeposits = Number(totalDeposited || 0) + Number(balance || 0);

    res.status(200).json({
        status: 'success',
        user: req.user,
        totalDeposited,
        balance,
        balancePlusDeposits,
        invite_code: req.user.unique_tag,
        current_code: null,
        referral_count: refCount,
        interest_rate_for_referrer: refRate,
        time: responseTime(req)
    });
});

exports.qr = catchAsync(async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return next(new AppError('Invalid deposit id', 400));

    const dep = await DB.models.Deposit.findByPk(id);
    if (!dep || dep.user_id !== req.user.id) return next(new AppError('Deposit not found', 404));

    const address = process.env.EXODUS_USDT_TRON_ADDRESS || null;
    const amount = Number(req.query.amount || dep.amount || 0);
    const currency = dep.currency || 'USDT';
    const network = 'TRON_USDT_TRC20';
    const tron_uri = address ? `tron:${address}${amount ? `?amount=${amount}` : ''}` : null;

    res.status(200).json({
        status: 'success',
        address,
        amount,
        currency,
        network,
        tron_uri,
        reference_code: dep.reference_code
    });
});
