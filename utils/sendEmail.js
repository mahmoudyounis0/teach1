import nodemailer from "nodemailer";
import { connectToDB } from "../database/db.connection.js";

export const sendEmail = async (data, to) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        let info;

        if (to === 'teacher') {
            info = await transporter.sendMail({
                from: `"Dars Track (درس Track)" <${process.env.EMAIL_USERNAME}>`,
                to: data.email,
                subject: "Teacher Registration - Pending Admin Approval",
                text: `Hello ${data.name || 'Teacher'},\n\nYou have been registered as a Teacher on Dars Track.\nYour confirmation code is: ${data.code}\n\nPlease wait for admin approval. The admin will provide you with an admin password.\n\nThis code expires in 5 minutes after admin approval.\n\nIf you didn't expect this email, please ignore it.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to Dars Track!</h2>
                            <p style="font-size: 16px; color: #555; line-height: 1.6;">Hello ${data.name || 'Teacher'},</p>
                            <p style="font-size: 16px; color: #555; line-height: 1.6;">You have been successfully registered as a Teacher on <strong>Dars Track</strong>.</p>
                            <p style="font-size: 16px; color: #555; line-height: 1.6;">Your registration is currently <strong>pending admin approval</strong>.</p>
                            
                            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #2196f3;">
                                <h3 style="color: #1976d2; margin-top: 0;">Your Confirmation Code:</h3>
                                <p style="font-size: 32px; font-weight: bold; color: #2196f3; letter-spacing: 3px; margin: 10px 0; text-align: center;">${data.code}</p>
                            </div>
                            
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                                <p style="font-size: 14px; color: #856404; margin: 0;">
                                    <strong>Next Steps:</strong><br>
                                    1. Wait for admin approval<br>
                                    2. Admin will provide you with an admin password<br>
                                    3. Use your confirmation code + admin password to complete verification
                                </p>
                            </div>
                            
                            <p style="font-size: 14px; color: #e74c3c; text-align: center; margin: 20px 0;">⚠️ This code expires 5 minutes after admin approval</p>
                            
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="font-size: 12px; color: #999; text-align: center;">
                                If you didn't expect this email, please ignore it. No action is required.
                            </p>
                        </div>
                    </div>
                `
            });
            //  <div style="text-align: center; margin: 30px 0;">
            //                     <a href="${process.env.FRONTEND_URL}/teacher/confirm-email" 
            //                        style="display: inline-block; padding: 12px 30px; background-color: #2ddb33; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            //                         Ready to Confirm
            //                     </a>
            //                 </div>
        } else if (to === 'admin') {
            info = await transporter.sendMail({
                from: `"Dars Track (درس Track)" <${process.env.EMAIL_USERNAME}>`,
                to: process.env.ADMIN_EMAIL || "mahmoudyounis221@gmail.com", // Use env var or fallback
                subject: "New Teacher Registration - Approval Required",
                text: `Hello BOSS,\n\nA new teacher wants to join Dars Track.\n\nTeacher Details:\nName: ${data.name}\nEmail: ${data.email}\n\nAdmin Password: ${data.adminPass}\n\nThis password expires in 5 minutes.\n\nPlease review and approve if appropriate.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">New Teacher Registration</h2>
                            <p style="font-size: 16px; color: #555; line-height: 1.6;">Hello Ya BOSS,</p>
                            <p style="font-size: 16px; color: #555; line-height: 1.6;"><strong>${data.name}</strong> wants to join <strong>Dars Track</strong> as a teacher.</p>
                            
                            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #4caf50;">
                                <h3 style="color: #2e7d32; margin-top: 0;">👤 Teacher Information:</h3>
                                <p style="margin: 8px 0; color: #555;"><strong>Name:</strong> ${data.name}</p>
                                <p style="margin: 8px 0; color: #555;"><strong>Email:</strong> ${data.email}</p>
                                <p style="margin: 8px 0; color: #555;"><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                            
                            <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center; border-left: 4px solid #ffc107;">
                                <p style="font-size: 14px; color: #856404; margin-bottom: 10px; font-weight: bold;">🔐 Admin Password (Share if Approved):</p>
                                <div style="background-color: #fff; padding: 15px; border-radius: 4px; border: 2px dashed #ffc107;">
                                    <p style="font-size: 24px; font-weight: bold; color: #856404; letter-spacing: 2px; margin: 0; font-family: monospace;">${data.adminPass}</p>
                                </div>
                            </div>
                            
                            <div style="background-color: #ffebee; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f44336;">
                                <p style="font-size: 14px; color: #c62828; margin: 0;">
                                    <strong>⚠️ Important:</strong> This password expires in 5 minutes. Only share it with the teacher if you approve their registration.
                                </p>
                            </div>
                            
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="font-size: 12px; color: #999; text-align: center;">
                                This is an automated notification from Dars Track Admin System.
                            </p>
                        </div>
                    </div>
                `
            });
        }

        console.log(`Email sent successfully to ${to}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
        throw new Error(`Failed to send confirmation email to ${to}`);
    }
};
//  <div style="text-align: center; margin: 30px 0;">
//                                 <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Approval Actions:</p>
//                                 <a href="${process.env.ADMIN_PANEL_URL || '#'}/teachers/pending" 
//                                    style="display: inline-block; padding: 12px 25px; background-color: #2196f3; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 5px;">
//                                     📋 Review Details
//                                 </a>
//                                 <a href="${process.env.FRONTEND_URL || '#'}/admin/approve-teacher" 
//                                    style="display: inline-block; padding: 12px 25px; background-color: #4caf50; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 5px;">
//                                     ✅ Approve Teacher
//                                 </a>
//                             </div>
export const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

export const generateAdminPassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%&*-_=+?';
    const allChars = upper + lower + numbers + symbols;

    let password = '';

    // Ensure at least one character from each category
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        password += allChars[randomIndex];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const addCode = async (data, adminPass) => {
    try {
        const db = await connectToDB();
        const collection = db.collection('codes');

        // Set expiration to 5 minutes from now
        const expireAt = new Date(Date.now() + 5 * 60 * 1000);

        // Create TTL index if it doesn't exist
        await collection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

        // Remove any existing codes for this email
        await collection.deleteMany({ email: data.email });

        const codeDocument = {
            userId: data.userId,
            email: data.email,
            code: data.code,
            adminPass,
            expireAt,
            createdAt: new Date()
        };

        await collection.insertOne(codeDocument);
        console.log("Confirmation code stored successfully");
    } catch (error) {
        console.error("Error storing confirmation code:", error);
        throw new Error("Failed to store confirmation code");
    }
};

export const emailConfirmation = async (email, name, userId) => {
    try {
        const code = generateCode();
        const adminPass = generateAdminPassword();

        // Data for teacher email (safe data without admin password)
        const teacherEmailData = {
            userId,
            email,
            code,
            name
        };

        // Data for admin email
        const adminEmailData = {
            userId,
            email,
            code,
            name,
            adminPass
        };

        // Store code and admin password in database
        await addCode(teacherEmailData, adminPass);

        // Send email to teacher
        await sendEmail(teacherEmailData, 'teacher');

        // Send email to admin
        await sendEmail(adminEmailData, 'admin');

        return {
            success: true,
            code: code.toString(),
            adminPass
        };
    } catch (error) {
        console.error("Error in email confirmation process:", error);
        throw error;
    }
};