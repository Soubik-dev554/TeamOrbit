const express = require('express');

const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');

const crypto = require('crypto');



const User = require('../models/User');

const EmployeeInvitation = require('../models/EmployeeInvitation');

const auth = require('../middleware/auth');

const logActivity = require('../utils/logActivity');

const sendEmail = require('../utils/sendEmail');



const router = express.Router();





// ============================================

// HELPER FUNCTIONS

// ============================================



const hashValue = (value) => {

    return crypto

        .createHash('sha256')

        .update(value)

        .digest('hex');

};



const escapeHTML = (value = '') => {

    return String(value).replace(/[&<>"']/g, (character) => ({

        '&': '&amp;',

        '<': '&lt;',

        '>': '&gt;',

        '"': '&quot;',

        "'": '&#39;'

    })[character]);

};



const getInvitation = async (token) => {



    if (

        typeof token !== 'string' ||

        token.length < 32 ||

        token.length > 200

    ) {

        return null;

    }



    return EmployeeInvitation.findOne({

        tokenHash: hashValue(token),

        status: 'pending',

        expiresAt: { $gt: new Date() }

    }).select('+tokenHash +otpHash +otpExpires +otpAttempts +otpResendAt');

};





// ============================================

// PUBLIC EMPLOYEE INVITATION ROUTES

// These routes must be before router.use(auth)

// ============================================





// GET INVITATION DETAILS



router.get('/invitation/:token', async (req, res, next) => {



    try {



        const invitation = await getInvitation(req.params.token);



        if (!invitation) {

            return res.status(400).json({

                message: 'Invitation is invalid or has expired.'

            });

        }



        res.json({

            invitation: {

                name: invitation.name,

                email: invitation.email,

                organization: invitation.organization

            }

        });



    } catch (error) {

        next(error);

    }



});





// SEND EMPLOYEE OTP



router.post('/invitation/:token/send-otp', async (req, res, next) => {



    try {



        const invitation = await getInvitation(req.params.token);



        if (!invitation) {

            return res.status(400).json({

                message: 'Invitation is invalid or has expired.'

            });

        }



        // Check whether the email is already registered.



        const existingUser = await User.findOne({

            email: invitation.email

        });



        if (existingUser) {

            return res.status(409).json({

                message: 'An account already exists with this email.'

            });

        }



        const now = Date.now();



        // Resend cooldown.



        const resendAt = invitation.otpResendAt

            ? new Date(invitation.otpResendAt).getTime()

            : 0;



        if (resendAt > now) {



            const remainingSeconds = Math.ceil(

                (resendAt - now) / 1000

            );



            return res.status(429).json({

                message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,

                remainingSeconds

            });



        }



        // Generate OTP.



        const otp = crypto.randomInt(100000, 1000000).toString();



        const hashedOTP = hashValue(otp);



        invitation.otpHash = hashedOTP;

        invitation.otpExpires = new Date(now + 5 * 60 * 1000);

        invitation.otpAttempts = 0;

        invitation.otpResendAt = new Date(now + 60 * 1000);



        await invitation.save();



        try {



            await sendEmail({



                to: invitation.email,



                subject: 'TeamOrbit Employee Registration OTP',



                html: `

                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;color:#333;">



                        <h2 style="color:#4f46e5;">

                            Welcome to TeamOrbit!

                        </h2>



                        <p>Hello ${escapeHTML(invitation.name)},</p>



                        <p>

                            Your company has invited you to join TeamOrbit.

                        </p>



                        <p>

                            Use the following OTP to verify your email:

                        </p>



                        <div style="background:#f5f3ff;padding:20px;text-align:center;border-radius:10px;margin:25px 0;">



                            <h1 style="letter-spacing:8px;color:#4f46e5;margin:0;">

                                ${otp}

                            </h1>



                        </div>



                        <p>

                            This OTP expires in <strong>5 minutes</strong>.

                        </p>



                        <p>

                            If you did not expect this invitation, please ignore this email.

                        </p>



                        <p>TeamOrbit Team</p>



                    </div>

                `



            });



        } catch (emailError) {



            invitation.otpHash = null;

            invitation.otpExpires = null;

            invitation.otpAttempts = 0;

            invitation.otpResendAt = null;



            await invitation.save();



            throw emailError;



        }



        res.json({

            message: 'Verification OTP sent successfully.',

            cooldownSeconds: 60

        });



    } catch (error) {

        next(error);

    }



});





// VERIFY OTP AND COMPLETE EMPLOYEE REGISTRATION



router.post('/invitation/:token/complete', async (req, res, next) => {



    let session;



    try {



        const { otp, password } = req.body;



        if (

            typeof otp !== 'string' ||

            !/^\d{6}$/.test(otp)

        ) {

            return res.status(400).json({

                message: 'Please enter a valid six-digit OTP.'

            });

        }



        if (

            typeof password !== 'string' ||

            password.length < 8

        ) {

            return res.status(400).json({

                message: 'Password must contain at least 8 characters.'

            });

        }



        const invitation = await getInvitation(req.params.token);



        if (!invitation) {

            return res.status(400).json({

                message: 'Invitation is invalid or has expired.'

            });

        }



        // Check if already registered.



        const existingUser = await User.findOne({

            email: invitation.email

        });



        if (existingUser) {

            return res.status(409).json({

                message: 'An account already exists with this email.'

            });

        }



        // Check OTP availability.



        if (!invitation.otpHash || !invitation.otpExpires) {

            return res.status(400).json({

                message: 'Please request a verification OTP first.'

            });

        }



        // Check OTP expiration.



        if (invitation.otpExpires.getTime() <= Date.now()) {



            invitation.otpHash = null;

            invitation.otpExpires = null;

            invitation.otpAttempts = 0;



            await invitation.save();



            return res.status(400).json({

                message: 'OTP has expired. Please request a new OTP.'

            });



        }



        // Maximum five attempts.



        if (invitation.otpAttempts >= 5) {



            invitation.otpHash = null;

            invitation.otpExpires = null;



            await invitation.save();



            return res.status(429).json({

                message: 'Maximum OTP attempts exceeded. Please request a new OTP.'

            });



        }



        // Compare OTP securely.



        const submittedHash = hashValue(otp);



        const submittedBuffer = Buffer.from(submittedHash, 'hex');

        const storedBuffer = Buffer.from(invitation.otpHash, 'hex');



        const isValidOTP =

            submittedBuffer.length === storedBuffer.length &&

            crypto.timingSafeEqual(

                submittedBuffer,

                storedBuffer

            );



        if (!isValidOTP) {



            invitation.otpAttempts += 1;



            const remainingAttempts = Math.max(

                0,

                5 - invitation.otpAttempts

            );



            if (invitation.otpAttempts >= 5) {

                invitation.otpHash = null;

                invitation.otpExpires = null;

            }



            await invitation.save();



            return res.status(400).json({

                message: invitation.otpAttempts >= 5

                    ? 'Maximum OTP attempts exceeded. Please request a new OTP.'

                    : 'Incorrect OTP.',



                remainingAttempts

            });



        }



        // Confirm the organization still exists and is active.



        const organizationExists = await mongoose.model('Organization').findOne({

            _id: invitation.organization,

            isActive: true

        });



        if (!organizationExists) {

            return res.status(403).json({

                message: 'The organization associated with this invitation is unavailable.'

            });

        }



        // Hash employee password.



        const hashedPassword = await bcrypt.hash(password, 10);



        // Create employee and accept invitation atomically.



        session = await mongoose.startSession();



        let createdEmployee;



        await session.withTransaction(async () => {



            const users = await User.create(

                [{

                    name: invitation.name,

                    email: invitation.email,

                    password: hashedPassword,



                    role: 'employee',



                    isActive: true,



                    isEmailVerified: true,



                    organization: invitation.organization



                }],

                { session }

            );



            createdEmployee = users[0];



            invitation.status = 'accepted';

            invitation.acceptedAt = new Date();



            invitation.otpHash = null;

            invitation.otpExpires = null;

            invitation.otpAttempts = 0;

            invitation.otpResendAt = null;




            await invitation.save({ session });



        });



        // Activity log.



        await logActivity({



            user: invitation.invitedBy,



            organization: invitation.organization,



            action: 'EMPLOYEE_CREATED',



            description: `Employee "${createdEmployee.name}" joined through an invitation.`



        });



        return res.status(201).json({



            message: 'Registration completed successfully. You can now log in.',



            employee: {

                id: createdEmployee._id,

                name: createdEmployee.name,

                email: createdEmployee.email,

                role: createdEmployee.role,

                organization: createdEmployee.organization

            }



        });



    } catch (error) {



        if (error.code === 11000) {

            return res.status(409).json({

                message: 'An account already exists with this email.'

            });

        }



        next(error);



    } finally {



        if (session) {

            await session.endSession();

        }



    }



});





// ============================================

// PROTECTED EMPLOYEE MANAGEMENT ROUTES

// ============================================



router.use(auth);





// GET EMPLOYEES



router.get('/', async (req, res, next) => {



    try {



        if (!['admin', 'superadmin'].includes(req.user.role)) {

            return res.status(403).json({

                message: 'You are not authorized to view users.'

            });

        }



        const filter = {

            role: 'employee'

        };



        if (req.user.role === 'admin') {



            if (!req.user.organization) {

                return res.status(403).json({

                    message: 'Your account is not associated with an organization.'

                });

            }



            filter.organization = req.user.organization;



        }



        const users = await User.find(filter)

            .select('name email role isActive avatar organization')

            .sort({ name: 1 })

            .limit(200);



        res.json({ users });



    } catch (error) {

        next(error);

    }



});





// INVITE EMPLOYEE



router.post('/', async (req, res, next) => {



    try {



        if (req.user.role !== 'admin') {

            return res.status(403).json({

                message: 'Only Company Admin can invite employees.'

            });

        }



        if (!req.user.organization) {

            return res.status(403).json({

                message: 'Your account is not associated with an organization.'

            });

        }



        const { name, email } = req.body;



        if (

            typeof name !== 'string' ||

            typeof email !== 'string' ||

            !name.trim() ||

            !email.trim()

        ) {

            return res.status(400).json({

                message: 'Employee name and email are required.'

            });

        }



        const normalizedEmail = email.toLowerCase().trim();



        const existingUser = await User.findOne({

            email: normalizedEmail

        });



        if (existingUser) {

            return res.status(409).json({

                message: 'This email is already registered.'

            });

        }



        // Prevent duplicate pending invitations.



        const existingInvitation = await EmployeeInvitation.findOne({

            email: normalizedEmail,

            status: 'pending',

            expiresAt: { $gt: new Date() }

        });



        if (existingInvitation) {

            return res.status(409).json({

                message: 'An active invitation already exists for this email.'

            });

        }



        // Generate secure invitation token.



        const invitationToken = crypto

            .randomBytes(32)

            .toString('hex');



        const tokenHash = hashValue(invitationToken);



        const invitation = await EmployeeInvitation.create({



            name: name.trim(),



            email: normalizedEmail,



            organization: req.user.organization,



            invitedBy: req.user._id,



            tokenHash,



            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)



        });



        // Build the employee invitation URL from the configured frontend URL.
        const frontendUrl = process.env.CLIENT_URL?.trim();

        if (!frontendUrl) {
            await EmployeeInvitation.deleteOne({
                _id: invitation._id
            });

            throw new Error('CLIENT_URL is not configured.');
        }

        let invitationLink;

        try {
            const frontend = new URL(frontendUrl);

            if (!['http:', 'https:'].includes(frontend.protocol)) {
                throw new Error('CLIENT_URL must use HTTP or HTTPS.');
            }

            // Preserve a configured base path, but remove trailing slashes.
            frontend.pathname = frontend.pathname.replace(/\/+$/, '');

            // Append the invitation route and unique token.
            frontend.pathname += `/employee-invitation/${encodeURIComponent(invitationToken)}`;

            // Invitation URLs should not inherit query strings or fragments.
            frontend.search = '';
            frontend.hash = '';

            invitationLink = frontend.toString();
        } catch (urlError) {
            await EmployeeInvitation.deleteOne({
                _id: invitation._id
            });

            throw new Error(`Invalid CLIENT_URL: ${urlError.message}`);
        }

        // Log only the route; never expose the secret invitation token.
        console.log(
            'Generated invitation route:',
            new URL(invitationLink).pathname.replace(/\/[^/]+$/, '/[TOKEN]')
        );

        try {
            await sendEmail({



                to: normalizedEmail,



                subject: 'You are invited to join TeamOrbit',



                html: `

                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;color:#333;">



                        <h2 style="color:#4f46e5;">

                            Welcome to TeamOrbit!

                        </h2>



                        <p>Hello ${escapeHTML(name.trim())},</p>



                        <p>

                            You have been invited to join your company's workspace on TeamOrbit.

                        </p>



                        <p>

                            Click the button below to complete your registration.

                        </p>



                        <div style="text-align:center;margin:30px 0;">



                            <a

                                href="${invitationLink}"

                                style="background:#4f46e5;color:white;padding:14px 25px;text-decoration:none;border-radius:8px;display:inline-block;"

                            >

                                Complete Registration

                            </a>



                        </div>



                        <p>

                            This invitation expires in 24 hours.

                        </p>



                        <p>

                            You will need to verify your invited email address using an OTP.

                        </p>



                        <p>TeamOrbit Team</p>



                    </div>

                `



            });



        } catch (emailError) {



            await EmployeeInvitation.deleteOne({

                _id: invitation._id

            });



            throw emailError;



        }



        await logActivity({



            user: req.user._id,



            organization: req.user.organization,



            action: 'EMPLOYEE_INVITED',



            description: `Sent an employee invitation to "${normalizedEmail}".`



        });



        return res.status(201).json({



            message: 'Employee invitation sent successfully.',



            invitation: {

                id: invitation._id,

                name: invitation.name,

                email: invitation.email,

                expiresAt: invitation.expiresAt

            }



        });



    } catch (error) {



        if (error.code === 11000) {

            return res.status(409).json({

                message: 'An active invitation already exists for this email.'

            });

        }



        next(error);



    }



});





// ACTIVATE OR SUSPEND EMPLOYEE



router.patch('/:id/status', async (req, res, next) => {



    try {



        if (req.user.role !== 'admin') {

            return res.status(403).json({

                message: 'Only Company Admin can manage employee status.'

            });

        }



        if (!req.user.organization) {

            return res.status(403).json({

                message: 'Your account is not associated with an organization.'

            });

        }



        if (!mongoose.isValidObjectId(req.params.id)) {

            return res.status(400).json({

                message: 'Invalid employee id.'

            });

        }



        const { isActive } = req.body;



        if (typeof isActive !== 'boolean') {

            return res.status(400).json({

                message: 'isActive must be true or false.'

            });

        }



        const employee = await User.findOne({



            _id: req.params.id,



            organization: req.user.organization,



            role: 'employee'



        });



        if (!employee) {

            return res.status(404).json({

                message: 'Employee not found in your organization.'

            });

        }



        const previousStatus = employee.isActive;



        employee.isActive = isActive;



        await employee.save();



        if (previousStatus !== isActive) {



            await logActivity({



                user: req.user._id,



                organization: employee.organization,



                action: isActive

                    ? 'EMPLOYEE_ACTIVATED'

                    : 'EMPLOYEE_SUSPENDED',



                description: `${isActive ? 'Activated' : 'Suspended'} employee "${employee.name}".`



            });



        }



        res.json({



            message: `Employee ${isActive ? 'activated' : 'suspended'} successfully.`,



            employee: {

                _id: employee._id,

                name: employee.name,

                email: employee.email,

                role: employee.role,

                isActive: employee.isActive

            }



        });



    } catch (error) {

        next(error);

    }



});





module.exports = router;