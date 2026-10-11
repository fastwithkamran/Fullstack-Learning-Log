import { ID } from "react-native-appwrite";
import databaseService from "./databaseService";

// Appwrite database and collection id
const dbId = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
const colId = process.env.EXPO_PUBLIC_APPWRITE_COL_NOTES_ID;

const noteService = {
  // Get Notes
  async getNotes() {
    const response = await databaseService.listDocuments(dbId, colId);

    if (response.error) {
      return { error: response.error };
    }

    return { data: response };
  },
  // Add Note
  async addNote(text) {
    if (!text) return { error: "Note is empty" };

    const data = {
      text: text,
    };

    const response = await databaseService.createDocument(
      dbId,
      colId,
      ID.unique(),
      data,
    );

    if (response?.error) return { error: response.error };

    return { data: response };
  },
};

export default noteService;
