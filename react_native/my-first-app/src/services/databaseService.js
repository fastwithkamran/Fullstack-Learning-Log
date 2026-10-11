import { database } from "./appwrite";

const databaseService = {
  // list documents
  async listDocuments(dbId, colId) {
    try {
      const response = await database.listDocuments(dbId, colId);
      return response.documents;
    } catch (error) {
      console.error(error.message);
      return { error: error.message };
    }
  },

  // Create Document
  async createDocument(dbId, colId, id, data) {
    try {
      return await database.createDocument(dbId, colId, id || undefined, data);
    } catch (error) {
      console.error(error.message);
      return {
        errror: error.message,
      };
    }
  },

  // Delete Document
  async deleteDocument(dbId, colId, id) {
    try {
      await database.deleteDocument(dbId, colId, id);
      return { success: true };
    } catch (error) {
      console.error(error.message);
      return {
        error: error.message,
      };
    }
  },
};

export default databaseService;
