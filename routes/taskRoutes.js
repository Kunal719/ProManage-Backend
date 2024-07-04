const express = require('express');
const router = express.Router();

const {authenticateUser} = require('../middleware/authentication');

const {createTask,
       getTask,
       updateTask,
       deleteTask,
       getUserTasks,
       changeTaskType,
       setSubTaskCheck,
       getCountOfStatusAndPriority,
       getAssigneeEmailsByTask} = require('../controllers/taskController');

// create task
router.route('/:userId/createTask').post(authenticateUser, createTask);

// get task
router.route('/:taskId').get(getTask);

// get user tasks
router.route('/allTasks/:userId').get(authenticateUser, getUserTasks);

// update task
router.route('/updateTask/:taskId').patch(authenticateUser, updateTask);

// change task type
router.route('/changeTaskType/:taskId').patch(authenticateUser, changeTaskType);

// change checked sub task
router.route('/setSubTaskCheck/:taskId').patch(authenticateUser, setSubTaskCheck);

// get count of status and priority
router.route('/:userId/getStatusPriorityCount').get(authenticateUser, getCountOfStatusAndPriority);

// get assigned emails by task
router.route('/getAssigneeEmailsByTask/:taskId').get(authenticateUser, getAssigneeEmailsByTask);

// delete task
router.route('/deleteTask/:taskId').delete(authenticateUser, deleteTask);

module.exports = router;