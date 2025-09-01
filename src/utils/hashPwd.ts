import bcrypt from "bcryptjs";

export const hashPwd = async (pwd: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(pwd, salt);
    return hashedPwd;
  } catch (error) {
    console.log("error hashing password", error);
    throw error;
  }
};
