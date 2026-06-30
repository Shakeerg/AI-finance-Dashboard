const Transaction = require("../models/Transactions");

const createTransaction = async (req, res, next) => {
    try {
        const {
            rawText,
            amount,
            merchant,
            category,
        } = req.body;

        if (!rawText || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide rawText and amount."
            });
        }

        const newTransaction = await Transaction.create({
            rawText,
            amount,
            merchant: merchant || "Manual Entry",
            category: category || "Uncategorized"
        });

        res.status(201).json({
            success: true,
            data: newTransaction
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTransaction
};