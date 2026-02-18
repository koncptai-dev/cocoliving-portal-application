import RNOtpVerify from 'react-native-otp-verify';

/**
 * Gets SMS Retriever hash for OTP auto-read
 */
export const getHash = async (): Promise<void> => {
  try {
    const hash: string[] = await RNOtpVerify.getHash();
    console.log('HASH KEY:', hash);
  } catch (error: unknown) {
    console.log('Hash error:', error);
  }
};
