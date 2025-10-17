const Memo = require('../models/Memo');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Helper function to filter fields that are allowed to be updated
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// File-based storage for development
const DATA_FILE = path.join(__dirname, '..', 'data', 'memos.json');
let memos = [];
let nextId = 1;

// Initialize data directory and file
const initializeDataFile = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify({ memos: [], nextId: 1 }));
  }

  // Load existing data
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    memos = parsed.memos || [];
    nextId = parsed.nextId || 1;
  } catch (error) {
    console.log('Initializing new data file');
    memos = [];
    nextId = 1;
  }
};

// Save data to file
const saveData = async () => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify({ memos, nextId }));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Check if database is connected
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

exports.getAllMemos = catchAsync(async (req, res, next) => {
  // Initialize data file if needed
  await initializeDataFile();

  if (isDatabaseConnected()) {
    // Use database
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Memo.find(JSON.parse(queryStr));

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-isPinned -updatedAt');
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const dbMemos = await query;

    res.status(200).json({
      status: 'success',
      results: dbMemos.length,
      data: {
        memos: dbMemos
      }
    });
  } else {
    // Use file-based storage
    const filteredMemos = memos.filter(memo => memo.user === req.user.id);

    res.status(200).json({
      status: 'success',
      results: filteredMemos.length,
      data: {
        memos: filteredMemos
      }
    });
  }
});

exports.createMemo = catchAsync(async (req, res, next) => {
  // Initialize data file if needed
  await initializeDataFile();

  if (isDatabaseConnected()) {
    // Use database
    const filteredBody = filterObj(
      req.body,
      'title',
      'content',
      'tags',
      'isPinned'
    );

    filteredBody.user = req.user.id;

    const newMemo = await Memo.create(filteredBody);

    res.status(201).json({
      status: 'success',
      data: {
        memo: newMemo
      }
    });
  } else {
    // Use file-based storage
    const newMemo = {
      _id: nextId.toString(),
      title: req.body.title || 'Untitled Note',
      content: req.body.content || 'Start writing your note here...',
      tags: req.body.tags || [],
      isPinned: req.body.isPinned || false,
      user: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memos.push(newMemo);
    nextId++;

    // Save to file
    await saveData();

    res.status(201).json({
      status: 'success',
      data: {
        memo: newMemo
      }
    });
  }
});

exports.getMemo = catchAsync(async (req, res, next) => {
  // Initialize data file if needed
  await initializeDataFile();

  if (isDatabaseConnected()) {
    const memo = await Memo.findById(req.params.id);

    if (!memo) {
      return next(new AppError('No memo found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        memo
      }
    });
  } else {
    const memo = memos.find(m => m._id === req.params.id && m.user === req.user.id);

    if (!memo) {
      return next(new AppError('No memo found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        memo
      }
    });
  }
});

exports.updateMemo = catchAsync(async (req, res, next) => {
  // Initialize data file if needed
  await initializeDataFile();

  if (isDatabaseConnected()) {
    const filteredBody = filterObj(
      req.body,
      'title',
      'content',
      'tags',
      'isPinned'
    );

    filteredBody.updatedAt = Date.now();

    const updatedMemo = await Memo.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedMemo) {
      return next(new AppError('No memo found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        memo: updatedMemo
      }
    });
  } else {
    const memoIndex = memos.findIndex(m => m._id === req.params.id && m.user === req.user.id);

    if (memoIndex === -1) {
      return next(new AppError('No memo found with that ID', 404));
    }

    // Update the memo
    memos[memoIndex] = {
      ...memos[memoIndex],
      ...req.body,
      updatedAt: new Date()
    };

    // Save to file
    await saveData();

    res.status(200).json({
      status: 'success',
      data: {
        memo: memos[memoIndex]
      }
    });
  }
});

exports.deleteMemo = catchAsync(async (req, res, next) => {
  // Initialize data file if needed
  await initializeDataFile();

  if (isDatabaseConnected()) {
    const memo = await Memo.findByIdAndDelete(req.params.id);

    if (!memo) {
      return next(new AppError('No memo found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } else {
    const memoIndex = memos.findIndex(m => m._id === req.params.id && m.user === req.user.id);

    if (memoIndex === -1) {
      return next(new AppError('No memo found with that ID', 404));
    }

    memos.splice(memoIndex, 1);

    // Save to file
    await saveData();

    res.status(204).json({
      status: 'success',
      data: null
    });
  }
});

exports.getUserMemos = exports.getAllMemos;

exports.searchMemos = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new AppError('Please provide a search query', 400));
  }

  // Initialize data file if needed
  await initializeDataFile();

  if (isDatabaseConnected()) {
    const memos = await Memo.find({
      $and: [
        { user: req.user.id },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
          ]
        }
      ]
    }).sort('-isPinned -updatedAt');

    res.status(200).json({
      status: 'success',
      results: memos.length,
      data: {
        memos
      }
    });
  } else {
    const filteredMemos = memos
      .filter(memo => memo.user === req.user.id)
      .filter(memo =>
        memo.title.toLowerCase().includes(query.toLowerCase()) ||
        memo.content.toLowerCase().includes(query.toLowerCase()) ||
        (memo.tags && memo.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
      )
      .sort((a, b) => {
        // Sort by isPinned first, then by updatedAt
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

    res.status(200).json({
      status: 'success',
      results: filteredMemos.length,
      data: {
        memos: filteredMemos
      }
    });
  }
});

exports.getMemo = catchAsync(async (req, res, next) => {
  if (isDatabaseConnected()) {
    const memo = await Memo.findById(req.params.id);

    if (!memo) {
      return next(new AppError('No memo found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        memo
      }
    });
  } else {
    const memo = memos.find(m => m._id === req.params.id && m.user === req.user.id);

    if (!memo) {
      return next(new AppError('No memo found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        memo
      }
    });
  }
});
