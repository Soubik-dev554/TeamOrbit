const express = require('express');

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const crypto = require('crypto');



const User = require('../models/User');

const Organization = require('../models/Organization');

const auth = require('../middleware/auth');

const sendEmail = require('../utils/sendEmail');



const router = express.Router();





// ============================================

// GENERATE JWT

// ============================================



const generateToken = (user) => {

  return jwt.sign(

    { id: user._id },

    process.env.JWT_SECRET,

    { expiresIn: '1d' }

  );

};





// ============================================

// SET AUTH COOKIE

// ============================================



const setTokenCookie = (res, token) => {

  res.cookie('token', token, {

    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'lax',

    maxAge: 24 * 60 * 60 * 1000

  });

};





// ============================================

// REGISTER ORGANIZATION WITH EMAIL OTP

// ============================================



router.post('/register-organization', async (req, res, next) => {

  let session;



  try {

    const { name, email, password, companyName } = req.body;



    if (

      typeof name !== 'string' ||

      typeof email !== 'string' ||

      typeof password !== 'string' ||

      typeof companyName !== 'string' ||

      !name.trim() ||

      !email.trim() ||

      !password ||

      !companyName.trim()

    ) {

      return res.status(400).json({

        message: 'All registration fields are required.'

      });

    }



    if (password.length < 8) {

      return res.status(400).json({

        message: 'Password must contain at least 8 characters.'

      });

    }



    const normalizedEmail = email.toLowerCase().trim();



    const existingUser = await User.exists({

      email: normalizedEmail

    });



    if (existingUser) {

      return res.status(409).json({

        message: 'Email is already registered.'

      });

    }



    const baseSlug = companyName

      .trim()

      .toLowerCase()

      .replace(/[^a-z0-9]+/g, '-')

      .replace(/^-|-$/g, '')

      .slice(0, 80);



    if (!baseSlug) {

      return res.status(400).json({

        message: 'Please enter a valid company name.'

      });

    }



    const slug = `${baseSlug}-${crypto.randomBytes(4).toString('hex')}`;



    const hashedPassword = await bcrypt.hash(password, 10);



    // Generate secure six-digit OTP.

    const otp = crypto.randomInt(100000, 1000000).toString();



    // Hash OTP before storing it.

    const hashedOTP = crypto

      .createHash('sha256')

      .update(otp)

      .digest('hex');



    session = await mongoose.startSession();



    let createdUser;

    let createdOrganization;



    await session.withTransaction(async () => {



      // Create Company Admin.

      const users = await User.create(

        [{

          name: name.trim(),

          email: normalizedEmail,

          password: hashedPassword,

          role: 'admin',

          isActive: true,



          isEmailVerified: false,

          emailOTP: hashedOTP,

          emailOTPExpires: new Date(Date.now() + 5 * 60 * 1000),

          emailOTPAttempts: 0,

          emailOTPResendAt: new Date(Date.now() + 60 * 1000)

        }],

        { session }

      );



      createdUser = users[0];



      // Create Organization.

      const organizations = await Organization.create(

        [{

          name: companyName.trim(),

          slug,

          owner: createdUser._id,

          isActive: true

        }],

        { session }

      );



      createdOrganization = organizations[0];



      createdUser.organization = createdOrganization._id;



      await createdUser.save({ session });

    });



    // Send verification email.

    try {

      await sendEmail({

        to: normalizedEmail,

        subject: 'Verify Your TeamOrbit Email',

        html: `

                    <div style="

                        font-family: Arial, sans-serif;

                        max-width: 600px;

                        margin: auto;

                        padding: 25px;

                        color: #333;

                    ">



                        <h2 style="color: #4f46e5;">

                            Welcome to TeamOrbit!

                        </h2>



                        <p>Hello ${name.trim()},</p>



                        <p>

                            Thank you for registering with TeamOrbit.

                            Please verify your email address using the OTP below.

                        </p>



                        <div style="

                            background: #f5f3ff;

                            padding: 20px;

                            text-align: center;

                            border-radius: 10px;

                            margin: 25px 0;

                        ">



                            <h1 style="

                                letter-spacing: 8px;

                                color: #4f46e5;

                                margin: 0;

                            ">

                                ${otp}

                            </h1>



                        </div>



                        <p>

                            This OTP expires in <strong>5 minutes</strong>.

                        </p>



                        <p>

                            If you did not create this account,

                            please ignore this email.

                        </p>



                        <p>TeamOrbit Team</p>



                    </div>

                `

      });



    } catch (emailError) {

      console.error(

        'OTP email delivery failed:',

        emailError.message

      );



      return res.status(201).json({

        message: 'Your registration was saved, but the verification email could not be sent. Please request a new OTP.',

        requiresEmailVerification: true,

        email: normalizedEmail

      });

    }



    // Do not log in before email verification.

    return res.status(201).json({

      message: 'Registration successful. Please verify your email using the OTP sent to your inbox.',

      requiresEmailVerification: true,

      email: normalizedEmail

    });



  } catch (error) {

    next(error);



  } finally {

    if (session) {

      await session.endSession();

    }

  }

});





// ============================================

// VERIFY EMAIL OTP

// ============================================



router.post('/verify-email', async (req, res, next) => {

  try {

    const { email, otp } = req.body;



    if (

      typeof email !== 'string' ||

      typeof otp !== 'string' ||

      !email.trim() ||

      !/^\d{6}$/.test(otp)

    ) {

      return res.status(400).json({

        message: 'Please provide a valid email and six-digit OTP.'

      });

    }



    const normalizedEmail = email.toLowerCase().trim();



    // Select hidden OTP fields.

    const user = await User.findOne({

      email: normalizedEmail

    }).select(

      '+emailOTP +emailOTPExpires +emailOTPAttempts'

    );



    if (!user) {

      return res.status(404).json({

        message: 'Account not found.'

      });

    }



    if (user.isEmailVerified) {

      return res.status(400).json({

        message: 'Email is already verified. Please log in.'

      });

    }



    if (!user.emailOTP || !user.emailOTPExpires) {

      return res.status(400).json({

        message: 'No active OTP found. Please request a new OTP.'

      });

    }



    // Check expiry.

    if (user.emailOTPExpires.getTime() <= Date.now()) {

      user.emailOTP = null;

      user.emailOTPExpires = null;

      user.emailOTPAttempts = 0;



      await user.save();



      return res.status(400).json({

        message: 'OTP has expired. Please request a new OTP.'

      });

    }



    // Check maximum attempts.

    if (user.emailOTPAttempts >= 5) {

      user.emailOTP = null;

      user.emailOTPExpires = null;



      await user.save();



      return res.status(429).json({

        message: 'Maximum OTP attempts exceeded. Please request a new OTP.'

      });

    }



    // Hash submitted OTP.

    const hashedOTP = crypto

      .createHash('sha256')

      .update(otp)

      .digest('hex');



    // Compare hashes safely.

    const submittedBuffer = Buffer.from(hashedOTP, 'hex');

    const storedBuffer = Buffer.from(user.emailOTP, 'hex');



    const isValidOTP =

      submittedBuffer.length === storedBuffer.length &&

      crypto.timingSafeEqual(submittedBuffer, storedBuffer);



    if (!isValidOTP) {

      user.emailOTPAttempts += 1;



      const remainingAttempts = Math.max(

        0,

        5 - user.emailOTPAttempts

      );



      if (user.emailOTPAttempts >= 5) {

        user.emailOTP = null;

        user.emailOTPExpires = null;

      }



      await user.save();



      return res.status(400).json({

        message: user.emailOTPAttempts >= 5

          ? 'Maximum OTP attempts exceeded. Please request a new OTP.'

          : 'Incorrect OTP.',

        remainingAttempts

      });

    }



    // Verify email.

    user.isEmailVerified = true;



    // Clear OTP data.

    user.emailOTP = null;

    user.emailOTPExpires = null;

    user.emailOTPAttempts = 0;

    user.emailOTPResendAt = null;



    await user.save();



    // Check organization.

    const organization = await Organization.findById(

      user.organization

    );



    if (!organization || !organization.isActive) {

      return res.status(403).json({

        message: 'Your organization is unavailable.'

      });

    }



    // Generate JWT after successful verification.

    const token = generateToken(user);



    setTokenCookie(res, token);



    return res.status(200).json({

      message: 'Email verified successfully. Welcome to TeamOrbit!',



      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,



        organization: {

          id: organization._id,

          name: organization.name,

          slug: organization.slug

        }

      }

    });



  } catch (error) {

    next(error);

  }

});






// ============================================
// RESEND EMAIL OTP
// ============================================

router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        message: 'Please provide a valid email address.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // OTP fields are hidden by default in the User schema.
    const user = await User.findOne({
      email: normalizedEmail
    }).select('+emailOTPResendAt');

    // Avoid revealing whether an account exists.
    const genericResponse = {
      message: 'If an unverified account exists, a new OTP will be sent.'
    };

    if (!user || user.isEmailVerified || !user.isActive) {
      return res.status(200).json(genericResponse);
    }

    const now = Date.now();
    const resendAt = user.emailOTPResendAt
      ? new Date(user.emailOTPResendAt).getTime()
      : 0;

    if (resendAt > now) {
      const remainingSeconds = Math.ceil((resendAt - now) / 1000);
      return res.status(429).json({
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        remainingSeconds
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    user.emailOTP = hashedOTP;
    user.emailOTPExpires = new Date(now + 5 * 60 * 1000);
    user.emailOTPAttempts = 0;
    user.emailOTPResendAt = new Date(now + 60 * 1000);
    await user.save();

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your TeamOrbit Email Verification OTP',
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; color: #333;">
                        <h2 style="color: #4f46e5;">TeamOrbit Email Verification</h2>
                        <p>Hello ${user.name},</p>
                        <p>Here is your new email verification OTP:</p>
                        <div style="background: #f5f3ff; padding: 20px; text-align: center; border-radius: 10px; margin: 25px 0;">
                            <h1 style="letter-spacing: 8px; color: #4f46e5; margin: 0;">${otp}</h1>
                        </div>
                        <p>This OTP expires in <strong>5 minutes</strong>.</p>
                        <p>If you did not request this code, you can ignore this email.</p>
                        <p>TeamOrbit Team</p>
                    </div>
                `
      });
    } catch (emailError) {
      user.emailOTP = null;
      user.emailOTPExpires = null;
      user.emailOTPAttempts = 0;
      user.emailOTPResendAt = null;
      await user.save();

      console.error('Resend OTP email failed:', emailError.message);
      return res.status(500).json({
        message: 'Unable to send the verification email. Please try again later.'
      });
    }

    return res.status(200).json({
      message: 'A new verification OTP has been sent to your email.',
      cooldownSeconds: 60
    });
  } catch (error) {
    next(error);
  }
});


// ============================================

// PUBLIC EMPLOYEE REGISTRATION DISABLED

// ============================================



router.post('/register', (req, res) => {

  return res.status(403).json({

    message: 'Please join your organization using an invitation.'

  });

});





// ============================================

// FORGOT PASSWORD

// ============================================



router.post('/forgot-password', async (req, res, next) => {

  try {

    const { email } = req.body;



    if (!email || typeof email !== 'string') {

      return res.status(400).json({

        message: 'Please provide a valid email address.'

      });

    }



    const normalizedEmail = email.toLowerCase().trim();



    const user = await User.findOne({

      email: normalizedEmail,

      isActive: true

    });



    // Prevent email enumeration.

    const successResponse = {

      message: 'If an account exists with this email, a password reset link has been sent.'

    };



    if (!user) {

      return res.status(200).json(successResponse);

    }



    // Generate secure reset token.

    const resetToken = crypto.randomBytes(32).toString('hex');



    const hashedResetToken = crypto

      .createHash('sha256')

      .update(resetToken)

      .digest('hex');



    user.resetPasswordToken = hashedResetToken;

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;



    await user.save();



    const frontendUrl = process.env.CLIENT_URL;



    if (!frontendUrl) {

      throw new Error('CLIENT_URL is not configured.');

    }



    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;



    try {

      await sendEmail({

        to: user.email,

        subject: 'Reset Your TeamOrbit Password',

        html: `

                    <div style="

                        font-family: Arial, sans-serif;

                        max-width: 600px;

                        margin: auto;

                        padding: 25px;

                    ">



                        <h2 style="color: #2563eb;">

                            TeamOrbit Password Reset

                        </h2>



                        <p>Hello ${user.name},</p>



                        <p>

                            We received a request to reset your

                            TeamOrbit account password.

                        </p>



                        <p>

                            Click the button below to create a new password:

                        </p>



                        <a

                            href="${resetUrl}"

                            style="

                                display: inline-block;

                                padding: 12px 24px;

                                background: #2563eb;

                                color: white;

                                text-decoration: none;

                                border-radius: 6px;

                            "

                        >

                            Reset Password

                        </a>



                        <p>This link expires in 15 minutes.</p>



                        <p>

                            If you did not request a password reset,

                            you can ignore this email.

                        </p>



                        <p>TeamOrbit Team</p>



                    </div>

                `

      });



    } catch (emailError) {

      user.resetPasswordToken = null;

      user.resetPasswordExpires = null;



      await user.save();



      console.error(

        'Password reset email failed:',

        emailError.message

      );

    }



    return res.status(200).json(successResponse);



  } catch (error) {

    next(error);

  }

});





// ============================================

// RESET PASSWORD

// ============================================



router.post('/reset-password/:token', async (req, res, next) => {

  try {

    const { token } = req.params;

    const { password } = req.body;



    if (!token || !password) {

      return res.status(400).json({

        message: 'Reset token and new password are required.'

      });

    }



    if (typeof password !== 'string' || password.length < 8) {

      return res.status(400).json({

        message: 'Password must contain at least 8 characters.'

      });

    }



    const hashedToken = crypto

      .createHash('sha256')

      .update(token)

      .digest('hex');



    const user = await User.findOne({

      resetPasswordToken: hashedToken,

      resetPasswordExpires: { $gt: Date.now() }

    }).select(

      '+resetPasswordToken +resetPasswordExpires'

    );



    if (!user) {

      return res.status(400).json({

        message: 'Password reset link is invalid or has expired.'

      });

    }



    user.password = await bcrypt.hash(password, 10);



    // Invalidate reset token.

    user.resetPasswordToken = null;

    user.resetPasswordExpires = null;



    await user.save();



    return res.status(200).json({

      message: 'Password reset successful. Please log in with your new password.'

    });



  } catch (error) {

    next(error);

  }

});





// ============================================

// LOGIN

// ============================================



router.post('/login', async (req, res, next) => {

  try {

    const { email, password } = req.body;



    if (!email || !password) {

      return res.status(400).json({

        message: 'Email and password are required.'

      });

    }



    const user = await User.findOne({

      email: email.toLowerCase().trim()

    }).select('+password');



    if (!user || !(await bcrypt.compare(password, user.password))) {

      return res.status(401).json({

        message: 'Invalid email or password.'

      });

    }



    if (!user.isActive) {

      return res.status(403).json({

        message: 'Your account has been deactivated.'

      });

    }



    // Block unverified accounts.

    if (!user.isEmailVerified) {

      return res.status(403).json({

        message: 'Please verify your email before logging in.',

        requiresEmailVerification: true,

        email: user.email

      });

    }



    let organization = null;



    if (user.role === 'superadmin') {



      if (user.organization) {

        organization = await Organization.findById(

          user.organization

        );

      }



    } else {



      if (!user.organization) {

        return res.status(403).json({

          message: 'Your account is not linked to an organization.'

        });

      }



      organization = await Organization.findById(

        user.organization

      );



      if (!organization || !organization.isActive) {

        return res.status(403).json({

          message: 'Your organization is unavailable.'

        });

      }

    }



    const token = generateToken(user);



    setTokenCookie(res, token);



    return res.json({

      message: 'Login successful.',



      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,



        organization: organization ? {

          id: organization._id,

          name: organization.name,

          slug: organization.slug

        } : null

      }

    });



  } catch (error) {

    next(error);

  }

});





// ============================================

// LOGOUT

// ============================================



router.post('/logout', (req, res) => {

  res.clearCookie('token', {

    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'lax'

  });



  res.json({

    message: 'Logged out successfully.'

  });

});





// ============================================

// CURRENT USER

// ============================================



router.get('/me', auth, async (req, res, next) => {

  try {

    let organization = null;



    if (req.user.organization) {

      organization = await Organization.findById(

        req.user.organization

      ).select('name slug');

    }



    res.json({

      user: {

        id: req.user._id,

        name: req.user.name,

        email: req.user.email,

        role: req.user.role,

        isActive: req.user.isActive,

        avatar: req.user.avatar,



        organization: organization ? {

          id: organization._id,

          name: organization.name,

          slug: organization.slug

        } : null

      }

    });



  } catch (error) {

    next(error);

  }

});

module.exports = router;