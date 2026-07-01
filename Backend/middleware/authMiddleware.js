const protectRoute = (req, res, next) => {
    console.log("protectRoute executed");
    console.log("Received x-api-key:", req.headers["x-api-key"]);
    console.log("Expected key:", process.env.FINA_INTERNAL_API_KEY);

    try {
        const clientApiKey = req.headers["x-api-key"];

        if (!clientApiKey) {
            return res.status(401).json({
                success: false,
                message: "Access Denied: No API key provided."
            });
        }

        if (clientApiKey !== process.env.FINA_INTERNAL_API_KEY) {
            return res.status(403).json({
                success: false,
                message: "Access Denied: Invalid API key."
            });
        }

        next();

    } catch (error) {
        next(error);
    }
};

module.exports = { protectRoute };