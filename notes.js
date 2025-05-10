let currentlyEditingId = null;
let db;
const DB_NAME = "GeologyNotesDB";
const STORE_NAME = "notes";


const initDB = () => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
    };
    
    request.onsuccess = (event) => {
        db = event.target.result;
        loadNotes(); // Load existing notes on page load
    };
};

const saveNote = () => {
    const noteInput = document.getElementById('noteInput');
    const noteText = noteInput.value.trim();
    
    if (noteText) {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        const noteData = {
            text: noteText,
            date: new Date().toISOString()
        };
        
        if (currentlyEditingId) {
            noteData.id = currentlyEditingId;
            store.put(noteData);
        } else {
            store.add(noteData);
        }
        
        transaction.oncomplete = () => {
            noteInput.value = "";
            currentlyEditingId = null;
            document.getElementById('saveBtn').textContent = 'Save Note';
            loadNotes();
        };
    }
};

const loadNotes = () => {
    const container = document.getElementById('notesContainer');
    container.innerHTML = "";
    
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
        request.result.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = "col-md-4";
            noteElement.innerHTML = `
                 <div class="card mb-3">
        <div class="card-body">
            <p class="card-text">${note.text}</p>
            <small class="text-muted">${new Date(note.date).toLocaleString()}</small>
            <div class="d-flex justify-content-end gap-2 mt-2">
                <button onclick="editNote(${note.id})" class="btn btn-sm btn-warning">Edit</button>
                <button onclick="deleteNote(${note.id})" class="btn btn-sm btn-danger">Delete</button>
            </div>
        </div>
    </div>
            `;
            container.appendChild(noteElement);
        });
    };
};

const deleteNote = (id) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    transaction.oncomplete = loadNotes; // Refresh after deletion
};

const editNote = (id) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => {
        const note = request.result;
        document.getElementById('noteInput').value = note.text;
        currentlyEditingId = id;
        document.getElementById('saveBtn').textContent = 'Update Note';
    };
};

document.addEventListener('DOMContentLoaded', () => {
    initDB();
    
    document.getElementById('saveBtn').addEventListener('click', saveNote);
    document.getElementById('clearBtn').addEventListener('click', () => {
        document.getElementById('noteInput').value = "";
        currentlyEditingId = null;
        document.getElementById('saveBtn').textContent = 'Save Note';
    });
});