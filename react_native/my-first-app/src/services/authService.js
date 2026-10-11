import { ID } from "react-native-appwrite";
import { account } from "./appwrite";

const authService = {
  // Register a user
  async register(email, password) {
    try {
      const response = await account.create(ID.unique(), email, password);
      return response;
    } catch (error) {
      return { error: error.message || "Registration Failed!" };
    }
  },

  // Login a user
  async login(email, password) {
    try {
      const response = await account.createEmailPasswordSession(
        email,
        password,
      );
      return response;
    } catch (error) {
      return { error: error.message || "Wrong Credentials!" };
    }
  },

  // Get logged in user
  async getUser(email, password) {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  },

  // Logout User
  async logout() {
    try {
      await account.deleteSession("current");
    } catch (error) {
      return { error: error.message || "Logout failed!" };
    }
  },
};

export default authService;
