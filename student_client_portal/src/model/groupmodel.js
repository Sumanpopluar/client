class Group {
    constructor(groupName, projectTitle, description, students, client, teacher, file) {
      this.groupName = groupName;
      this.projectTitle = projectTitle;
      this.description = description;
      this.students = students; // Array of student objects { studentId, name, email }
      this.client = client;     // Client object { clientId, name, email }
      this.teacher = teacher;   // Teacher object { teacherId, name, email }
      this.file = file;         // File object { fileURL, fileName, fileType }
      this.createdAt = new Date();  // Automatically set the creation date
      this.updatedAt = new Date();  // Automatically set the update date
    }
  
    // Method to create a Firestore-compatible object
    toFirestore() {
      return {
        groupName: this.groupName,
        projectTitle: this.projectTitle,
        description: this.description,
        students: this.students,
        client: this.client,
        teacher: this.teacher,
        file: this.file,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  
    // Static method to create a Group instance from Firestore data
    static fromFirestore(data) {
      return new Group(
        data.groupName,
        data.projectTitle,
        data.description,
        data.students,
        data.client,
        data.teacher,
        data.file
      );
    }
  
    // Method to update the group
    updateGroup(updatedData) {
      if (updatedData.groupName) this.groupName = updatedData.groupName;
      if (updatedData.projectTitle) this.projectTitle = updatedData.projectTitle;
      if (updatedData.description) this.description = updatedData.description;
      if (updatedData.students) this.students = updatedData.students;
      if (updatedData.client) this.client = updatedData.client;
      if (updatedData.teacher) this.teacher = updatedData.teacher;
      if (updatedData.file) this.file = updatedData.file;
      this.updatedAt = new Date(); // Update the updatedAt field
    }
  }
  