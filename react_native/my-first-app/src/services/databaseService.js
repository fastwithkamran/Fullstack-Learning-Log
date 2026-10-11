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
};

export default databaseService;
