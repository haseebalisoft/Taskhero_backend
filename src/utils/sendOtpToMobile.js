import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendOtpToMobile = async (phone, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your verification code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone // e.g., +923001234567
    });

    console.log("OTP sent:", message.sid);
    return true;
  } catch (error) {
    console.error("Failed to send OTP:", error.message);
    return false;
  }
};
