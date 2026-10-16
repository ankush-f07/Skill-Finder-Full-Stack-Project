const cors = require("cors");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);

const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("./lib/prisma");

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://127.0.0.1:5500",
    credentials: true
}));
app.use(
    session({
        store: new pgSession({
            conString: process.env.DATABASE_URL,
            createTableIfMissing: true
        }),
        name: "skillswap.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false, // Local development over HTTP
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);
// Test route
app.get("/", (req, res) => {
    res.json({
        message: "SkillSwap Hub backend is running!"
    });
});

// Register a new user
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check for an existing account
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // Save the new user
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash
            },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                teaches: true,
                learns: true,
                createdAt: true
            }
        });

        return res.status(201).json({
            message: "Registration successful!",
            user
        });

    } catch (error) {
        console.error("Registration error:", error);

        // Handle concurrent duplicate registration attempts
        if (error.code === "P2002") {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            message: "Something went wrong during registration."
        });
    }
});
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email.trim().toLowerCase()
            }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        req.session.regenerate((err) => {
            if (err) {
                console.error("Session error:", err);

                return res.status(500).json({
                    message: "Unable to log in right now."
                });
            }

            req.session.userId = user.id;

            req.session.save((saveError) => {
                if (saveError) {
                    console.error("Session save error:", saveError);

                    return res.status(500).json({
                        message: "Unable to log in right now."
                    });
                }

                return res.json({
                    message: "Login successful!",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                });
            });
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Something went wrong during login."
        });
    }
});
app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to log out."
            });
        }

        res.clearCookie("skillswap.sid");

        return res.json({
            message: "Logged out successfully."
        });
    });
});
app.get("/api/auth/me", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                message: "You are not logged in."
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.session.userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                teaches: true,
                learns: true
            }
        });

        if (!user) {
            return res.status(401).json({
                message: "User account not found."
            });
        }

        return res.json({ user });
    } catch (error) {
        console.error("Session check error:", error);

        return res.status(500).json({
            message: "Unable to check login status."
        });
    }
});
// Update the logged-in user's skills
app.put("/api/users/me/skills", async (req, res) => {
    try {
        // 1. Check whether the user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                error: "Please log in first"
            });
        }

        // 2. Read the skills from the request
        const { teaches, learns } = req.body;

        // 3. Validate the input
        if (
            !Array.isArray(teaches) ||
            !Array.isArray(learns) ||
            !teaches.every(skill => typeof skill === "string") ||
            !learns.every(skill => typeof skill === "string")
        ) {
            return res.status(400).json({
                error: "teaches and learns must be arrays of strings"
            });
        }

        // 4. Update only the logged-in user's record
        const user = await prisma.user.update({
            where: {
                id: req.session.userId
            },
            data: {
                teaches,
                learns
            },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                teaches: true,
                learns: true
            }
        });

        // 5. Return the updated profile
        return res.status(200).json({
            message: "Skills updated successfully",
            user
        });

    } catch (error) {
        console.error("Skills update error:", error);

        return res.status(500).json({
            error: "Failed to update skills"
        });
    }
});
app.get("/api/users/me", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                error: "Please log in first"
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: req.session.userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                teaches: true,
                learns: true
            }
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        return res.json({ user });

    } catch (error) {
        console.error("Profile fetch error:", error);

        return res.status(500).json({
            error: "Failed to load profile"
        });
    }
});
app.get("/api/users", async (req, res) => {
try {
// Require login before showing the user directory
if (!req.session.userId) {
return res.status(401).json({
error: "Please log in first"
});
}


    // Fetch registered users, excluding passwords
    const users = await prisma.user.findMany({
        where: {
            id: {
                not: req.session.userId
            }
        },
        select: {
            id: true,
            name: true,
            bio: true,
            teaches: true,
            learns: true
        },
        orderBy: {
            name: "asc"
        }
    });

    return res.json({ users });

} catch (error) {
    console.error("Fetch users error:", error);

    return res.status(500).json({
        error: "Failed to fetch users"
    });
}


});



app.post("/api/connections", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Please log in first." });
        }

        const senderId = Number(req.session.userId);
        const receiverId = Number(req.body.receiverId);

        if (!Number.isInteger(receiverId) || receiverId <= 0) {
            return res.status(400).json({ error: "Invalid receiver ID." });
        }

        if (senderId === receiverId) {
            return res.status(400).json({ error: "You cannot connect with yourself." });
        }

        const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { id: true }
        });

        if (!receiver) {
            return res.status(404).json({ error: "User not found." });
        }

        // Check requests in both directions
        const existing = await prisma.connection.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            }
        });

        if (existing) {
            if (existing.status === "ACCEPTED") {
                return res.status(409).json({ error: "You are already connected." });
            }

            if (existing.status === "PENDING") {
                return res.status(409).json({ error: "A connection request already exists." });
            }

            // Allow a new request if the previous one was rejected
            await prisma.connection.delete({
                where: { id: existing.id }
            });
        }

        const request = await prisma.connection.create({
            data: { senderId, receiverId },
            select: { id: true, senderId: true, receiverId: true, status: true, createdAt: true }
        });

        return res.status(201).json({
            message: "Connection request sent.",
            request
        });
    } catch (error) {
        console.error("Send connection request error:", error);
        return res.status(500).json({ error: "Failed to send connection request." });
    }
});


// Get incoming pending requests
app.get("/api/connections/requests", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Please log in first." });
        }

        const requests = await prisma.connection.findMany({
            where: {
                receiverId: Number(req.session.userId),
                status: "PENDING"
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        bio: true,
                        teaches: true,
                        learns: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return res.json({ requests });
    } catch (error) {
        console.error("Get incoming requests error:", error);
        return res.status(500).json({ error: "Failed to load incoming requests." });
    }
});


// Accept or reject an incoming request
app.patch("/api/connections/:id", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Please log in first." });
        }

        const userId = Number(req.session.userId);
        const connectionId = Number(req.params.id);
        const status = req.body.status;

        if (!Number.isInteger(connectionId) || connectionId <= 0) {
            return res.status(400).json({ error: "Invalid request ID." });
        }

        if (!["ACCEPTED", "REJECTED"].includes(status)) {
            return res.status(400).json({ error: "Status must be ACCEPTED or REJECTED." });
        }

        const request = await prisma.connection.findUnique({
            where: { id: connectionId }
        });

        if (!request || request.receiverId !== userId) {
            return res.status(404).json({ error: "Incoming request not found." });
        }

        if (request.status !== "PENDING") {
            return res.status(409).json({ error: "This request has already been handled." });
        }

        const updated = await prisma.connection.update({
            where: { id: connectionId },
            data: { status },
            select: { id: true, senderId: true, receiverId: true, status: true }
        });

        return res.json({
            message: status === "ACCEPTED" ? "Connection accepted." : "Connection rejected.",
            request: updated
        });
    } catch (error) {
        console.error("Update connection request error:", error);
        return res.status(500).json({ error: "Failed to update connection request." });
    }
});


// Get accepted connections
app.get("/api/connections", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Please log in first." });
        }

        const userId = Number(req.session.userId);

        const connections = await prisma.connection.findMany({
            where: {
                status: "ACCEPTED",
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: {
                    select: { id: true, name: true, bio: true, teaches: true, learns: true }
                },
                receiver: {
                    select: { id: true, name: true, bio: true, teaches: true, learns: true }
                }
            },
            orderBy: { updatedAt: "desc" }
        });

        const users = connections.map(connection =>
            connection.senderId === userId
                ? connection.receiver
                : connection.sender
        );

        return res.json({ connections: users });
    } catch (error) {
        console.error("Get connections error:", error);
        return res.status(500).json({ error: "Failed to load connections." });
    }
});



const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});