'use strict';

const LetterPage = require('../models/LetterPage');
const { createError } = require('../middleware/errorHandler');

// ─── Slug generation ──────────────────────────────────────────────────────────

/**
 * Generate a URL-safe slug from the title.
 * Appends a random 4-char suffix on first attempt to avoid race conditions.
 * If a duplicate key error occurs, retries with a new random suffix.
 */
function buildSlug(base, suffix = '') {
  let slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  if (!slug) slug = 'letter';
  return suffix ? `${slug}-${suffix}` : slug;
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6); // 4 random alphanumeric chars
}

// ─── GET /api/letters ─────────────────────────────────────────────────────────

async function getLetters(req, res, next) {
  try {
    const letters = await LetterPage.find({ coupleId: req.user.coupleId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: letters });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/letters/:id ─────────────────────────────────────────────────────

async function getLetter(req, res, next) {
  try {
    const letter = await LetterPage.findOne({
      _id: req.params.id,
      coupleId: req.user.coupleId,
    }).populate('createdBy', 'name');

    if (!letter) return next(createError('Letter not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: letter });
  } catch (err) {
    next(err);
  }
}

// ─── GET /api/letters/slug/:slug ──────────────────────────────────────────────
// Both members of the couple can view a letter by its slug.
// Third parties are blocked because we always scope to req.user.coupleId.

async function getLetterBySlug(req, res, next) {
  try {
    const letter = await LetterPage.findOne({
      slug:     req.params.slug,
      coupleId: req.user.coupleId,
    }).populate('createdBy', 'name');

    if (!letter) return next(createError('Letter not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: letter });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/letters ────────────────────────────────────────────────────────

async function createLetter(req, res, next) {
  const MAX_ATTEMPTS = 5;
  const { title, templateId, content } = req.body;
  // NOTE: images is intentionally excluded — letters use a separate image upload flow if added later

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      // First attempt uses slug without suffix; retries add a random suffix to resolve races
      const slug = attempt === 0
        ? buildSlug(title)
        : buildSlug(title, randomSuffix());

      // eslint-disable-next-line no-await-in-loop
      const letter = await LetterPage.create({
        coupleId:  req.user.coupleId,
        slug,
        title:     title.trim(),
        templateId: templateId || 'classic',
        content:   content || { greeting: '', body: '', closing: '' },
        createdBy: req.user._id,
      });

      return res.status(201).json({ success: true, data: letter });
    } catch (err) {
      // Duplicate slug — retry with a new random suffix
      if (err.code === 11000 && attempt < MAX_ATTEMPTS - 1) continue;
      return next(err);
    }
  }
}

// ─── PATCH /api/letters/:id ───────────────────────────────────────────────────

async function updateLetter(req, res, next) {
  try {
    const { title, templateId, content } = req.body;
    // NOTE: images excluded intentionally

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (templateId !== undefined) updates.templateId = templateId;
    if (content !== undefined) updates.content = content;

    const letter = await LetterPage.findOneAndUpdate(
      { _id: req.params.id, coupleId: req.user.coupleId },
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!letter) return next(createError('Letter not found', 404, 'NOT_FOUND'));
    return res.json({ success: true, data: letter });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /api/letters/:id ──────────────────────────────────────────────────

async function deleteLetter(req, res, next) {
  try {
    const letter = await LetterPage.findOneAndDelete({
      _id: req.params.id,
      coupleId: req.user.coupleId,
    });
    if (!letter) return next(createError('Letter not found', 404, 'NOT_FOUND'));

    return res.json({ success: true, data: { message: 'Letter deleted' } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLetters,
  getLetter,
  getLetterBySlug,
  createLetter,
  updateLetter,
  deleteLetter,
};
