const sendEmail = async ({ to, subject, html }) => {
    try {
        const apiKey = process.env.BREVO_API_KEY?.trim();
        const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();

        if (!apiKey) {
            throw new Error(
                'BREVO_API_KEY is missing in environment variables.'
            );
        }

        if (!senderEmail) {
            throw new Error(
                'BREVO_SENDER_EMAIL is missing in environment variables.'
            );
        }

        if (typeof fetch !== 'function') {
            throw new Error(
                'Node.js fetch is unavailable. Use Node.js 18 or newer.'
            );
        }

        const response = await fetch(
            'https://api.brevo.com/v3/smtp/email',
            {
                method: 'POST',

                headers: {
                    accept: 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                },

                body: JSON.stringify({
                    sender: {
                        name: 'TeamOrbit',
                        email: senderEmail
                    },

                    to: [
                        {
                            email: to
                        }
                    ],

                    subject,
                    htmlContent: html
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error('Brevo API Error:', {
                status: response.status,
                message: result.message,
                code: result.code
            });

            throw new Error(
                result.message || 'Brevo failed to send the email.'
            );
        }

        console.log(
            'TeamOrbit email sent successfully:',
            result.messageId
        );

        return result;

    } catch (error) {
        console.error(
            'TeamOrbit Email Service Error:',
            error.message
        );

        throw error;
    }
};

module.exports = sendEmail;
