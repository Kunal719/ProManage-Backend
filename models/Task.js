const mongoose = require('mongoose');

const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  done: {
    type: Boolean,
    default: false,
  },
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    required: true,
    enum: ['High', 'Moderate', 'Low'],
  },
  assignTo: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
  },
  checklist: {
    type: [subTaskSchema],
    required: true,
    validate: [checklistLengthValidator, 'Checklist must have at least one sub-task'],
  },
  dueDate: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Reference to the creating User
  },
  createdAt: { // New field for creation time
    type: Date,
    default: Date.now, // Automatically set on document creation
  },
  taskType: {
    type: String,
    required: true,
    enum: ['To do', 'Backlog', 'In Progress', 'Done'],
    default: 'To do'
  }
});

// Custom validator for checklist length
function checklistLengthValidator(value) {
  return value.length > 0;
}

module.exports = mongoose.model('Task', taskSchema);