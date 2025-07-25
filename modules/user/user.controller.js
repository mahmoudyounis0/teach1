import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { connectToDB } from "../../database/db.connection.js";
import { emailConfirmation } from "../../utils/sendEmail.js";
import jwt from "jsonwebtoken"
import { generateTokens } from '../../utils/authService.js';

dotenv.config();

const getDbAndCollection = async (collectionName) => {
    const db = await connectToDB();
    return db.collection(collectionName);
};

// Validation helper
const validateUserData = (data) => {
    const { name, email, age, password } = data;
    const errors = [];

    if (!name || name.trim().length < 2) {
        errors.push("Name must be at least 2 characters long");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push("Valid email address is required");
    }

    // if (!age || age < 18 || age > 100) {
    //     errors.push("Age must be between 18 and 100");
    // }

    if (!password || password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }

    return errors;
};

export const confirmCode = async (req, res) => {
    try {
        const { code, email, adminPassword } = req.body;

        // Validate input
        if (!code || !email || !adminPassword) {
            return res.status(400).json({
                success: false,
                message: "Code, email, and admin password are required"
            });
        }

        // Convert code to number for comparison
        const numericCode = parseInt(code);
        if (isNaN(numericCode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid code format"
            });
        }

        const db = await connectToDB();
        const codesCollection = db.collection('codes');
        const pendingUserCollection = db.collection('pendingUser');
        const userCollection = db.collection('user');

        // Find the code document (normalize email)
        const codeDocument = await codesCollection.findOne({ email: email.toLowerCase() });

        if (!codeDocument) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code"
            });
        }

        // Check if code has expired
        if (codeDocument.expireAt <= new Date()) {
            await codesCollection.deleteOne({ email: email.toLowerCase() });
            return res.status(400).json({
                success: false,
                message: "Verification code has expired"
            });
        }

        // Check if code matches
        if (codeDocument.code !== numericCode) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code"
            });
        }

        // Check if admin password matches
        if (codeDocument.adminPass !== adminPassword.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin password"
            });
        }

        // Find pending User
        const pendingUser = await pendingUserCollection.findOne({ email: email.toLowerCase() });
        if (!pendingUser) {
            await codesCollection.deleteOne({ email: email.toLowerCase() });
            return res.status(400).json({
                success: false,
                message: "User registration not found"
            });
        }

        // Check if User already exists
        const existingUser = await userCollection.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            await codesCollection.deleteOne({ email: email.toLowerCase() });
            await pendingUserCollection.deleteOne({ email: email.toLowerCase() });
            return res.status(409).json({
                success: false,
                message: "User already verified"
            });
        }

        // Move User from pending to verified
        const verifiedUser = {
            ...pendingUser,
            status: 'verified',
            verifiedAt: new Date(),
            approvedBy: 'admin_system'
        };

        await userCollection.insertOne(verifiedUser);
        await codesCollection.deleteOne({ email: email.toLowerCase() });
        await pendingUserCollection.deleteOne({ email: email.toLowerCase() });

        // Return safe User data (without password)
        const { password: _, ...safeUser } = verifiedUser;

        res.status(200).json({
            success: true,
            message: "Email verified successfully. User access granted.",
            user: safeUser
        });

    } catch (error) {
        console.error("Error confirming code:", error);
        res.status(500).json({
            success: false,
            message: "Server error during verification",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Check if user exists in either collection
const checkExisting = async (email) => {
    const db = await connectToDB();
    const pendingUserCollection = db.collection('pendingUser');
    const userCollection = db.collection('user');

    // Check if User already exists (in both collections)
    const [existingPending, existingUser] = await Promise.all([
        pendingUserCollection.findOne({ email: email.toLowerCase() }),
        userCollection.findOne({ email: email.toLowerCase() })
    ]);

    return {
        existingUser,
        existingPending,
        isExist: !!existingUser,
        isPending: !!existingPending
    };
};

export const addUser = async (req, res) => {
    try {
        const { name, email, age, password } = req.body;

        // Validate input data
        const validationErrors = validateUserData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        // Check if user already exists
        const existingResult = await checkExisting(email);
        if (existingResult.isExist) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }
        if (existingResult.isPending) {
            return res.status(409).json({
                success: false,
                message: "User registration already pending for this email"
            });
        }

        const db = await connectToDB();
        const pendingUserCollection = db.collection('pendingUser');

        // Hash password
        const saltRounds = 12;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);

        // Create User document
        const user = {
            name: name.trim(),
            email: email.toLowerCase(),
            age: parseInt(age),
            password: hashedPassword,
            role: 'user',
            status: 'pending',
            createdAt: new Date(),
        };

        // Insert pending User
        const result = await pendingUserCollection.insertOne(user);

        // Send confirmation emails to both User and admin
        const emailResult = await emailConfirmation(user.email, user.name, result.insertedId);

        // Return safe User data
        const { password: _, ...safeUser } = user;

        res.status(201).json({
            success: true,
            message: "User registered successfully. Emails sent to user and admin for approval.",
            user: safeUser,
        });

    } catch (error) {
        console.error("Error creating User:", error);

        // Handle specific errors
        if (error.message.includes("email")) {
            return res.status(500).json({
                success: false,
                message: "Failed to send confirmation emails. Please try again."
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error while creating user",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const db = await connectToDB();
        const pendingUserCollection = db.collection('pendingUser');

        // Check if pending User exists (normalize email)
        const pendingUser = await pendingUserCollection.findOne({ email: email.toLowerCase() });

        if (!pendingUser) {
            return res.status(404).json({
                success: false,
                message: "No pending user registration found for this email"
            });
        }

        // Send new confirmation emails
        const emailResult = await emailConfirmation(pendingUser.email, pendingUser.name, pendingUser._id);

        // Log for development
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Resent verification for: ${pendingUser.name} (${pendingUser.email})`);
            console.log(`📧 New verification code: ${emailResult.code}`);
            console.log(`🔐 New admin password: ${emailResult.adminPass}`);
        }

        res.status(200).json({
            success: true,
            message: "Verification code resent successfully.",
            // Include details in development mode
            ...(process.env.NODE_ENV === 'development' && {
                verificationCode: emailResult.code,
                adminPassword: emailResult.adminPass
            })
        });

    } catch (error) {
        console.error("Error resending verification code:", error);
        res.status(500).json({
            success: false,
            message: "Failed to resend verification code"
        });
    }
};

// Get all pending Users with verification codes (admin only)
export const getPendingUsers = async (req, res) => {
    try {
        const db = await connectToDB();
        const pendingUserCollection = db.collection('pendingUser');
        const codesCollection = db.collection('codes');

        // Get pending Users
        const pendingUsers = await pendingUserCollection
            .find({}, { projection: { password: 0 } })
            .sort({ createdAt: -1 })
            .toArray();

        // Get associated codes and admin passwords for each User
        const usersWithCodes = await Promise.all(
            pendingUsers.map(async (user) => {
                const codeDoc = await codesCollection.findOne({ email: user.email });
                return {
                    ...user,
                    verificationCode: codeDoc?.code || null,
                    adminPassword: codeDoc?.adminPass || null,
                    codeExpiry: codeDoc?.expireAt || null,
                    isExpired: codeDoc ? codeDoc.expireAt <= new Date() : true
                };
            })
        );

        res.status(200).json({
            success: true,
            message: "Pending users retrieved successfully",
            users: usersWithCodes,
            count: usersWithCodes.length
        });

    } catch (error) {
        console.error("Error retrieving pending users:", error);
        res.status(500).json({
            success: false,
            message: "Server error while retrieving pending users"
        });
    }
};
export const logIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Check if user exists
        const existingResult = await checkExisting(email);

        if (!existingResult.isExist) {
            if (existingResult.isPending) {
                return res.status(401).json({
                    success: false,
                    message: "Your account is pending verification. Please check your email and verify your account first."
                });
            }
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = existingResult.existingUser;


        // Check if user is verified
        if (user.status !== 'verified') {
            return res.status(401).json({
                success: false,
                message: "Your account is not verified yet. Please wait for admin approval."
            });
        }

        // Compare password
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Login successful - return safe user data (without password)
        const payload = {
            _id:user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status:user.status
        }
        const {accessToken, refreshToken} = generateTokens(payload) 

        const { password: _,  ...safeUser } = user;
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: safeUser,
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};