const mongoose = require('mongoose');

const connectDB = async() => {
    try {
        // some home networks can't resolve Atlas addresses, so locally we ask
        // Google's DNS; hosting platforms have working DNS of their own
        if (process.env.NODE_ENV !== "production" || process.env.USE_GOOGLE_DNS === "true") {
            const dns = require("dns");
            dns.setServers(["8.8.8.8", "8.8.4.4"]);
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        // the exact reason helps when reading Render's logs
        console.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;
