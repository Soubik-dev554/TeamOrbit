const express = require('express');
const mongoose = require('mongoose');

const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

const router = express.Router();

router.use(auth);

// Get the correct project access filter.
const getProjectFilter = (user) => {
  if (user.role === 'admin') {
    return {
      organization: user.organization
    };
  }

  return {
    owner: user._id
  };
};

// Get all projects
router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'admin' && !req.user.organization) {
      return res.status(403).json({
        message: 'Your account is not associated with an organization.'
      });
    }

    const projects = await Project.find(
      getProjectFilter(req.user)
    ).sort({ updatedAt: -1 });

    res.json({ projects });

  } catch (error) {
    next(error);
  }
});

// Create project
router.post('/', async (req, res, next) => {
  try {
    const { name, description = '', status = 'active' } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: 'Project name is required.'
      });
    }

    if (!req.user.organization) {
      return res.status(403).json({
        message: 'Your account is not associated with an organization.'
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description,
      status,
      owner: req.user._id,
      organization: req.user.organization
    });

    await logActivity({
      user: req.user._id,
      organization: project.organization,
      action: 'PROJECT_CREATED',
      description: `Created project "${project.name}".`,
      relatedProject: project._id
    });

    res.status(201).json({ project });

  } catch (error) {
    next(error);
  }
});

// Get project details
router.get('/:id', async (req, res, next) => {
  try {
    const projectId = req.params.id;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        message: 'Invalid project id.'
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      ...getProjectFilter(req.user)
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }

    const taskFilter = {
      project: project._id
    };

    if (req.user.role === 'admin') {
      taskFilter.organization = req.user.organization;
    }

    const tasks = await Task.find(taskFilter)
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      project,
      tasks
    });

  } catch (error) {
    next(error);
  }
});

// Update project
router.patch('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid project id.'
      });
    }

    const allowedFields = {};

    ['name', 'description', 'status'].forEach((field) => {
      if (req.body[field] !== undefined) {
        allowedFields[field] = req.body[field];
      }
    });

    if (
      allowedFields.name !== undefined &&
      !allowedFields.name.trim()
    ) {
      return res.status(400).json({
        message: 'Project name cannot be empty.'
      });
    }

    if (allowedFields.name !== undefined) {
      allowedFields.name = allowedFields.name.trim();
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ...getProjectFilter(req.user)
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }

    const previousValues = {
      name: project.name,
      description: project.description,
      status: project.status
    };

    Object.assign(project, allowedFields);

    await project.save();

    const changes = [];

    ['name', 'description', 'status'].forEach((field) => {
      if (
        allowedFields[field] !== undefined &&
        String(previousValues[field] ?? '') !==
          String(project[field] ?? '')
      ) {
        changes.push(field);
      }
    });

    if (changes.length > 0) {
      await logActivity({
        user: req.user._id,
        organization: project.organization,
        action: 'PROJECT_UPDATED',
        description: `Updated project "${project.name}". Changed: ${changes.join(', ')}.`,
        relatedProject: project._id
      });
    }

    res.json({ project });

  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid project id.'
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ...getProjectFilter(req.user)
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found.'
      });
    }

    await logActivity({
      user: req.user._id,
      organization: project.organization,
      action: 'PROJECT_DELETED',
      description: `Deleted project "${project.name}".`,
      relatedProject: project._id
    });

    await Task.deleteMany({
      project: project._id,
      organization: project.organization
    });

    await Project.deleteOne({
      _id: project._id,
      organization: project.organization
    });

    res.json({
      message: 'Project and its tasks deleted.'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;