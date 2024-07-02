const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Task = require('../models/Task');
const User = require('../models/User');
const { checkPermissions } = require('../util');

const createTask = async (req, res) => {
  const { title, priority, assignNow, checklist, dueDate } = req.body;
  const { userId } = req.params;

  if (!title || !priority || !checklist) {
    throw new CustomError.BadRequestError('Please provide values for mandatory fields');
  }

  // Check if user exists (creating user)
  const creatingUser = await User.findById(userId);
  if (!creatingUser) {
    throw new CustomError.UnauthenticatedError('User not found');
  }

  // Find user by email (if provided for assignment)
  let assignedUser = null;
  if (assignNow !== "") {
    assignedUser = await User.findOne({ email: assignNow });
    if (!assignedUser) {
      throw new CustomError.NotFoundError('Assigned user not found');
    }
  }

  if(checklist.length === 0) {
    throw new CustomError.BadRequestError('Checklist must have at least one sub-task');
  }
  // Create the task
  const newTask = await Task.create({
    title,
    priority,
    assignTo: [assignedUser?._id], // Use assignedUser ID if found
    checklist,
    dueDate,
    createdBy: creatingUser._id, // Reference to the creating user
  });

  // Update the user who created the task
  await User.findByIdAndUpdate(creatingUser._id, {
    $push: { tasks: newTask._id }, // Add task ID to user's tasks
  });

  // Update assigned user's tasks (if assigned user found)
  if (assignedUser) {
    await User.findByIdAndUpdate(assignedUser._id, {
      $push: { tasks: newTask._id }, // Add task ID to assigned user's tasks
    });
  }

  res.status(StatusCodes.CREATED).json({ task: newTask });
};


const getTask = async (req, res) => {
  const { taskId } = req.params; // Adjust based on where you send the ID from frontend

  // Check if task exists
  const task = await Task.findById(taskId);
  if (!task) {
    throw new CustomError.NotFoundError('Task not found');
  }

  res.status(StatusCodes.OK).json({ task });
};

const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body;

  // Check if user exists
  const user = await User.findById(req.user.userID);
  if (!user) {
    throw new CustomError.UnauthenticatedError('User not found');
  }

  // Check if task exists
  const task = await Task.findById(taskId).populate('assignTo'); // Populate assigned users

  if (!task) {
    throw new CustomError.NotFoundError('Task not found');
  }

  // Check authorization (creator only)
  checkPermissions(req.user, task.createdBy); // Use existing checkPermissions function

  if(updates.checklist.length === 0) {
    throw new CustomError.BadRequestError('Checklist must have at least one sub-task');
  }

  // Find users to be assigned now (if provided in updates.assignNow)
  let foundNewAssignedUser;
  if (updates.assignNow) {
    foundNewAssignedUser =  await User.findOne({ email: updates.assignNow });
    if (!foundNewAssignedUser) {
        throw new CustomError.NotFoundError('Assigned user not found');
      }
  }

    // Check if user is already assigned (considering both existing and provided emails)
    if (foundNewAssignedUser && task.assignTo.includes(foundNewAssignedUser._id.toString())) {
      throw new CustomError.BadRequestError('User is already assigned to this task');
    }

  // Update the task (including assignTo if provided)
  let updatedTask;
  if (foundNewAssignedUser) {
    updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { ...updates, assignTo: [...task.assignTo, foundNewAssignedUser._id]}}, // Update all fields including assignTo
      { new: true } // Return the updated document
    );
 }
 else{
    updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: { ...updates }}, // Update all fields
      { new: true } // Return the updated document
    );
 }

  // Update assigned users' tasks (if assigned users found)
  if (foundNewAssignedUser) {
      await User.findByIdAndUpdate(foundNewAssignedUser._id, {
            $push: { tasks: updatedTask._id }, // Add task ID to assigned user's tasks
          })
    }

  res.status(StatusCodes.OK).json({ task: updatedTask });
};


const changeTaskType = async (req, res) => {
  const { taskId } = req.params;
  const { newTaskType } = req.body;

  // Check if user exists
  const user = await User.findById(req.user.userID);
  if (!user) {
    throw new CustomError.UnauthenticatedError('User not found');
  }

  // Check if task exists
  const task = await Task.findById(taskId).populate('assignTo'); // Populate assignedTo users
  if (!task) {
    throw new CustomError.NotFoundError('Task not found');
  }

  // Check authorization (creator or assigned user)
  const isAuthorized = user._id.toString() === task.createdBy.toString() ||
                      task.assignTo.some(assignedUser => assignedUser._id.toString() === user._id.toString());
  if (!isAuthorized) {
    throw new CustomError.UnauthorizedError('You are not authorized to change this task type');
  }

  // Validate newTaskType
  if (!['To do', 'Backlog', 'In Progress', 'Done'].includes(newTaskType)) {
    throw new CustomError.BadRequestError('Invalid task type');
  }

  // Update the task (update only taskType)
  await Task.findByIdAndUpdate(
    taskId,
    { $set: { taskType: newTaskType } },
    { new: false } // Don't return the updated document (optional)
  );

  // Success response without updated task object
  res.status(StatusCodes.OK).json({ message: 'Task type updated successfully' });
};


const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  // Check if user exists
  const user = await User.findById(req.user.userID);
  if (!user) {
    throw new CustomError.UnauthenticatedError('User not found');
  }

  // Check if task exists
  const task = await Task.findById(taskId);
  if (!task) {
    throw new CustomError.NotFoundError('Task not found');
  }

  // Check if user created the task or not
  if (checkPermissions(req.user, task.createdBy)) {
    throw new CustomError.UnauthorizedError('You are not authorized to delete this task');
  }

  // Delete the task
  await Task.findByIdAndDelete(taskId);

  // Remove task ID from assigned user's tasks (if any)
  if (task.assignTo?.length) {
    const updatePromises = task.assignTo.map(async (assignedUserId) => {
      await User.findByIdAndUpdate(assignedUserId, {
        $pull: { tasks: taskId }, // Remove task ID from assigned user's tasks
      });
    });
    await Promise.all(updatePromises); // Wait for all updates to finish
  }

  // Remove task ID from user who created task
  await User.findByIdAndUpdate(task.createdBy, {
    $pull: { tasks: taskId }, // Remove task ID from user's tasks
  });

  res.status(StatusCodes.OK).json({}); // Task deleted successfully (no content)
};

const getUserTasks = async (req, res) => {
  const { userId } = req.params;
  // Only allow users to get their own tasks
  if(req.user.userID !== userId) {
    throw new CustomError.UnauthorizedError('You are not authorized to get the tasks');
  }
  const user = await User.findById(userId).populate('tasks');
  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }

  if(!user.tasks) {
    return res.status(StatusCodes.OK).json({ tasks: [] });
  }
  res.status(StatusCodes.OK).json({ tasks: user.tasks });
};

const setSubTaskCheck = async (req, res) => {
  const { taskId } = req.params;
  const { subTaskId, subTaskDone } = req.body;
  const user = await User.findById(req.user.userID);
  if (!user) {
    throw new CustomError.UnauthenticatedError('User not found');
  }
  const task = await Task.findById(taskId);
  if (!task) {
    throw new CustomError.NotFoundError('Task not found');
  }
  if (checkPermissions(req.user, task.createdBy)) {
    throw new CustomError.UnauthorizedError('You are not authorized to update this task');
  }

  const subTask = task.checklist.find(subTask => subTask._id.toString() === subTaskId);
  if (!subTask) {
    throw new CustomError.NotFoundError('Sub task not found');
  }
  subTask.done = subTaskDone;
  await task.save();
  res.status(StatusCodes.OK).json({ subTask });
}

module.exports = {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getUserTasks,
  changeTaskType,
  setSubTaskCheck
};
