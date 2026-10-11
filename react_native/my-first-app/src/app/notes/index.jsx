import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AddNoteModal from "@/components/AddNoteModal";
import NoteList from "@/components/NoteList";
import noteService from "@/services/noteService";
import { ActivityIndicator } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

const NoteScreen = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [notes, setNotes] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to login if user is not signed up
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    const response = await noteService.getNotes();

    if (response.error) {
      setError(response.error);
      Alert.alert("Error ", response.error);
    } else {
      setNotes(response.data);
      setError(null);
    }
    setLoading(false);
  };

  //   Add new Note
  const addNote = async () => {
    if (newNote.trim() === "") return;

    const response = await noteService.addNote(newNote);

    if (response?.error) Alert.alert("Error ", response.error);
    else setNotes([...notes, response.data]);

    setNewNote("");
    setModalVisible(false);
  };

  // Edit Note
  const editNote = async (id, newText) => {
    if (newText.trim() === "") {
      Alert.alert("Error", "Note text cannot be empty");
      return;
    }

    const response = await noteService.updateNote(id, newText);

    if (response.error) {
      Alert.alert("Error ", response.error);
    } else {
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.$id === id ? { ...note, text: response.data.text } : note,
        ),
      );
    }
  };

  // Delete Note
  const deleteNote = async (id) => {
    console.log(id);
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "delete",
          onPress: async () => {
            const response = await noteService.deleteNote(id);
            if (response.error) {
              Alert.alert("Error ", response.error);
            } else {
              setNotes(notes.filter((note) => note.$id !== id));
            }
          },
        },
      ],
      {
        cancelable: false,
      },
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>{error && <Text style={styles.errorText}>{error}</Text>}</>
      )}
      <NoteList notes={notes} onDelete={deleteNote} onEdit={editNote} />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Note</Text>
      </TouchableOpacity>

      {/* Modal */}
      <AddNoteModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        newNote={newNote}
        setNewNote={setNewNote}
        addNote={addNote}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
    fontSize: 16,
  },
});

export default NoteScreen;
